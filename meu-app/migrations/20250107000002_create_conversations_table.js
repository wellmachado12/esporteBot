/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("conversations", function (table) {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable();
    table.text("message").notNullable();
    table.text("response").notNullable();
    table.string("sport", 100).notNullable();
    table.integer("conversation_id").unsigned().notNullable();
    table.timestamp("timestamp").defaultTo(knex.fn.now());

    // Foreign key
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");

    // Indexes
    table.index(["user_id", "sport"]);
    table.index("conversation_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("conversations");
};
