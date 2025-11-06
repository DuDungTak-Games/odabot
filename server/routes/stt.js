const express = require('express');

const router = express.Router();

/**
 * 실시간 전사 결과를 수신하는 엔드포인트입니다.
 * whisper.cpp에서 생성한 중간/최종 텍스트가 POST로 전달됩니다.
 */
router.post('/partial', async (req, res) => {
  const {
    sessionId,
    guildId,
    channelId,
    userId,
    text,
    isFinal = false,
    latencyMs,
    emittedAt,
  } = req.body || {};

  if (!sessionId || !text) {
    return res.status(400).json({ error: 'sessionId와 text는 필수입니다.' });
  }

  console.log(
    '[STT] 실시간 전사 수신:',
    JSON.stringify(
      {
        sessionId,
        guildId,
        channelId,
        userId,
        text,
        isFinal,
        latencyMs,
        emittedAt,
        receivedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
  );

  // TODO: 필요 시 데이터베이스 적재 또는 추가 알림 로직을 연결하세요.

  return res.json({ ok: true });
});

module.exports = router;
