/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('channels', function(table) {
        table.string('id', 20).primary(); // Discord channel ID
        table.string('guild_id', 20).notNullable(); // Discord guild ID
        table.string('name').notNullable(); // Channel name
        table.string('type', 20).defaultTo('text'); // Channel type (text, voice, etc.)
        table.text('description').nullable(); // Channel description
        table.boolean('is_active').defaultTo(true); // Whether bot should monitor this channel
        table.timestamps(true, true); // created_at, updated_at
        
        // Indexes
        table.index('guild_id');
        table.index(['guild_id', 'is_active']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('channels');
};
