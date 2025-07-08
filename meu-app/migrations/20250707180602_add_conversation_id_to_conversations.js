/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.alterTable("conversations", function (table) {
    table.integer("conversation_id").unsigned().notNullable().defaultTo(1);
    table.index("conversation_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.alterTable("conversations", function (table) {
    table.dropIndex("conversation_id");
    table.dropColumn("conversation_id");
  });
};
