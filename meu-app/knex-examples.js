// Exemplos avançados de uso do Knex.js no projeto

const db = require("./database");

// ========== EXEMPLOS DE QUERIES ========== //

// 1. JOINS - Buscar conversas com informações do usuário
async function getConversationsWithUserInfo(userId) {
  return await db("conversations")
    .join("users", "conversations.user_id", "users.id")
    .where("conversations.user_id", userId)
    .select("conversations.*", "users.username")
    .orderBy("conversations.timestamp", "desc");
}

// 2. AGREGAÇÃO - Contar conversas por esporte
async function getConversationCountBySport(userId) {
  return await db("conversations")
    .where("user_id", userId)
    .groupBy("sport")
    .select("sport")
    .count("* as total")
    .orderBy("total", "desc");
}

// 3. SUBQUERY - Buscar conversas mais recentes por esporte
async function getLatestConversationBySport(userId) {
  return await db("conversations")
    .where("user_id", userId)
    .whereIn("id", function () {
      this.select(db.raw("MAX(id)"))
        .from("conversations")
        .where("user_id", userId)
        .groupBy("sport");
    })
    .select("*");
}

// 4. TRANSAÇÃO - Criar usuário e primeira conversa atomicamente
async function createUserWithFirstConversation(
  username,
  password,
  firstMessage,
  sport
) {
  const trx = await db.transaction();

  try {
    // Inserir usuário
    const [userId] = await trx("users").insert({
      username,
      password,
    });

    // Inserir primeira conversa
    await trx("conversations").insert({
      user_id: userId,
      message: firstMessage,
      response: "Olá! Como posso ajudá-lo com " + sport + "?",
      sport: sport,
      conversation_id: 1,
    });

    await trx.commit();
    return { success: true, userId };
  } catch (error) {
    await trx.rollback();
    throw error;
  }
}

// 5. BUSCA AVANÇADA - Buscar conversas por texto
async function searchConversations(userId, searchTerm) {
  return await db("conversations")
    .where("user_id", userId)
    .where(function () {
      this.where("message", "like", `%${searchTerm}%`).orWhere(
        "response",
        "like",
        `%${searchTerm}%`
      );
    })
    .orderBy("timestamp", "desc");
}

// 6. PAGINAÇÃO - Buscar conversas com paginação
async function getConversationsPaginated(userId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  const conversations = await db("conversations")
    .where("user_id", userId)
    .orderBy("timestamp", "desc")
    .limit(limit)
    .offset(offset);

  const total = await db("conversations")
    .where("user_id", userId)
    .count("* as count")
    .first();

  return {
    conversations,
    pagination: {
      page,
      limit,
      total: total.count,
      pages: Math.ceil(total.count / limit),
    },
  };
}

// 7. VALIDAÇÃO - Verificar se usuário é dono da conversa
async function isUserOwnerOfConversation(userId, conversationId) {
  const conversation = await db("conversations")
    .where("user_id", userId)
    .where("conversation_id", conversationId)
    .first();

  return !!conversation;
}

// 8. ESTATÍSTICAS - Dashboard do usuário
async function getUserDashboard(userId) {
  const [totalConversations, totalByESport, recentConversations] =
    await Promise.all([
      // Total de conversas
      db("conversations").where("user_id", userId).count("* as total").first(),

      // Total por esporte
      db("conversations")
        .where("user_id", userId)
        .groupBy("sport")
        .select("sport")
        .count("* as total"),

      // Conversas recentes (últimas 5)
      db("conversations")
        .where("user_id", userId)
        .orderBy("timestamp", "desc")
        .limit(5),
    ]);

  return {
    totalConversations: totalConversations.total,
    conversationsBySport: totalByESport,
    recentConversations,
  };
}

// 9. BACKUP - Exportar todos os dados do usuário
async function exportUserData(userId) {
  const [user, conversations] = await Promise.all([
    db("users").where("id", userId).first(),
    db("conversations").where("user_id", userId).orderBy("timestamp", "asc"),
  ]);

  return {
    user: {
      id: user.id,
      username: user.username,
      created_at: user.created_at,
    },
    conversations,
  };
}

// 10. LIMPEZA - Remover conversas antigas
async function cleanOldConversations(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const deletedCount = await db("conversations")
    .where("timestamp", "<", cutoffDate)
    .del();

  return deletedCount;
}

module.exports = {
  getConversationsWithUserInfo,
  getConversationCountBySport,
  getLatestConversationBySport,
  createUserWithFirstConversation,
  searchConversations,
  getConversationsPaginated,
  isUserOwnerOfConversation,
  getUserDashboard,
  exportUserData,
  cleanOldConversations,
};
