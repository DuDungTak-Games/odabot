const express = require('express');
const router = express.Router();

// 모든 크레딧 반응 조회
router.get('/', async (req, res) => {
    try {
        const { type } = req.query;
        
        let query = `
            SELECT id, type, message, image_url, is_active, created_at, updated_at
            FROM credit_reactions
            WHERE is_active = TRUE
        `;
        const params = [];

        if (type && ['plus', 'minus'].includes(type)) {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY type, id';

        const [reactions] = await req.db.execute(query, params);

        // plus와 minus로 분류
        const plus = reactions.filter(reaction => reaction.type === 'plus');
        const minus = reactions.filter(reaction => reaction.type === 'minus');

        res.json({
            success: true,
            data: {
                plus,
                minus,
                total: reactions.length
            }
        });
    } catch (error) {
        console.error('크레딧 반응 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '크레딧 반응을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 랜덤 크레딧 반응 조회 (봇에서 사용)
router.get('/random/:type', async (req, res) => {
    try {
        const { type } = req.params;

        if (!['plus', 'minus'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: '타입은 plus 또는 minus만 가능합니다.'
            });
        }

        const [reactions] = await req.db.execute(`
            SELECT id, message, image_url
            FROM credit_reactions
            WHERE type = ? AND is_active = TRUE
            ORDER BY RAND()
            LIMIT 1
        `, [type]);

        if (reactions.length === 0) {
            return res.json({
                success: true,
                data: null,
                message: '해당 타입의 반응이 없습니다.'
            });
        }

        res.json({
            success: true,
            data: reactions[0]
        });
    } catch (error) {
        console.error('랜덤 크레딧 반응 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '랜덤 크레딧 반응을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 크레딧 반응 추가
router.post('/', async (req, res) => {
    try {
        const { type, message, image_url, is_active = true } = req.body;

        if (!type || !message) {
            return res.status(400).json({
                success: false,
                error: '타입과 메시지는 필수입니다.'
            });
        }

        if (!['plus', 'minus'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: '타입은 plus 또는 minus만 가능합니다.'
            });
        }

        await req.db.execute(`
            INSERT INTO credit_reactions (type, message, image_url, is_active)
            VALUES (?, ?, ?, ?)
        `, [type, message.trim(), image_url || null, is_active]);

        res.json({
            success: true,
            message: '크레딧 반응이 추가되었습니다.'
        });
    } catch (error) {
        console.error('크레딧 반응 추가 오류:', error);
        res.status(500).json({
            success: false,
            error: '크레딧 반응 추가 중 오류가 발생했습니다.'
        });
    }
});

// 크레딧 반응 수정
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, message, image_url, is_active } = req.body;

        if (!type || !message) {
            return res.status(400).json({
                success: false,
                error: '타입과 메시지는 필수입니다.'
            });
        }

        if (!['plus', 'minus'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: '타입은 plus 또는 minus만 가능합니다.'
            });
        }

        const [result] = await req.db.execute(`
            UPDATE credit_reactions 
            SET type = ?, message = ?, image_url = ?, is_active = ?
            WHERE id = ?
        `, [type, message.trim(), image_url || null, is_active !== undefined ? is_active : true, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: '해당 반응을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '크레딧 반응이 수정되었습니다.'
        });
    } catch (error) {
        console.error('크레딧 반응 수정 오류:', error);
        res.status(500).json({
            success: false,
            error: '크레딧 반응 수정 중 오류가 발생했습니다.'
        });
    }
});

// 크레딧 반응 삭제 (실제로는 비활성화)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await req.db.execute(`
            UPDATE credit_reactions SET is_active = FALSE WHERE id = ?
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: '해당 반응을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '크레딧 반응이 비활성화되었습니다.'
        });
    } catch (error) {
        console.error('크레딧 반응 삭제 오류:', error);
        res.status(500).json({
            success: false,
            error: '크레딧 반응 삭제 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
