/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
    // 기존 채널 데이터 삭제
    await knex('channels').del();
    
    // channels.json의 데이터를 기반으로 채널 데이터 삽입
    await knex('channels').insert([
        {
            id: '1388883818047606857',
            guild_id: '1388883817590423663',
            name: 'general', // 기본 채널명 (나중에 Discord API로 실제 이름 가져올 수 있음)
            type: 'text',
            description: 'General chat channel',
            is_active: true
        }
    ]);
};
