const { Events } = require('discord.js');
const voiceTranscriber = require('../utils/voiceTranscriber');

module.exports = {
  name: Events.VoiceStateUpdate,
  async execute(oldState, newState) {
    try {
      await voiceTranscriber.handleVoiceStateUpdate(oldState, newState);
    } catch (error) {
      console.error('음성 상태 갱신 처리 중 오류:', error);
    }
  },
};
