/**
 * 사용자 테이블 생성
 * @param {import('knex').Knex} knex
 */
exports.up = function (knex) {
  return knex.schema.createTable('users', (table) => {
    table.bigInteger('id').primary().comment('Discord 사용자 ID');
    table.string('username').notNullable().comment('닉네임');
    table.string('avatar_url').comment('Discord 아바타 URL');
    table.datetime('created_at').defaultTo(knex.fn.now()).comment('생성일');
  });
};

/**
 * 테이블 제거
 * @param {import('knex').Knex} knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('users');
};
