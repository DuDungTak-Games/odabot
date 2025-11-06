const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits, Events } = require('discord.js');
const voiceTranscriber = require('./utils/voiceTranscriber');
require('dotenv').config();

// Discord 클라이언트 초기화
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

voiceTranscriber.setClient(client);

// 명령어와 이벤트 로드
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

const eventsPath = path.join(__dirname, 'events');
for (const file of fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'))) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// 상호작용 처리
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error('명령어 실행 오류:', err);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: '명령어 실행 중 오류가 발생했습니다.', ephemeral: true });
    } else {
      await interaction.reply({ content: '명령어 실행 중 오류가 발생했습니다.', ephemeral: true });
    }
  }
});

// 봇 준비 완료 시 슬래시 커맨드 등록
client.once(Events.ClientReady, async () => {
  console.log(`✅ Ready! Logged in as ${client.user.tag}`);
  try {
    await client.application.commands.set(client.commands.map((c) => c.data));
    console.log('✅ Slash commands registered');
  } catch (err) {
    console.error('슬래시 커맨드 등록 실패:', err);
  }
});

client.login(process.env.DISCORD_TOKEN);
