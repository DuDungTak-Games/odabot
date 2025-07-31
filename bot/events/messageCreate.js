const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { pool } = require('../../server/db');
const { readChannels } = require('../utils/channels');
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api';

// 크레딧 규칙 파일 경로
const RULES_PATH = path.join(__dirname, '../../creditRules.json');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;

    const channels = readChannels();
    const isTracked = channels.some(
      (c) => c.guildId === message.guildId && c.channelId === message.channelId
    );
    if (!isTracked) return;

    // 메시지에 포함된 첨부파일 URL 배열
    const attachments = Array.from(message.attachments.values()).map((a) => a.url);

    try {
      // 먼저 메시지를 API 서버에 저장한다.
      await axios.post(`${API_BASE_URL}/messages`, {
        guildId: message.guildId,
        channelId: message.channelId,
        authorId: message.author.id,
        authorName: message.author.username,
        authorAvatar: message.author.displayAvatarURL({ format: 'png', size: 256 }),
        content: message.content || '',
        attachments,
      });

      // 저장 후 소셜 크레딧 점수를 계산한다.
      const rules = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
      const text = (message.content || '').toLowerCase();

      let plus = 0;
      let minus = 0;

      // plus 단어 개수 계산
      for (const word of rules.plus || []) {
        const matches = text.match(new RegExp(word, 'gi'));
        if (matches) plus += matches.length;
      }

      // minus 단어 개수 계산
      for (const word of rules.minus || []) {
        const matches = text.match(new RegExp(word, 'gi'));
        if (matches) minus += matches.length;
      }

      const diff = plus - minus;

      if (diff !== 0) {
        // 점수 누적 업데이트
        await pool.execute(
          'UPDATE users SET social_credit = social_credit + ? WHERE id = ?',
          [diff, message.author.id]
        );

        // 업데이트 후 현재 점수를 조회
        const [rows] = await pool.execute(
          'SELECT username, social_credit FROM users WHERE id = ?',
          [message.author.id]
        );

        if (rows.length > 0) {
          const user = rows[0];
          console.log(
            `[소셜 크레딧 변경] 사용자: ${user.username}, 변화량: +${plus} / -${minus}, 현재 점수: ${user.social_credit}`
          );
        }
      }
    } catch (err) {
      // 메시지 저장이나 크레딧 계산 중 오류 발생 시 로그
      console.error('메시지 전송 또는 크레딧 처리 실패:', err.message);
    }
  },
};
