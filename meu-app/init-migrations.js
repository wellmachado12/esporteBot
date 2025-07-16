const db = require("./database");

async function initializeMigrations() {
  try {
    // Criar tabela de migrations se não existir
    const exists = await db.schema.hasTable("knex_migrations");
    if (!exists) {
      await db.schema.createTable("knex_migrations", function (table) {
        table.increments("id").primary();
        table.string("name");
        table.integer("batch");
        table.timestamp("migration_time").defaultTo(db.fn.now());
      });
      console.log("Tabela knex_migrations criada");
    }

    // Verificar se as migrations já foram registradas
    const existingMigrations = await db("knex_migrations").select("name");
    const migrationNames = existingMigrations.map((m) => m.name);

    const migrationsToAdd = [
      "20250107000001_create_users_table.js",
      "20250107000002_create_conversations_table.js",
    ];

    for (const migration of migrationsToAdd) {
      if (!migrationNames.includes(migration)) {
        await db("knex_migrations").insert({
          name: migration,
          batch: 1,
        });
        console.log(`Migration ${migration} marcada como executada`);
      }
    }

    console.log("Migrations inicializadas com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("Erro ao inicializar migrations:", error);
    process.exit(1);
  }
}

initializeMigrations();
