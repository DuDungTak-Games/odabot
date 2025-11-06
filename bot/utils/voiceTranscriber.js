const {
  joinVoiceChannel,
  getVoiceConnection,
  entersState,
  VoiceConnectionStatus,
  EndBehaviorType,
} = require('@discordjs/voice');
const prism = require('prism-media');
const { WebSocket } = require('ws');
const { randomUUID } = require('crypto');

const WORKER_WS_URL = process.env.STT_WORKER_WS_URL || 'ws://localhost:4002';
const FRAME_SIZE = 960; // 48kHz 기준 20ms 프레임 크기
const PCM_BYTES_PER_FRAME = FRAME_SIZE * 2 * 2; // 16비트 * 2채널

const clampInt16 = (value) => {
  if (value > 32767) return 32767;
  if (value < -32768) return -32768;
  return value;
};

/**
 * 48kHz 스테레오 PCM 데이터를 16kHz 모노 PCM으로 즉시 변환합니다.
 * 20ms 단위로 평균을 취하여 단순 다운샘플링하며, 실시간성을 위해
 * 최소한의 연산만 수행합니다.
 */
function toMono16k(frameBuffer) {
  if (frameBuffer.length !== PCM_BYTES_PER_FRAME) {
    throw new Error(`20ms 프레임(3840바이트)이 아닌 버퍼가 전달되었습니다: ${frameBuffer.length}바이트`);
  }

  const input = new Int16Array(
    frameBuffer.buffer,
    frameBuffer.byteOffset,
    frameBuffer.length / 2,
  );
  const stereoFrames = input.length / 2;
  const downsampledFrames = Math.floor(stereoFrames / 3);
  const output = Buffer.allocUnsafe(downsampledFrames * 2);

  let outIndex = 0;
  let readIndex = 0;
  for (let i = 0; i < downsampledFrames; i += 1) {
    const l0 = input[readIndex];
    const r0 = input[readIndex + 1];
    const l1 = input[readIndex + 2];
    const r1 = input[readIndex + 3];
    const l2 = input[readIndex + 4];
    const r2 = input[readIndex + 5];
    readIndex += 6;

    const mono0 = (l0 + r0) >> 1;
    const mono1 = (l1 + r1) >> 1;
    const mono2 = (l2 + r2) >> 1;
    const averaged = Math.trunc((mono0 + mono1 + mono2) / 3);
    output.writeInt16LE(clampInt16(averaged), outIndex);
    outIndex += 2;
  }

  return output;
}

class VoiceTranscriber {
  constructor() {
    this.client = null;
    this.boundReceivers = new Map();
    this.streams = new Map();
  }

  setClient(client) {
    this.client = client;
  }

  async handleVoiceStateUpdate(oldState, newState) {
    const client = this.client || newState.client;
    if (!this.client && client) {
      this.client = client;
    }

    if (!client || !client.user || newState.id !== client.user.id) {
      return;
    }

    if (newState.channelId && newState.channelId !== oldState.channelId) {
      await this.startListening(newState);
      return;
    }

    if (!newState.channelId) {
      this.stopListening(oldState.guild.id);
    }
  }

