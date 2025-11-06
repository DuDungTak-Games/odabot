const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');
const { WebSocketServer } = require('ws');
const axios = require('axios');
const { randomUUID } = require('crypto');
require('dotenv').config();

const WORKER_PORT = Number(process.env.STT_WORKER_PORT || 4002);
const API_ENDPOINT = process.env.STT_PARTIAL_ENDPOINT || 'http://localhost:3001/api/stt/partial';
const WHISPER_BIN = process.env.WHISPER_BIN || path.resolve(process.cwd(), 'whisper.cpp/main');
const WHISPER_MODEL = process.env.WHISPER_MODEL || path.resolve(process.cwd(), 'models/ggml-base.bin');
const WHISPER_LANGUAGE = process.env.WHISPER_LANGUAGE;
const EXTRA_ARGS = process.env.WHISPER_ARGS ? process.env.WHISPER_ARGS.split(' ').filter(Boolean) : [];

/**
 * whisper.cpp 프로세스를 스트리밍 모드로 실행합니다.
 */
function launchWhisper(sampleRate) {
  const baseArgs = [
    '-m',
    WHISPER_MODEL,
    '--stream',
    '--no-timestamps',
    '--sample-rate',
    String(sampleRate),
    '-f',
    '-',
  ];

  if (WHISPER_LANGUAGE) {
    baseArgs.push('--language', WHISPER_LANGUAGE);
  }

  const args = [...baseArgs, ...EXTRA_ARGS];
  const child = spawn(WHISPER_BIN, args, { stdio: ['pipe', 'pipe', 'pipe'] });
  return child;
}

/**
 * whisper.cpp에서 출력한 텍스트를 API 서버로 전달합니다.
 */
async function postPartial(session, text, isFinal = false) {
  if (!text) return;

  try {
    await axios.post(API_ENDPOINT, {
      sessionId: session.sessionId,
      guildId: session.guildId,
      channelId: session.channelId,
      userId: session.userId,
      text,
      isFinal,
      emittedAt: new Date().toISOString(),
      latencyMs: Date.now() - session.startedAt,
    });
  } catch (error) {
    console.error('전사 API 전송 실패:', error?.response?.data || error.message);
  }
}

const wss = new WebSocketServer({ port: WORKER_PORT });
console.log(`🔊 STT 워커 WebSocket이 포트 ${WORKER_PORT}에서 대기 중입니다.`);
console.log(`🧠 whisper.cpp 실행 파일: ${WHISPER_BIN}`);
console.log(`🧾 모델 파일: ${WHISPER_MODEL}`);

wss.on('connection', (socket) => {
  const session = {
    sessionId: randomUUID(),
    guildId: null,
    channelId: null,
    userId: null,
    sampleRate: null,
    format: null,
    whisper: null,
    reader: null,
    startedAt: Date.now(),
    pending: [],
    closed: false,
    lastText: null,
  };

  const shutdown = (reason) => {
    if (session.closed) {
      return;
    }
    session.closed = true;

    if (session.whisper && !session.whisper.killed) {
      session.whisper.stdin.end();
      session.whisper.kill('SIGTERM');
    }

    try {
      socket.close();
    } catch (error) {
      // 이미 종료된 소켓이면 무시합니다.
    }

    if (session.lastText) {
      postPartial(session, session.lastText, true);
    }

    console.log(`🔚 세션 종료: ${session.sessionId} - ${reason}`);
  };

  const bootWhisper = (meta) => {
    if (session.whisper) {
      return;
    }

    session.sampleRate = meta.sampleRate;
    session.format = meta.format;
    session.guildId = meta.guildId;
    session.channelId = meta.channelId;
    session.userId = meta.userId;
    session.startedAt = Date.now();

    const whisper = launchWhisper(meta.sampleRate);
    session.whisper = whisper;

    whisper.stderr.on('data', (chunk) => {
      console.error(`[whisper stderr] ${chunk}`.trim());
    });

    whisper.on('close', (code, signal) => {
      console.log(`🧠 whisper.cpp 종료 (code=${code}, signal=${signal})`);
      shutdown('whisper.cpp 프로세스 종료');
    });

    whisper.on('error', (error) => {
      console.error('whisper.cpp 실행 실패:', error);
      shutdown('whisper.cpp 실행 오류');
    });

    session.reader = readline.createInterface({ input: whisper.stdout });
    session.reader.on('line', (line) => {
      const text = line.trim();
      if (!text) return;
      session.lastText = text;
      postPartial(session, text, false);
    });

    for (const chunk of session.pending.splice(0)) {
      whisper.stdin.write(chunk);
    }
  };

  socket.on('message', (data, isBinary) => {
    if (!isBinary) {
      try {
        const message = JSON.parse(data.toString('utf8'));
        if (message.type === 'start') {
          if (!message.sampleRate || message.format !== 's16le') {
            console.error('지원하지 않는 스트림 메타데이터:', message);
            shutdown('스트림 메타데이터 오류');
            return;
          }
          session.sessionId = message.sessionId || session.sessionId;
          bootWhisper(message);
          console.log(
            `🚀 세션 시작: ${session.sessionId} (G:${message.guildId} / C:${message.channelId} / U:${message.userId})`,
          );
        } else if (message.type === 'stop') {
          console.log(`🛑 세션 정지 요청: ${session.sessionId} (${message.reason || '사유 없음'})`);
          shutdown('클라이언트 종료 요청');
        }
      } catch (error) {
        console.error('WebSocket 제어 메시지 파싱 실패:', error);
      }
      return;
    }

    if (!session.whisper) {
      session.pending.push(Buffer.from(data));
      return;
    }

    if (!session.whisper.stdin.destroyed) {
      session.whisper.stdin.write(data);
    }
  });

  socket.on('close', () => {
    shutdown('WebSocket 연결 종료');
  });

  socket.on('error', (error) => {
    console.error('WebSocket 오류:', error);
    shutdown('WebSocket 오류');
  });
});

process.on('SIGINT', () => {
  console.log('👋 STT 워커를 종료합니다.');
  for (const client of wss.clients) {
    try {
      client.close();
    } catch (error) {
      // 이미 종료된 연결이면 무시
    }
  }
  wss.close(() => {
    process.exit(0);
  });
});
