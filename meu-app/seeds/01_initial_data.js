/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Limpa as tabelas
  await knex("conversations").del();
  await knex("users").del();

  // Insere usuários de exemplo
  const bcrypt = require("bcrypt");
  const hashedPassword = await bcrypt.hash("123456", 10);

  await knex("users").insert([
    {
      id: 1,
      username: "admin",
      password: hashedPassword,
    },
    {
      id: 2,
      username: "user1",
      password: hashedPassword,
    },
  ]);

  // Insere conversas de exemplo
  await knex("conversations").insert([
    {
      user_id: 1,
      message: "Quais são as regras básicas do futebol?",
      response:
        "O futebol é jogado com duas equipes de 11 jogadores cada uma...",
      sport: "futebol",
      conversation_id: 1,
    },
    {
      user_id: 2,
      message: "Como melhorar meu drible no basquete?",
      response: "Para melhorar o drible no basquete, você deve praticar...",
      sport: "basquete",
      conversation_id: 2,
    },
  ]);
};
