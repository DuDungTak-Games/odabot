const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

// 라우터 import
const timelineRouter = require('./routes/timeline');
const randomRouter = require('./routes/random');
const statsRouter = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3001;

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

// 미들웨어 설정
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// DB 연결을 req 객체에 추가
app.use((req, res, next) => {
    req.db = pool;
    next();
});

// 라우터 설정
app.use('/api/timeline', timelineRouter);
app.use('/api/random', randomRouter);
app.use('/api/stats', statsRouter);

// 기본 라우트
app.get('/', (req, res) => {
    res.json({ 
        message: 'ODA Bot API 서버가 실행 중입니다!',
        version: '1.0.0',
        endpoints: [
            '/api/timeline',
            '/api/random',
            '/api/stats'
        ]
    });
});

// 헬스 체크 라우트
app.get('/health', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        
        res.json({ 
            status: 'OK', 
            database: 'Connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'Error', 
            database: 'Disconnected',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// 404 에러 처리
app.use('*', (req, res) => {
    res.status(404).json({ error: '엔드포인트를 찾을 수 없습니다.' });
});

// 전역 에러 처리
app.use((error, req, res, next) => {
    console.error('서버 오류:', error);
    res.status(500).json({ 
        error: '내부 서버 오류가 발생했습니다.',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 Express 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📝 API 문서: http://localhost:${PORT}`);
    console.log(`🔍 헬스 체크: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('서버를 종료합니다...');
    await pool.end();
    process.exit(0);
});
