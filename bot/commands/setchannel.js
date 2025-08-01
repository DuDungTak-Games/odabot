const { SlashCommandBuilder } = require('discord.js');
const { readChannels, addChannel } = require('../utils/channels');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setchannel')
    .setDescription('현재 채널을 메시지 기록 채널로 등록합니다.'),
  async execute(interaction) {
    const channels = await readChannels();
    const exists = channels.some(
      (c) => c.guildId === interaction.guildId && c.id === interaction.channelId
    );

    if (!exists) {
      const channel = interaction.channel;
      const success = await addChannel(
        interaction.channelId,
        interaction.guildId,
        channel.name,
        channel.type === 0 ? 'text' : channel.type === 2 ? 'voice' : 'other',
        channel.topic || null
      );

      if (!success) {
        await interaction.reply({
          content: '채널 등록 중 오류가 발생했습니다.',
          ephemeral: true,
        });
        return;
      }
    }

    const updatedChannels = await readChannels();
    const list = updatedChannels.map((c) => `- ${c.name} (${c.guildId}:${c.id})`).join('\n') || '없음';
    await interaction.reply({
      content: `등록된 채널 목록:\n${list}`,
      ephemeral: true,
    });
  },
};
