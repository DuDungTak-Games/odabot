/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('users', function(table) {
        table.bigInteger('id').primary().comment('Discord 사용자 ID');
        table.string('username', 255).notNullable().comment('Discord 사용자명');
        table.string('avatar_url', 500).nullable().comment('Discord 아바타 URL');
        table.datetime('created_at').defaultTo(knex.fn.now()).comment('생성일시');
        table.datetime('updated_at').defaultTo(knex.fn.now()).comment('수정일시');
        
        // 인덱스
        table.index('username', 'idx_username');
        table.index('created_at', 'idx_created_at');
        
        table.comment('Discord 사용자 정보');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('users');
};
