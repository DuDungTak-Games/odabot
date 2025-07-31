/**
 * 메시지 테이블 생성
 * @param {import('knex').Knex} knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('messages', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.bigInteger('guild_id').notNullable().comment('서버 ID');
    table.bigInteger('channel_id').notNullable().comment('채널 ID');
    table.text('content').comment('메시지 내용');
    table.text('attachments').comment('첨부파일 URL 배열(JSON)');
    table.datetime('created_at').defaultTo(knex.fn.now()).comment('생성일');
  });
};

/**
 * 테이블 제거
 * @param {import('knex').Knex} knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('messages');
};