  async startListening(voiceState) {
    const channel = voiceState.channel;
    if (!channel) return;

    let connection = getVoiceConnection(channel.guild.id);
    if (connection && connection.joinConfig.channelId !== channel.id) {
      connection.destroy();
      connection = null;
    }

    if (!connection) {
      try {
        connection = joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator,
          selfDeaf: false,
          selfMute: false,
        });
      } catch (error) {
        console.error('음성 채널 접속 실패:', error);
        return;
      }
    }

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    } catch (error) {
      console.error('음성 연결 준비 실패:', error);
      return;
    }

    this.bindReceiver(connection, channel);
  }

  stopListening(guildId) {
    const connection = getVoiceConnection(guildId);
    if (connection) {
      connection.destroy();
    }

    const binding = this.boundReceivers.get(guildId);
    if (binding) {
      binding.cleanup();
      this.boundReceivers.delete(guildId);
    }

    for (const [key, stream] of this.streams.entries()) {
      if (key.startsWith(`${guildId}:`)) {
        this.teardownStream(key, stream, '봇이 음성 채널을 떠나면서 종료되었습니다.');
      }
    }
  }

  bindReceiver(connection, channel) {
    const guildId = channel.guild.id;
    if (this.boundReceivers.has(guildId)) {
      return;
    }

    const speaking = connection.receiver.speaking;
    const onStart = (userId) => this.handleSpeechStart(connection, channel, userId);
    const onEnd = (userId) => this.handleSpeechStop(guildId, userId, 'Discord speaking 이벤트 종료');

    speaking.on('start', onStart);
    speaking.on('end', onEnd);

    const cleanup = () => {
      speaking.off('start', onStart);
      speaking.off('end', onEnd);
    };

    connection.on('stateChange', (_oldState, newState) => {
      if (newState.status === VoiceConnectionStatus.Destroyed) {
        cleanup();
        this.boundReceivers.delete(guildId);
      }
    });

    this.boundReceivers.set(guildId, { cleanup });
  }

  handleSpeechStart(connection, channel, userId) {
    const botId = this.client?.user?.id;
    if (botId && userId === botId) {
      return;
    }

    const key = `${channel.guild.id}:${userId}`;
    if (this.streams.has(key)) {
      return;
    }

    const opusStream = connection.receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.Manual },
    });

    const decoder = new prism.opus.Decoder({
      frameSize: FRAME_SIZE,
      channels: 2,
      rate: 48_000,
    });

    const sessionId = randomUUID();
    const ws = new WebSocket(WORKER_WS_URL);
    const state = {
      guildId: channel.guild.id,
      channelId: channel.id,
      userId,
      sessionId,
      ws,
      opusStream,
      decoder,
      partialPCM: Buffer.alloc(0),
      queuedChunks: [],
      ready: false,
    };

    const sendBinary = (payload) => {
      if (state.ready && ws.readyState === WebSocket.OPEN) {
        ws.send(payload, { binary: true });
        return;
      }
      state.queuedChunks.push(payload);
    };

    ws.on('open', () => {
      state.ready = true;
      ws.send(
        JSON.stringify({
          type: 'start',
          sessionId,
          guildId: channel.guild.id,
          channelId: channel.id,
          userId,
          sampleRate: 16_000,
          format: 's16le',
          chunkMillis: 20,
        }),
      );
      for (const chunk of state.queuedChunks.splice(0)) {
        ws.send(chunk, { binary: true });
      }
    });

    ws.on('error', (error) => {
      console.error('STT 워커 WebSocket 오류:', error);
      this.handleSpeechStop(channel.guild.id, userId, 'WebSocket 오류 발생');
    });

    ws.on('close', () => {
      this.handleSpeechStop(channel.guild.id, userId, 'STT 워커와의 WebSocket 연결이 종료되었습니다.');
    });

    const handleOpusError = (error) => {
      console.error('Opus 스트림 오류:', error);
      this.handleSpeechStop(channel.guild.id, userId, 'Opus 스트림 오류 발생');
    };

    const handleDecoderError = (error) => {
      console.error('PCM 디코더 오류:', error);
      this.handleSpeechStop(channel.guild.id, userId, 'PCM 디코더 오류 발생');
    };

    opusStream.on('error', handleOpusError);
    decoder.on('error', handleDecoderError);

    decoder.on('data', (pcmChunk) => {
      const merged = Buffer.concat([state.partialPCM, pcmChunk]);
      let offset = 0;
      while (offset + PCM_BYTES_PER_FRAME <= merged.length) {
        const frame = merged.subarray(offset, offset + PCM_BYTES_PER_FRAME);
        offset += PCM_BYTES_PER_FRAME;
        try {
          const mono = toMono16k(frame);
          sendBinary(mono);
        } catch (error) {
          console.error('PCM 프레임 변환 오류:', error);
        }
      }
      state.partialPCM = merged.subarray(offset);
    });

    opusStream.once('end', () => {
      this.handleSpeechStop(channel.guild.id, userId, 'Opus 스트림이 종료되었습니다.');
    });

    opusStream.pipe(decoder);

    this.streams.set(key, state);
  }

  handleSpeechStop(guildId, userId, reason) {
    const key = `${guildId}:${userId}`;
    const stream = this.streams.get(key);
    if (!stream) {
      return;
    }
    this.teardownStream(key, stream, reason);
  }

  teardownStream(key, stream, reason) {
    const {
      ws,
      opusStream,
      decoder,
      sessionId,
      partialPCM,
    } = stream;

    try {
      opusStream?.unpipe(decoder);
    } catch (error) {
      // unpipe 중 오류는 무시
    }

    opusStream?.destroy();
    decoder?.destroy();

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'stop',
          sessionId,
          reason,
          remainingBytes: partialPCM?.length || 0,
        }),
      );
      ws.close();
    } else if (ws?.readyState === WebSocket.CONNECTING) {
      ws.once('open', () => {
        ws.send(
          JSON.stringify({
            type: 'stop',
            sessionId,
            reason,
            remainingBytes: partialPCM?.length || 0,
          }),
        );
        ws.close();
      });
    }

    this.streams.delete(key);
  }
}

module.exports = new VoiceTranscriber();
