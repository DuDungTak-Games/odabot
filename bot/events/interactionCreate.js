const { EmbedBuilder } = require('discord.js');
const { pool } = require('../../server/db');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
      if (commandName === '크레딧') {
        await handleCreditCommand(interaction);
      } else if (commandName === '크레딧순위') {
        await handleCreditRankingCommand(interaction);
      } else if (commandName === '크레딧정보') {
        await handleCreditInfoCommand(interaction);
      }
    } catch (error) {
      console.error('슬래쉬 명령어 처리 오류:', error);
      
      const errorMessage = '명령어 처리 중 오류가 발생했습니다.';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  },
};

// 내 크레딧 조회
async function handleCreditCommand(interaction) {
  const userId = interaction.user.id;
  
  const [rows] = await pool.execute(
    'SELECT username, social_credit, created_at FROM users WHERE id = ?',
    [userId]
  );

  if (rows.length === 0) {
    const embed = new EmbedBuilder()
      .setColor('#ff6b6b')
      .setTitle('❌ 크레딧 정보 없음')
      .setDescription('아직 크레딧 기록이 없습니다.\n메시지를 보내서 크레딧을 쌓아보세요!')
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  const user = rows[0];
  
  // 전체 순위 조회
  const [rankRows] = await pool.execute(`
    SELECT COUNT(*) + 1 as rank
    FROM users 
    WHERE social_credit > ?
  `, [user.social_credit]);
  
  const rank = rankRows[0].rank;

  // 크레딧에 따른 이모지와 색상
  let emoji = '🌟';
  let color = '#4ecdc4';
  
  if (user.social_credit >= 100) {
    emoji = '👑';
    color = '#ffd700';
  } else if (user.social_credit >= 50) {
    emoji = '🏆';
    color = '#ff9f43';
  } else if (user.social_credit >= 10) {
    emoji = '⭐';
    color = '#54a0ff';
  } else if (user.social_credit < 0) {
    emoji = '😔';
    color = '#ff6b6b';
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} ${user.username}님의 소셜 크레딧`)
    .addFields(
      { name: '현재 점수', value: `**${user.social_credit}점**`, inline: true },
      { name: '전체 순위', value: `**${rank}위**`, inline: true },
      { name: '가입일', value: `<t:${Math.floor(new Date(user.created_at).getTime() / 1000)}:D>`, inline: true }
    )
    .setFooter({ text: '좋은 말을 많이 써서 크레딧을 올려보세요!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

// 크레딧 순위 조회
async function handleCreditRankingCommand(interaction) {
  const [rows] = await pool.execute(`
    SELECT username, social_credit, avatar_url
    FROM users 
    WHERE social_credit IS NOT NULL 
    ORDER BY social_credit DESC 
    LIMIT 10
  `);

  if (rows.length === 0) {
    const embed = new EmbedBuilder()
      .setColor('#ff6b6b')
      .setTitle('❌ 순위 정보 없음')
      .setDescription('아직 크레딧 기록이 있는 사용자가 없습니다.')
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  const embed = new EmbedBuilder()
    .setColor('#ffd700')
    .setTitle('🏆 소셜 크레딧 순위 TOP 10')
    .setDescription(
      rows.map((user, index) => {
        const rank = index + 1;
        let emoji = '🥉';
        
        if (rank === 1) emoji = '🥇';
        else if (rank === 2) emoji = '🥈';
        else if (rank <= 3) emoji = '🥉';
        else emoji = `${rank}.`;
        
        return `${emoji} **${user.username}** - ${user.social_credit}점`;
      }).join('\n')
    )
    .setFooter({ text: '매일 좋은 말을 써서 순위를 올려보세요!' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

// 다른 사용자 크레딧 조회
async function handleCreditInfoCommand(interaction) {
  const targetUser = interaction.options.getUser('사용자');
  
  if (targetUser.bot) {
    await interaction.reply({ 
      content: '봇의 크레딧 정보는 조회할 수 없습니다.', 
      ephemeral: true 
    });
    return;
  }

  const [rows] = await pool.execute(
    'SELECT username, social_credit, created_at FROM users WHERE id = ?',
    [targetUser.id]
  );

  if (rows.length === 0) {
    const embed = new EmbedBuilder()
      .setColor('#ff6b6b')
      .setTitle('❌ 크레딧 정보 없음')
      .setDescription(`${targetUser.username}님의 크레딧 기록이 없습니다.`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
    return;
  }

  const user = rows[0];
  
  // 전체 순위 조회
  const [rankRows] = await pool.execute(`
    SELECT COUNT(*) + 1 as rank
    FROM users 
    WHERE social_credit > ?
  `, [user.social_credit]);
  
  const rank = rankRows[0].rank;

  // 크레딧에 따른 이모지와 색상
  let emoji = '🌟';
  let color = '#4ecdc4';
  
  if (user.social_credit >= 100) {
    emoji = '👑';
    color = '#ffd700';
  } else if (user.social_credit >= 50) {
    emoji = '🏆';
    color = '#ff9f43';
  } else if (user.social_credit >= 10) {
    emoji = '⭐';
    color = '#54a0ff';
  } else if (user.social_credit < 0) {
    emoji = '😔';
    color = '#ff6b6b';
  }

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${emoji} ${user.username}님의 소셜 크레딧`)
    .setThumbnail(targetUser.displayAvatarURL())
    .addFields(
      { name: '현재 점수', value: `**${user.social_credit}점**`, inline: true },
      { name: '전체 순위', value: `**${rank}위**`, inline: true },
      { name: '가입일', value: `<t:${Math.floor(new Date(user.created_at).getTime() / 1000)}:D>`, inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
