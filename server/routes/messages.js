const express = require('express');
const router = express.Router();

// 메시지 저장 API
router.post('/', async (req, res) => {
  try {
    const {
      guildId,
      channelId,
      authorId,
      authorName,
      authorAvatar,
      content,
      attachments,
    } = req.body;

    if (!authorId) {
      return res.status(400).json({ success: false, error: 'authorId is required' });
    }

    // 작성자 정보 upsert
    await req.db.execute(
      `INSERT INTO users (id, username, avatar_url, created_at)
       VALUES (?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE username = VALUES(username), avatar_url = VALUES(avatar_url)`,
      [authorId, authorName, authorAvatar]
    );

    // 메시지 저장
    await req.db.execute(
      `INSERT INTO messages (user_id, guild_id, channel_id, content, attachments, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [authorId, guildId, channelId, content || null, JSON.stringify(attachments || [])]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('/messages POST 오류:', err);
    res.status(500).json({ success: false, error: 'DB 저장 실패' });
  }
});

module.exports = router;
