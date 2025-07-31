const express = require('express');
const { readChannels, writeChannels } = require('../../bot/utils/channels');
const router = express.Router();

// 등록된 채널 목록 조회
router.get('/', (req, res) => {
  try {
    const channels = readChannels();
    res.json({ success: true, data: channels });
  } catch (err) {
    res.status(500).json({ success: false, error: 'failed to read channels' });
  }
});

// 채널 제거
router.delete('/:id', (req, res) => {
  try {
    const id = req.params.id;
    const channels = readChannels().filter((c) => c.channelId !== id);
    writeChannels(channels);
    res.json({ success: true, data: channels });
  } catch (err) {
    res.status(500).json({ success: false, error: 'failed to delete channel' });
  }
});

module.exports = router;
