const express = require('express');
const { readChannels, addChannel, deactivateChannel, activateChannel, getGuildChannels } = require('../../bot/utils/channels');
const router = express.Router();

// 등록된 채널 목록 조회
router.get('/', async (req, res) => {
  try {
    const channels = await readChannels();
    res.json({ success: true, data: channels });
  } catch (err) {
    console.error('채널 목록 조회 오류:', err);
    res.status(500).json({ success: false, error: '채널 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 특정 서버의 채널 목록 조회
router.get('/guild/:guildId', async (req, res) => {
  try {
    const { guildId } = req.params;
    const channels = await getGuildChannels(guildId);
    res.json({ success: true, data: channels });
  } catch (err) {
    console.error('서버 채널 목록 조회 오류:', err);
    res.status(500).json({ success: false, error: '서버 채널 목록을 불러오는 중 오류가 발생했습니다.' });
  }
});

// 새로운 채널 추가
router.post('/', async (req, res) => {
  try {
    const { channelId, guildId, name, type = 'text', description } = req.body;
    
    if (!channelId || !guildId || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'channelId, guildId, name은 필수 항목입니다.' 
      });
    }

    const success = await addChannel(channelId, guildId, name, type, description);
    
    if (success) {
      const channels = await readChannels();
      res.json({ success: true, data: channels });
    } else {
      res.status(500).json({ success: false, error: '채널 추가 중 오류가 발생했습니다.' });
    }
  } catch (err) {
    console.error('채널 추가 오류:', err);
    res.status(500).json({ success: false, error: '채널 추가 중 오류가 발생했습니다.' });
  }
});

// 채널 비활성화 (삭제)
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const success = await deactivateChannel(id);
    
    if (success) {
      const channels = await readChannels();
      res.json({ success: true, data: channels });
    } else {
      res.status(500).json({ success: false, error: '채널 제거 중 오류가 발생했습니다.' });
    }
  } catch (err) {
    console.error('채널 제거 오류:', err);
    res.status(500).json({ success: false, error: '채널 제거 중 오류가 발생했습니다.' });
  }
});

// 채널 활성화
router.patch('/:id/activate', async (req, res) => {
  try {
    const id = req.params.id;
    const success = await activateChannel(id);
    
    if (success) {
      const channels = await readChannels();
      res.json({ success: true, data: channels });
    } else {
      res.status(500).json({ success: false, error: '채널 활성화 중 오류가 발생했습니다.' });
    }
  } catch (err) {
    console.error('채널 활성화 오류:', err);
    res.status(500).json({ success: false, error: '채널 활성화 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
