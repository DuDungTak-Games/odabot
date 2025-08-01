const { REST, Routes } = require('discord.js');
require('dotenv').config({ path: '../.env' });

const commands = [
  {
    name: '크레딧',
    description: '내 소셜 크레딧 점수를 확인합니다',
  },
  {
    name: '크레딧순위',
    description: '소셜 크레딧 상위 10명의 순위를 확인합니다',
  },
  {
    name: '크레딧정보',
    description: '다른 사용자의 소셜 크레딧 점수를 확인합니다',
    options: [
      {
        name: '사용자',
        description: '크레딧을 확인할 사용자',
        type: 6, // USER type
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

async function deployCommands() {
  try {
    console.log('슬래쉬 명령어를 등록하는 중...');

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands },
    );

    console.log('슬래쉬 명령어가 성공적으로 등록되었습니다!');
  } catch (error) {
    console.error('슬래쉬 명령어 등록 실패:', error);
  }
}

deployCommands();
