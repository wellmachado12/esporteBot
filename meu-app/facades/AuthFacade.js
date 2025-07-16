// facades/AuthFacade.js - Facade para operações de autenticação
const bcrypt = require("bcrypt");
const db = require("../database");

class AuthFacade {
  /**
   * Registrar um novo usuário
   * @param {string} username - Nome do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} - Resultado da operação
   */
  static async register(username, password) {
    try {
      // Validação básica
      if (!username || !password) {
        return { success: false, error: "Usuário e senha são obrigatórios." };
      }

      if (password.length < 6) {
        return {
          success: false,
          error: "Senha deve ter pelo menos 6 caracteres.",
        };
      }

      // Verificar se usuário já existe
      const existingUser = await db("users")
        .where("username", username)
        .first();
      if (existingUser) {
        return { success: false, error: "Usuário já existe." };
      }

      // Hash da senha
      const hash = await bcrypt.hash(password, 10);

      // Inserir usuário
      const [userId] = await db("users").insert({
        username: username,
        password: hash,
      });

      return { success: true, userId };
    } catch (error) {
      console.error("Erro no registro:", error);
      if (error.code === "ER_DUP_ENTRY") {
        return { success: false, error: "Usuário já existe." };
      }
      return { success: false, error: "Erro interno do servidor." };
    }
  }

  /**
   * Fazer login do usuário
   * @param {string} username - Nome do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<Object>} - Resultado da operação
   */
  static async login(username, password) {
    try {
      // Validação básica
      if (!username || !password) {
        return { success: false, error: "Usuário e senha são obrigatórios." };
      }

      // Buscar usuário
      const user = await db("users").where("username", username).first();
      if (!user) {
        return { success: false, error: "Usuário não encontrado." };
      }

      // Verificar senha
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return { success: false, error: "Senha incorreta." };
      }

      return { success: true, userId: user.id, username: user.username };
    } catch (error) {
      console.error("Erro no login:", error);
      return { success: false, error: "Erro interno do servidor." };
    }
  }

  /**
   * Verificar se usuário existe
   * @param {number} userId - ID do usuário
   * @returns {Promise<boolean>} - Se o usuário existe
   */
  static async userExists(userId) {
    try {
      const user = await db("users").where("id", userId).first();
      return !!user;
    } catch (error) {
      console.error("Erro ao verificar usuário:", error);
      return false;
    }
  }

  /**
   * Obter informações do usuário
   * @param {number} userId - ID do usuário
   * @returns {Promise<Object|null>} - Dados do usuário
   */
  static async getUserInfo(userId) {
    try {
      const user = await db("users")
        .where("id", userId)
        .select("id", "username", "created_at")
        .first();
      return user || null;
    } catch (error) {
      console.error("Erro ao obter dados do usuário:", error);
      return null;
    }
  }

  /**
   * Alterar senha do usuário
   * @param {number} userId - ID do usuário
   * @param {string} currentPassword - Senha atual
   * @param {string} newPassword - Nova senha
   * @returns {Promise<Object>} - Resultado da operação
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      // Validação
      if (!currentPassword || !newPassword) {
        return { success: false, error: "Senhas são obrigatórias." };
      }

      if (newPassword.length < 6) {
        return {
          success: false,
          error: "Nova senha deve ter pelo menos 6 caracteres.",
        };
      }

      // Verificar usuário e senha atual
      const user = await db("users").where("id", userId).first();
      if (!user) {
        return { success: false, error: "Usuário não encontrado." };
      }

      const isCurrentValid = await bcrypt.compare(
        currentPassword,
        user.password
      );
      if (!isCurrentValid) {
        return { success: false, error: "Senha atual incorreta." };
      }

      // Hash da nova senha
      const newHash = await bcrypt.hash(newPassword, 10);

      // Atualizar senha
      await db("users").where("id", userId).update({ password: newHash });

      return { success: true };
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      return { success: false, error: "Erro interno do servidor." };
    }
  }
}

module.exports = AuthFacade;
