// facades/ChatFacade.js - Facade para operações de chat
const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../database");

class ChatFacade {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Enviar mensagem e obter resposta da IA
   * @param {number} userId - ID do usuário
   * @param {string} message - Mensagem do usuário
   * @param {string} sport - Esporte da conversa
   * @param {number|null} conversationId - ID da conversa (opcional)
   * @returns {Promise<Object>} - Resultado com resposta e conversation_id
   */
  async sendMessage(userId, message, sport, conversationId = null) {
    try {
      // Validações
      if (!userId || !message || !sport) {
        return {
          success: false,
          error: "Dados obrigatórios não fornecidos.",
          respostaTexto: "Erro: dados incompletos.",
          conversationId: null,
        };
      }

      // Verificar se usuário existe
      const userExists = await this._userExists(userId);
      if (!userExists) {
        return {
          success: false,
          error: "Usuário não encontrado.",
          respostaTexto: "Erro: usuário inválido.",
          conversationId: null,
        };
      }

      // Gerar novo conversation_id se necessário
      if (!conversationId) {
        conversationId = await this._generateNewConversationId();
      }

      // Gerar resposta da IA
      const respostaTexto = await this._generateAIResponse(message, sport);

      // Salvar conversa no banco
      await this._saveConversation(
        userId,
        message,
        respostaTexto,
        sport,
        conversationId
      );

      return {
        success: true,
        respostaTexto,
        conversationId,
      };
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      return {
        success: false,
        error: "Erro interno do servidor.",
        respostaTexto: "Desculpe, ocorreu um erro ao processar sua mensagem.",
        conversationId: null,
      };
    }
  }

  /**
   * Obter conversas agrupadas por conversation_id
   * @param {number} userId - ID do usuário
   * @param {string|null} sport - Filtrar por esporte (opcional)
   * @returns {Promise<Object>} - Conversas agrupadas
   */
  async getConversationsGrouped(userId, sport = null) {
    try {
      let query = db("conversations").where("user_id", userId);

      if (sport) {
        query = query.where("sport", sport);
      }

      const results = await query
        .orderBy("conversation_id", "desc")
        .orderBy("timestamp", "asc");

      // Agrupar por conversation_id
      const grouped = {};
      results.forEach((conv) => {
        if (!grouped[conv.conversation_id]) {
          grouped[conv.conversation_id] = [];
        }
        grouped[conv.conversation_id].push(conv);
      });

      return grouped;
    } catch (error) {
      console.error("Erro ao buscar conversas:", error);
      return {};
    }
  }

  /**
   * Buscar conversas por termo
   * @param {number} userId - ID do usuário
   * @param {string} searchTerm - Termo de busca
   * @param {string|null} sport - Filtrar por esporte (opcional)
   * @returns {Promise<Array>} - Lista de conversas
   */
  async searchConversations(userId, searchTerm, sport = null) {
    try {
      let query = db("conversations")
        .where("user_id", userId)
        .where(function () {
          this.where("message", "like", `%${searchTerm}%`).orWhere(
            "response",
            "like",
            `%${searchTerm}%`
          );
        });

      if (sport) {
        query = query.where("sport", sport);
      }

      const results = await query.orderBy("timestamp", "desc").limit(20); // Limitar resultados

      return results;
    } catch (error) {
      console.error("Erro ao buscar conversas:", error);
      return [];
    }
  }

