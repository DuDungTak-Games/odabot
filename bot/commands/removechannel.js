const { SlashCommandBuilder } = require('discord.js');
const { readChannels, deactivateChannel } = require('../utils/channels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removechannel')
    .setDescription('현재 채널을 등록 목록에서 제거합니다.'),
  async execute(interaction) {
    const success = await deactivateChannel(interaction.channelId);
    
    if (!success) {
      await interaction.reply({
        content: '채널 제거 중 오류가 발생했습니다.',
        ephemeral: true,
      });
      return;
    }

    const remainingChannels = await readChannels();
    const list = remainingChannels.map((c) => `- ${c.name} (${c.guildId}:${c.id})`).join('\n') || '없음';
    await interaction.reply({
      content: `남은 채널 목록:\n${list}`,
      ephemeral: true,
    });
  },
};
