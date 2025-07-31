const { SlashCommandBuilder } = require('discord.js');
const { readChannels, writeChannels } = require('../utils/channels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('현재 채널을 메시지 기록 채널로 등록합니다.'),
  async execute(interaction) {
    const channels = readChannels();
    const exists = channels.some(
      (c) => c.guildId === interaction.guildId && c.channelId === interaction.channelId
    );

    if (!exists) {
      channels.push({ guildId: interaction.guildId, channelId: interaction.channelId });
      writeChannels(channels);
    }

    const list = channels.map((c) => `- ${c.guildId}:${c.channelId}`).join('\n') || '없음';
    await interaction.reply({
      content: `등록된 채널 목록:\n${list}`,
      ephemeral: true,
    });
  },
};
