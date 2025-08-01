const express = require('express');
const router = express.Router();

// 모든 크레딧 규칙 조회
router.get('/', async (req, res) => {
    try {
        const [rules] = await req.db.execute(`
            SELECT id, word, type, value, created_at, updated_at
            FROM credit_rules
            ORDER BY type, word
        `);

        // plus와 minus로 분류
        const plus = rules.filter(rule => rule.type === 'plus');
        const minus = rules.filter(rule => rule.type === 'minus');

        res.json({
            success: true,
            data: {
                plus,
                minus,
                total: rules.length
            }
        });
    } catch (error) {
        console.error('크레딧 규칙 조회 오류:', error);
        res.status(500).json({
            success: false,
            error: '크레딧 규칙을 불러오는 중 오류가 발생했습니다.'
        });
    }
});

// 크레딧 규칙 추가
router.post('/', async (req, res) => {
    try {
        const { word, type, value = 1 } = req.body;

        if (!word || !type) {
            return res.status(400).json({
                success: false,
                error: '단어와 타입은 필수입니다.'
            });
        }

        if (!['plus', 'minus'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: '타입은 plus 또는 minus만 가능합니다.'
            });
        }

        await req.db.execute(`
            INSERT INTO credit_rules (word, type, value)
            VALUES (?, ?, ?)
        `, [word.trim(), type, parseInt(value)]);

        res.json({
            success: true,
            message: '크레딧 규칙이 추가되었습니다.'
        });
    } catch (error) {
        console.error('크레딧 규칙 추가 오류:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                error: '이미 존재하는 단어입니다.'
            });
        }

        res.status(500).json({
            success: false,
            error: '크레딧 규칙 추가 중 오류가 발생했습니다.'
        });
    }
});

// 크레딧 규칙 수정
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { word, type, value } = req.body;

        if (!word || !type) {
            return res.status(400).json({
                success: false,
                error: '단어와 타입은 필수입니다.'
            });
        }

        if (!['plus', 'minus'].includes(type)) {
            return res.status(400).json({
                success: false,
                error: '타입은 plus 또는 minus만 가능합니다.'
            });
        }

        const [result] = await req.db.execute(`
            UPDATE credit_rules 
            SET word = ?, type = ?, value = ?
            WHERE id = ?
        `, [word.trim(), type, parseInt(value) || 1, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: '해당 규칙을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '크레딧 규칙이 수정되었습니다.'
        });
    } catch (error) {
        console.error('크레딧 규칙 수정 오류:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                error: '이미 존재하는 단어입니다.'
            });
        }

        res.status(500).json({
            success: false,
            error: '크레딧 규칙 수정 중 오류가 발생했습니다.'
        });
    }
});

// 크레딧 규칙 삭제
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await req.db.execute(`
            DELETE FROM credit_rules WHERE id = ?
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: '해당 규칙을 찾을 수 없습니다.'
            });
        }

        res.json({
            success: true,
            message: '크레딧 규칙이 삭제되었습니다.'
        });
    } catch (error) {
        console.error('크레딧 규칙 삭제 오류:', error);
        res.status(500).json({
            success: false,
            error: '크레딧 규칙 삭제 중 오류가 발생했습니다.'
        });
    }
});

// JSON 형태로 크레딧 규칙 내보내기 (기존 봇 코드 호환성)
router.get('/export', async (req, res) => {
    try {
        const [rules] = await req.db.execute(`
            SELECT word, type FROM credit_rules ORDER BY type, word
        `);

        const plus = rules.filter(rule => rule.type === 'plus').map(rule => rule.word);
        const minus = rules.filter(rule => rule.type === 'minus').map(rule => rule.word);

        res.json({
            success: true,
            data: {
                plus,
                minus
            }
        });
    } catch (error) {
        console.error('크레딧 규칙 내보내기 오류:', error);
        res.status(500).json({
            success: false,
            error: '크레딧 규칙을 내보내는 중 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
