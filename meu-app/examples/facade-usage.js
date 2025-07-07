// examples/facade-usage.js - Exemplos de uso das facades

const { getAppFacade, AuthFacade, ChatFacade } = require("../facades");

// Exemplo 1: Usando a facade principal (recomendado)
async function exemploUsoFacadePrincipal() {
  const appFacade = getAppFacade();

  try {
    // 1. Verificar saúde da aplicação
    const health = await appFacade.healthCheck();
    console.log("Status da aplicação:", health.status);

    // 2. Registrar usuário
    const registerResult = await appFacade.register(
      "usuario_teste",
      "senha123"
    );
    if (registerResult.success) {
      console.log("✅ Usuário registrado com sucesso:", registerResult.userId);
    }

    // 3. Fazer login
    const loginResult = await appFacade.login("usuario_teste", "senha123");
    if (loginResult.success) {
      console.log("✅ Login realizado:", loginResult.userId);

      const userId = loginResult.userId;

      // 4. Enviar mensagem
      const messageResult = await appFacade.sendMessage(
        userId,
        "Quais são as regras do futebol?",
        "futebol"
      );

      if (messageResult.success) {
        console.log("✅ Mensagem enviada:", {
          resposta: messageResult.respostaTexto.substring(0, 100) + "...",
          conversationId: messageResult.conversationId,
        });
      }

      // 5. Obter estatísticas
      const stats = await appFacade.getUserStats(userId);
      console.log("📊 Estatísticas do usuário:", stats);

      // 6. Buscar conversas
      const conversations = await appFacade.getConversationsGrouped(userId);
      console.log(
        "💬 Total de threads de conversa:",
        Object.keys(conversations).length
      );

      // 7. Exportar dados
      const exportData = await appFacade.exportUserData(userId);
      if (exportData.success) {
        console.log("📋 Dados exportados:", {
          usuario: exportData.data.user.username,
          totalConversas: exportData.data.conversations.length,
        });
      }
    }
  } catch (error) {
    console.error("❌ Erro no exemplo:", error);
  }
}

// Exemplo 2: Usando facades individuais
async function exemploUsoFacadesIndividuais() {
  try {
    // Facade de autenticação
    const authResult = await AuthFacade.register(
      "outro_usuario",
      "outrasenha123"
    );
    console.log("Auth result:", authResult);

    if (authResult.success) {
      // Facade de chat
      const chatFacade = new ChatFacade();
      const messageResult = await chatFacade.sendMessage(
        authResult.userId,
        "Como melhorar no basquete?",
        "basquete"
      );

      console.log(
        "Chat result:",
        messageResult.success ? "Mensagem enviada" : "Erro"
      );
    }
  } catch (error) {
    console.error("❌ Erro no exemplo individual:", error);
  }
}

// Exemplo 3: Validação de dados
async function exemploValidacao() {
  const appFacade = getAppFacade();

  // Regras de validação
  const userValidationRules = {
    username: { required: true, minLength: 3, maxLength: 50 },
    password: { required: true, minLength: 6, maxLength: 100 },
    email: {
      required: false,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
  };

  // Dados para validar
  const userData = {
    username: "us", // Muito curto
    password: "123", // Muito curto
    email: "email-invalido",
  };

  const validation = appFacade.validateInput(userData, userValidationRules);

  if (!validation.isValid) {
    console.log("❌ Dados inválidos:", validation.errors);
  } else {
    console.log("✅ Dados válidos");
  }
}

// Exemplo 4: Busca avançada
async function exemploBuscaAvancada() {
  const appFacade = getAppFacade();

  try {
    // Assumindo que temos um usuário logado
    const userId = 1;

    // Buscar conversas por termo
    const searchResults = await appFacade.searchConversations(
      userId,
      "futebol",
      "futebol" // filtrar apenas por esporte futebol
    );

    console.log("🔍 Resultados da busca:", searchResults.length);

    // Buscar conversas de basquete
    const basketConversations = await appFacade.getConversationsGrouped(
      userId,
      "basquete"
    );
    console.log(
      "🏀 Conversas de basquete:",
      Object.keys(basketConversations).length
    );
  } catch (error) {
    console.error("❌ Erro na busca:", error);
  }
}

// Exemplo 5: Manutenção e limpeza
async function exemploManutencao() {
  const appFacade = getAppFacade();

  try {
    // Limpar conversas antigas (mais de 30 dias)
    const cleanupResult = await appFacade.cleanupOldData(30);

    if (cleanupResult.success) {
      console.log("🧹 Limpeza concluída:", {
        conversasRemovidas: cleanupResult.deletedConversations,
        dataCorte: cleanupResult.cutoffDate,
      });
    }

    // Verificar saúde após limpeza
    const health = await appFacade.healthCheck();
    console.log("💓 Saúde pós-limpeza:", health.status);
  } catch (error) {
    console.error("❌ Erro na manutenção:", error);
  }
}

// Exemplo 6: Gerenciamento de sessão
class SessionManager {
  constructor() {
    this.appFacade = getAppFacade();
    this.currentUser = null;
  }

  async login(username, password) {
    const result = await this.appFacade.login(username, password);

    if (result.success) {
      this.currentUser = {
        id: result.userId,
        username: result.username,
        loginTime: new Date(),
      };

      console.log("👤 Usuário logado:", this.currentUser);
    }

    return result;
  }

  async sendMessage(message, sport) {
    if (!this.currentUser) {
      throw new Error("Usuário não está logado");
    }

    return await this.appFacade.sendMessage(
      this.currentUser.id,
      message,
      sport
    );
  }

  async getMyStats() {
    if (!this.currentUser) {
      throw new Error("Usuário não está logado");
    }

    return await this.appFacade.getUserStats(this.currentUser.id);
  }

  logout() {
    console.log("👋 Usuário deslogado:", this.currentUser?.username);
    this.currentUser = null;
  }

  isLoggedIn() {
    return this.currentUser !== null;
  }
}

// Função principal para executar exemplos
async function executarExemplos() {
  console.log("🚀 Executando exemplos de uso das facades...\n");

  console.log("1️⃣ Exemplo: Facade Principal");
  await exemploUsoFacadePrincipal();

  console.log("\n2️⃣ Exemplo: Facades Individuais");
  await exemploUsoFacadesIndividuais();

  console.log("\n3️⃣ Exemplo: Validação");
  await exemploValidacao();

  console.log("\n4️⃣ Exemplo: Busca Avançada");
  await exemploBuscaAvancada();

  console.log("\n5️⃣ Exemplo: Manutenção");
  await exemploManutencao();

  console.log("\n6️⃣ Exemplo: Gerenciador de Sessão");
  const sessionManager = new SessionManager();
  const loginResult = await sessionManager.login("admin", "admin123");

  if (loginResult.success) {
    const stats = await sessionManager.getMyStats();
    console.log("Estatísticas da sessão:", stats);
    sessionManager.logout();
  }

  console.log("\n✅ Todos os exemplos executados!");
}

// Exportar para uso
module.exports = {
  exemploUsoFacadePrincipal,
  exemploUsoFacadesIndividuais,
  exemploValidacao,
  exemploBuscaAvancada,
  exemploManutencao,
  SessionManager,
  executarExemplos,
};

// Executar se for chamado diretamente
if (require.main === module) {
  executarExemplos().catch(console.error);
}
