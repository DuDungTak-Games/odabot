const { Client, GatewayIntentBits, Events } = require('discord.js');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Discord 클라이언트 생성
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// MySQL 연결 풀 생성
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 봇이 준비되었을 때
client.once(Events.ClientReady, async (readyClient) => {
    console.log(`✅ 디스코드 봇이 준비되었습니다! ${readyClient.user.tag}로 로그인했습니다.`);
    
    // 데이터베이스 연결 테스트
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL 데이터베이스에 성공적으로 연결되었습니다.');
        connection.release();
    } catch (error) {
        console.error('❌ MySQL 데이터베이스 연결 실패:', error);
    }
});

// 메시지 생성 이벤트
client.on(Events.MessageCreate, async (message) => {
    // 봇의 메시지는 무시
    if (message.author.bot) return;
    
    try {
        // 사용자 정보 저장/업데이트
        await saveOrUpdateUser(message.author);
        
        // 메시지 저장
        await saveMessage(message);
        
        console.log(`💬 메시지 저장됨: ${message.author.username} - ${message.content || '[첨부파일]'}`);
    } catch (error) {
        console.error('메시지 처리 중 오류:', error);
    }
});

// 사용자 정보 저장/업데이트 함수
async function saveOrUpdateUser(user) {
    const query = `
        INSERT INTO users (id, username, avatar_url) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE 
        username = VALUES(username), 
        avatar_url = VALUES(avatar_url)
    `;
    
    const avatarUrl = user.displayAvatarURL({ format: 'png', size: 256 });
    await pool.execute(query, [user.id, user.username, avatarUrl]);
}

// 메시지 저장 함수
async function saveMessage(message) {
    let attachmentUrl = null;
    
    // 첨부파일이 있는 경우 첫 번째 첨부파일의 URL 저장
    if (message.attachments.size > 0) {
        const firstAttachment = message.attachments.first();
        attachmentUrl = firstAttachment.url;
    }
    
    const query = `
        INSERT INTO messages (user_id, message, attachment_url, created_at) 
        VALUES (?, ?, ?, NOW())
    `;
    
    await pool.execute(query, [
        message.author.id,
        message.content || null,
        attachmentUrl
    ]);
}

// 에러 처리
client.on(Events.Error, (error) => {
    console.error('Discord 클라이언트 오류:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('처리되지 않은 Promise 거부:', error);
});

// 봇 로그인
client.login(process.env.DISCORD_TOKEN);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('봇을 종료합니다...');
    await pool.end();
    client.destroy();
    process.exit(0);
});
