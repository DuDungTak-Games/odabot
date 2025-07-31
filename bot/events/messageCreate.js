const axios = require('axios');
const { readChannels } = require('../utils/channels');
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const channels = readChannels();
    const isTracked = channels.some(
      (c) => c.guildId === message.guildId && c.channelId === message.channelId
    );
    if (!isTracked) return;

    const attachments = Array.from(message.attachments.values()).map((a) => a.url);

    try {
      await axios.post(`${API_BASE_URL}/messages`, {
        guildId: message.guildId,
        channelId: message.channelId,
        authorId: message.author.id,
        authorName: message.author.username,
        authorAvatar: message.author.displayAvatarURL({ format: 'png', size: 256 }),
        content: message.content || '',
        attachments,
      });
    } catch (err) {
      console.error('메시지 전송 실패:', err.message);
    }
  },
};
