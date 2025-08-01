const express = require('express');
const router = express.Router();

// 타임라인 조회 (최신순)
router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

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
            ORDER BY m.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const countQuery = `
            SELECT COUNT(*) as total
            FROM messages m
            INNER JOIN users u ON m.user_id = u.id
        `;

        const [messages] = await req.db.execute(query);
        const [countResult] = await req.db.execute(countQuery);
        
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                messages,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    limit,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('타임라인 조회 오류:', error);
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            error: '타임라인을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 특정 사용자의 메시지 조회
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

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
            ORDER BY m.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const countQuery = `
            SELECT COUNT(*) as total
            FROM messages m
            WHERE m.user_id = ?
        `;

        const [messages] = await req.db.execute(query, [userId]);
        const [countResult] = await req.db.execute(countQuery, [userId]);
        
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                messages,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('사용자 메시지 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '사용자 메시지를 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 메시지 검색
router.get('/search', async (req, res) => {
    try {
        const { q: searchTerm } = req.query;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        if (!searchTerm) {
            return res.status(400).json({
                success: false,
                error: '검색어를 입력해주세요.'
            });
        }

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
            WHERE m.content LIKE ?
            ORDER BY m.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;

        const countQuery = `
            SELECT COUNT(*) as total
            FROM messages m
            WHERE m.content LIKE ?
        `;

        const searchPattern = `%${searchTerm}%`;
        const [messages] = await req.db.execute(query, [searchPattern]);
        const [countResult] = await req.db.execute(countQuery, [searchPattern]);
        
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: {
                messages,
                searchTerm,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            }
        });
    } catch (error) {
        console.error('메시지 검색 오류:', error);
        res.status(500).json({
            success: false,
            error: '메시지 검색 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
