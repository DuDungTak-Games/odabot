/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('messages', function(table) {
        table.bigIncrements('id').primary().comment('메시지 고유 ID');
        table.bigInteger('user_id').notNullable().comment('Discord 사용자 ID');
        table.text('message').nullable().comment('메시지 내용');
        table.string('attachment_url', 500).nullable().comment('Discord CDN 첨부파일 URL');
        table.datetime('created_at').defaultTo(knex.fn.now()).comment('생성일시');
        
        // 외래키
        table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
        
        // 인덱스
        table.index('user_id', 'idx_user_id');
        table.index('created_at', 'idx_created_at');
        table.index(['user_id', 'created_at'], 'idx_user_created');
        
        table.comment('Discord 메시지 저장');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('messages');
};
