/**
 * users 테이블에 social_credit 컬럼을 추가한다.
 * @param {import('knex').Knex} knex
 */
exports.up = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table
      .integer('social_credit')
      .notNullable()
      .defaultTo(0)
      .comment('소셜 크레딧 점수');
  });
};

/**
 * social_credit 컬럼을 제거한다.
 * @param {import('knex').Knex} knex
 */
exports.down = function (knex) {
  return knex.schema.alterTable('users', (table) => {
    table.dropColumn('social_credit');
  });
};
