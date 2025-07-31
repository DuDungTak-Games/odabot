const express = require('express');
const router = express.Router();

/**
 * GET /leaderboard
 * social_credit 내림차순 상위 10명의 유저 목록을 반환한다.
 */
router.get('/', async (req, res) => {
  try {
    const [rows] = await req.db.execute(
      'SELECT id, username, social_credit FROM users ORDER BY social_credit DESC LIMIT 10'
    );

    const data = rows.map((row) => ({
      id: row.id.toString(),
      username: row.username,
      score: row.social_credit,
    }));

    res.json(data);
  } catch (err) {
    console.error('/leaderboard 오류:', err);
    res.status(500).json({ success: false, error: 'DB 조회 실패' });
  }
});

module.exports = router;
