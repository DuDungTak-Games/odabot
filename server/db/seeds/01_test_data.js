/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // 기존 데이터 삭제 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    await knex('messages').del();
    await knex('users').del();
  }

  // 테스트 사용자 데이터 삽입
  await knex('users').insert([
    {
      id: '123456789012345678',
      username: 'TestUser1',
      avatar_url: 'https://cdn.discordapp.com/avatars/123456789012345678/avatar1.png'
    },
    {
      id: '123456789012345679',
      username: 'TestUser2',
      avatar_url: 'https://cdn.discordapp.com/avatars/123456789012345679/avatar2.png'
    },
    {
      id: '123456789012345680',
      username: 'TestUser3',
      avatar_url: 'https://cdn.discordapp.com/avatars/123456789012345680/avatar3.png'
    }
  ]);

  // 테스트 메시지 데이터 삽입
  await knex('messages').insert([
    {
      user_id: '123456789012345678',
      message: '안녕하세요! 첫 번째 테스트 메시지입니다.',
      attachment_url: null,
      created_at: knex.fn.now()
    },
    {
      user_id: '123456789012345679',
      message: '이것은 두 번째 메시지입니다.',
      attachment_url: null,
      created_at: knex.fn.now()
    },
    {
      user_id: '123456789012345680',
      message: '첨부파일이 있는 메시지입니다.',
      attachment_url: 'https://cdn.discordapp.com/attachments/123456789/123456789/test_image.png',
      created_at: knex.fn.now()
    },
    {
      user_id: '123456789012345678',
      message: null,
      attachment_url: 'https://cdn.discordapp.com/attachments/123456789/123456790/another_image.jpg',
      created_at: knex.fn.now()
    },
    {
      user_id: '123456789012345679',
      message: '오늘 날씨가 정말 좋네요! 🌞',
      attachment_url: null,
      created_at: knex.fn.now()
    }
  ]);
};
