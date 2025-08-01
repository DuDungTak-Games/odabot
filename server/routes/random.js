const express = require('express');
const router = express.Router();

// 랜덤 메시지 조회
router.get('/', async (req, res) => {
    try {
        const count = parseInt(req.query.count) || 1;
        const maxCount = 10; // 최대 10개까지만 허용
        const actualCount = Math.min(count, maxCount);

        const query = `
            SELECT 
                m.id,
                m.content as message,
                m.attachments as attachment_url,
                m.created_at,
                u.username,
                u.avatar_url
            FROM messages m
            INNER JOIN users u ON m.user_id = u.id
            ORDER BY RAND()
            LIMIT ${actualCount}
        `;

        const [messages] = await req.db.execute(query);

        res.json({
            success: true,
            data: {
                messages,
                count: messages.length,
                requested: actualCount
            }
        });
    } catch (error) {
        console.error('랜덤 메시지 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '랜덤 메시지를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 특정 사용자의 랜덤 메시지 조회
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const count = parseInt(req.query.count) || 1;
        const maxCount = 10;
        const actualCount = Math.min(count, maxCount);

        const query = `
            SELECT 
                m.id,
                m.content as message,
                m.attachments as attachment_url,
                m.created_at,
                u.username,
                u.avatar_url
            FROM messages m
            INNER JOIN users u ON m.user_id = u.id
            WHERE m.user_id = ?
            ORDER BY RAND()
            LIMIT ${actualCount}
        `;

        const [messages] = await req.db.execute(query, [userId]);

        res.json({
            success: true,
            data: {
                messages,
                count: messages.length,
                requested: actualCount,
                userId
            }
        });
    } catch (error) {
        console.error('사용자 랜덤 메시지 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '사용자 랜덤 메시지를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 랜덤 이미지 메시지 조회 (첨부파일이 있는 메시지만)
router.get('/images', async (req, res) => {
    try {
        const count = parseInt(req.query.count) || 1;
        const maxCount = 10;
        const actualCount = Math.min(count, maxCount);

        const query = `
            SELECT 
                m.id,
                m.content as message,
                m.attachments as attachment_url,
                m.created_at,
                u.username,
                u.avatar_url
            FROM messages m
            INNER JOIN users u ON m.user_id = u.id
            WHERE m.attachments IS NOT NULL
            ORDER BY RAND()
            LIMIT ${actualCount}
        `;

        const [messages] = await req.db.execute(query);

        res.json({
            success: true,
            data: {
                messages,
                count: messages.length,
                requested: actualCount,
                type: 'images_only'
            }
        });
    } catch (error) {
        console.error('랜덤 이미지 메시지 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '랜덤 이미지 메시지를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 랜덤 텍스트 메시지 조회 (텍스트만 있는 메시지)
router.get('/texts', async (req, res) => {
    try {
        const count = parseInt(req.query.count) || 1;
        const maxCount = 10;
        const actualCount = Math.min(count, maxCount);

        const query = `
            SELECT 
                m.id,
                m.content as message,
                m.attachments as attachment_url,
                m.created_at,
                u.username,
                u.avatar_url
            FROM messages m
            INNER JOIN users u ON m.user_id = u.id
            WHERE m.content IS NOT NULL AND m.content != ''
            ORDER BY RAND()
            LIMIT ${actualCount}
        `;

        const [messages] = await req.db.execute(query);

        res.json({
            success: true,
            data: {
                messages,
                count: messages.length,
                requested: actualCount,
                type: 'texts_only'
            }
        });
    } catch (error) {
        console.error('랜덤 텍스트 메시지 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '랜덤 텍스트 메시지를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
