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
    queueLimit: 0,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
});

// 연결 테스트 함수
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ MySQL 데이터베이스에 성공적으로 연결되었습니다.');
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ MySQL 데이터베이스 연결 실패:', error);
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};
