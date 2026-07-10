exports.up = function (knex) {
  return knex.schema.createTable("token_senhas", function (table) {

    table.increments("id").primary();

    table.string("token", 255).notNullable().unique();

    table
      .integer("usuario_id")
      .unsigned()
      .notNullable();

    table
      .foreign("usuario_id")
      .references("id")
      .inTable("usuarios")
      .onDelete("CASCADE")
      .onUpdate("CASCADE");

    table.boolean("usado").defaultTo(false);

    table.timestamp("expira_em").notNullable();

    table.timestamps(true, true);

  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("token_senhas");
};