  /**
   * Deletar conversa individual
   * @param {number} conversationId - ID da conversa
   * @param {number} userId - ID do usuário (para validação)
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async deleteConversation(conversationId, userId) {
    try {
      // Verificar se a conversa pertence ao usuário
      const conversation = await db("conversations")
        .where("id", conversationId)
        .where("user_id", userId)
        .first();

      if (!conversation) {
        return false;
      }

      const result = await db("conversations")
        .where("id", conversationId)
        .del();
      return result > 0;
    } catch (error) {
      console.error("Erro ao apagar conversa:", error);
      return false;
    }
  }

  /**
   * Deletar thread inteira
   * @param {number} threadId - ID da thread (conversation_id)
   * @param {number} userId - ID do usuário (para validação)
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async deleteThread(threadId, userId) {
    try {
      // Verificar se a thread pertence ao usuário
      const conversation = await db("conversations")
        .where("conversation_id", threadId)
        .where("user_id", userId)
        .first();

      if (!conversation) {
        return false;
      }

      const result = await db("conversations")
        .where("conversation_id", threadId)
        .where("user_id", userId)
        .del();

      return result > 0;
    } catch (error) {
      console.error("Erro ao apagar thread:", error);
      return false;
    }
  }

  /**
   * Atualizar mensagem da conversa
   * @param {number} conversationId - ID da conversa
   * @param {string} newMessage - Nova mensagem
   * @param {number} userId - ID do usuário (para validação)
   * @returns {Promise<boolean>} - Sucesso da operação
   */
  async updateConversation(conversationId, newMessage, userId) {
    try {
      // Verificar se a conversa pertence ao usuário
      const conversation = await db("conversations")
        .where("id", conversationId)
        .where("user_id", userId)
        .first();

      if (!conversation) {
        return false;
      }

      const result = await db("conversations")
        .where("id", conversationId)
        .update({ message: newMessage });

      return result > 0;
    } catch (error) {
      console.error("Erro ao atualizar conversa:", error);
      return false;
    }
  }

  /**
   * Obter estatísticas do usuário
   * @param {number} userId - ID do usuário
   * @returns {Promise<Object>} - Estatísticas
   */
  async getUserStats(userId) {
    try {
      const [totalConversations, conversationsBySport, recentActivity] =
        await Promise.all([
          // Total de conversas
          db("conversations")
            .where("user_id", userId)
            .count("* as total")
            .first(),

          // Conversas por esporte
          db("conversations")
            .where("user_id", userId)
            .groupBy("sport")
            .select("sport")
            .count("* as total")
            .orderBy("total", "desc"),

          // Atividade recente (últimos 7 dias)
          db("conversations")
            .where("user_id", userId)
            .where("timestamp", ">=", db.raw("DATE_SUB(NOW(), INTERVAL 7 DAY)"))
            .count("* as total")
            .first(),
        ]);

      return {
        totalConversations: totalConversations.total || 0,
        conversationsBySport: conversationsBySport || [],
        recentActivity: recentActivity.total || 0,
      };
    } catch (error) {
      console.error("Erro ao obter estatísticas:", error);
      return {
        totalConversations: 0,
        conversationsBySport: [],
        recentActivity: 0,
      };
    }
  }

  // Métodos privados
  async _userExists(userId) {
    try {
      const user = await db("users").where("id", userId).first();
      return !!user;
    } catch (error) {
      return false;
    }
  }

  async _generateNewConversationId() {
    try {
      const maxConversation = await db("conversations")
        .max("conversation_id as maxId")
        .first();
      return (maxConversation.maxId || 0) + 1;
    } catch (error) {
      return 1;
    }
  }

  async _generateAIResponse(message, sport) {
    try {
      const prompt = `Você é um assistente IA especialista em ${sport}. Responda a pergunta do usuário "${message}" de forma clara e objetiva, levando em consideração as informações mais atuais disponibilizadas na internet.`;

      const response = await this.model.generateContent(prompt);
      return response.response.text();
    } catch (error) {
      console.error("Erro ao gerar resposta da IA:", error);
      return `Desculpe, ocorreu um erro ao processar sua pergunta sobre ${sport}. Tente novamente mais tarde.`;
    }
  }

  async _saveConversation(userId, message, response, sport, conversationId) {
    try {
      await db("conversations").insert({
        user_id: userId,
        message: message,
        response: response,
        sport: sport,
        conversation_id: conversationId,
      });
    } catch (error) {
      console.error("Erro ao salvar conversa:", error);
      throw error;
    }
  }
}

module.exports = ChatFacade;
