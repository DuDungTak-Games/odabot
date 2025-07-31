const { SlashCommandBuilder } = require('discord.js');
const { readChannels, writeChannels } = require('../utils/channels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removechannel')
    .setDescription('현재 채널을 등록 목록에서 제거합니다.'),
  async execute(interaction) {
    const channels = readChannels();
    const filtered = channels.filter(
      (c) => !(c.guildId === interaction.guildId && c.channelId === interaction.channelId)
    );
    writeChannels(filtered);
    const list = filtered.map((c) => `- ${c.guildId}:${c.channelId}`).join('\n') || '없음';
    await interaction.reply({
      content: `남은 채널 목록:\n${list}`,
      ephemeral: true,
    });
  },
};
