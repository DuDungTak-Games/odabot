const express = require('express');
const router = express.Router();

/**
 * GET /users/:id/credit
 * 특정 사용자의 소셜 크레딧 정보를 반환한다.
 */
router.get('/:id/credit', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await req.db.execute(
      'SELECT id, username, social_credit FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const user = rows[0];
    res.json({ id: user.id.toString(), username: user.username, score: user.social_credit });
  } catch (err) {
    console.error('/users/:id/credit 오류:', err);
    res.status(500).json({ success: false, error: 'DB 조회 실패' });
  }
});

module.exports = router;
