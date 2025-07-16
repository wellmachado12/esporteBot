// facades/AppFacade.js - Facade principal da aplicação
const AuthFacade = require("./AuthFacade");
const ChatFacade = require("./ChatFacade");
const db = require("../database");

class AppFacade {
  constructor() {
    this.chatService = new ChatFacade();
  }

  // ========== MÉTODOS DE AUTENTICAÇÃO ========== //

  /**
   * Registrar usuário
   */
  async register(username, password) {
    return await AuthFacade.register(username, password);
  }

  /**
   * Login do usuário
   */
  async login(username, password) {
    return await AuthFacade.login(username, password);
  }

  /**
   * Verificar se usuário existe
   */
  async userExists(userId) {
    return await AuthFacade.userExists(userId);
  }

  /**
   * Obter informações do usuário
   */
  async getUserInfo(userId) {
    return await AuthFacade.getUserInfo(userId);
  }

  /**
   * Alterar senha
   */
  async changePassword(userId, currentPassword, newPassword) {
    return await AuthFacade.changePassword(
      userId,
      currentPassword,
      newPassword
    );
  }

  // ========== MÉTODOS DE CHAT ========== //

  /**
   * Enviar mensagem
   */
  async sendMessage(userId, message, sport, conversationId = null) {
    return await this.chatService.sendMessage(
      userId,
      message,
      sport,
      conversationId
    );
  }

  /**
   * Obter conversas agrupadas
   */
  async getConversationsGrouped(userId, sport = null) {
    return await this.chatService.getConversationsGrouped(userId, sport);
  }

  /**
   * Buscar conversas
   */
  async searchConversations(userId, searchTerm, sport = null) {
    return await this.chatService.searchConversations(
      userId,
      searchTerm,
      sport
    );
  }

  /**
   * Deletar conversa
   */
  async deleteConversation(conversationId, userId) {
    return await this.chatService.deleteConversation(conversationId, userId);
  }

  /**
   * Deletar thread
   */
  async deleteThread(threadId, userId) {
    return await this.chatService.deleteThread(threadId, userId);
  }

  /**
   * Atualizar conversa
   */
  async updateConversation(conversationId, newMessage, userId) {
    return await this.chatService.updateConversation(
      conversationId,
      newMessage,
      userId
    );
  }

  /**
   * Obter estatísticas do usuário
   */
  async getUserStats(userId) {
    return await this.chatService.getUserStats(userId);
  }

  // ========== MÉTODOS UTILITÁRIOS ========== //

  /**
   * Verificar saúde da aplicação
   */
  async healthCheck() {
    try {
      // Testar conexão com banco
      await db.raw("SELECT 1");

      // Verificar se tabelas existem
      const tablesExist = await Promise.all([
        db.schema.hasTable("users"),
        db.schema.hasTable("conversations"),
      ]);

      return {
        status: "healthy",
        database: "connected",
        tables: {
          users: tablesExist[0],
          conversations: tablesExist[1],
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Obter configurações da aplicação
   */
  getAppConfig() {
    return {
      sports: ["futebol", "futsal", "basquete", "volei"],
      maxMessageLength: 1000,
      maxConversationsPerUser: 100,
      supportedLanguages: ["pt-BR"],
      version: "1.0.0",
    };
  }

  /**
   * Limpar dados antigos (manutenção)
   */
  async cleanupOldData(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const deletedCount = await db("conversations")
        .where("timestamp", "<", cutoffDate)
        .del();

      return {
        success: true,
        deletedConversations: deletedCount,
        cutoffDate: cutoffDate.toISOString(),
      };
    } catch (error) {
      console.error("Erro na limpeza de dados:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Backup de dados do usuário
   */
  async exportUserData(userId) {
    try {
      const [userInfo, conversations] = await Promise.all([
        this.getUserInfo(userId),
        db("conversations")
          .where("user_id", userId)
          .orderBy("timestamp", "asc"),
      ]);

      if (!userInfo) {
        return { success: false, error: "Usuário não encontrado" };
      }

      return {
        success: true,
        data: {
          user: {
            id: userInfo.id,
            username: userInfo.username,
            created_at: userInfo.created_at,
          },
          conversations: conversations.map((conv) => ({
            id: conv.id,
            message: conv.message,
            response: conv.response,
            sport: conv.sport,
            conversation_id: conv.conversation_id,
            timestamp: conv.timestamp,
          })),
          exportDate: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Validar dados de entrada
   */
  validateInput(data, rules) {
    const errors = [];

    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];

      if (rule.required && (!value || value.toString().trim() === "")) {
        errors.push(`${field} é obrigatório`);
        continue;
      }

      if (value && rule.minLength && value.toString().length < rule.minLength) {
        errors.push(
          `${field} deve ter pelo menos ${rule.minLength} caracteres`
        );
      }

      if (value && rule.maxLength && value.toString().length > rule.maxLength) {
        errors.push(`${field} deve ter no máximo ${rule.maxLength} caracteres`);
      }

      if (value && rule.pattern && !rule.pattern.test(value.toString())) {
        errors.push(`${field} tem formato inválido`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Fechar conexões (cleanup)
   */
  async shutdown() {
    try {
      await db.destroy();
      console.log("Conexões fechadas com sucesso");
    } catch (error) {
      console.error("Erro ao fechar conexões:", error);
    }
  }
}

// Singleton pattern - uma única instância da facade
let appFacadeInstance = null;

function getAppFacade() {
  if (!appFacadeInstance) {
    appFacadeInstance = new AppFacade();
  }
  return appFacadeInstance;
}

module.exports = { AppFacade, getAppFacade };
