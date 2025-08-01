const mysql = require('mysql2/promise');
require('dotenv').config();

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

/**
 * 데이터베이스에서 활성화된 채널 목록을 읽어온다.
 * @returns {Promise<Array<{id:string, guildId:string, name:string, type:string, isActive:boolean}>>}
 */
async function readChannels() {
    try {
        const [rows] = await pool.execute(
            'SELECT id, guild_id as guildId, name, type, is_active as isActive FROM channels WHERE is_active = true'
        );
        return rows;
    } catch (err) {
        console.error('채널 목록 읽기 오류:', err);
        return [];
    }
}

/**
 * 새로운 채널을 데이터베이스에 추가한다.
 * @param {string} channelId - Discord 채널 ID
 * @param {string} guildId - Discord 서버 ID
 * @param {string} name - 채널 이름
 * @param {string} type - 채널 유형 (기본값: 'text')
 * @param {string} description - 채널 설명 (선택사항)
 * @returns {Promise<boolean>} 성공 여부
 */
async function addChannel(channelId, guildId, name, type = 'text', description = null) {
    try {
        await pool.execute(
            'INSERT INTO channels (id, guild_id, name, type, description, is_active) VALUES (?, ?, ?, ?, ?, true) ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type), description = VALUES(description), is_active = true',
            [channelId, guildId, name, type, description]
        );
        return true;
    } catch (err) {
        console.error('채널 추가 오류:', err);
        return false;
    }
}

/**
 * 채널을 비활성화한다.
 * @param {string} channelId - Discord 채널 ID
 * @returns {Promise<boolean>} 성공 여부
 */
async function deactivateChannel(channelId) {
    try {
        await pool.execute(
            'UPDATE channels SET is_active = false WHERE id = ?',
            [channelId]
        );
        return true;
    } catch (err) {
        console.error('채널 비활성화 오류:', err);
        return false;
    }
}

/**
 * 채널을 활성화한다.
 * @param {string} channelId - Discord 채널 ID
 * @returns {Promise<boolean>} 성공 여부
 */
async function activateChannel(channelId) {
    try {
        await pool.execute(
            'UPDATE channels SET is_active = true WHERE id = ?',
            [channelId]
        );
        return true;
    } catch (err) {
        console.error('채널 활성화 오류:', err);
        return false;
    }
}

/**
 * 특정 서버의 활성화된 채널 목록을 가져온다.
 * @param {string} guildId - Discord 서버 ID
 * @returns {Promise<Array<{id:string, guildId:string, name:string, type:string, isActive:boolean}>>}
 */
async function getGuildChannels(guildId) {
    try {
        const [rows] = await pool.execute(
            'SELECT id, guild_id as guildId, name, type, is_active as isActive FROM channels WHERE guild_id = ? AND is_active = true',
            [guildId]
        );
        return rows;
    } catch (err) {
        console.error('서버 채널 목록 읽기 오류:', err);
        return [];
    }
}

module.exports = {
    readChannels,
    addChannel,
    deactivateChannel,
    activateChannel,
    getGuildChannels,
};
