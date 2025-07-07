require("dotenv").config();
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { getAppFacade } = require("./facades");

// Instância única da facade
const appFacade = getAppFacade();

// Testar conexão e saúde da aplicação
appFacade
  .healthCheck()
  .then((health) => {
    if (health.status === "healthy") {
      console.log("✅ Aplicação iniciada com sucesso!");
      console.log("📊 Status do banco:", health.database);
    } else {
      console.error("❌ Problema na inicialização:", health.error);
    }
  })
  .catch((err) => {
    console.error("❌ Erro na verificação de saúde:", err);
  });

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile("login.html");

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

function createWindow(title, file) {
  const win = new BrowserWindow({
    width: 1000,
    height: 900,
    title: title,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(file);
}

// Abrir chats de esportes
ipcMain.on("abrir-futebol", () => {
  createWindow("Futebol", "futebol.html");
});
ipcMain.on("abrir-futsal", () => {
  createWindow("Futsal", "futsal.html");
});
ipcMain.on("abrir-basquete", () => {
  createWindow("Basquete", "basquete.html");
});
ipcMain.on("abrir-volei", () => {
  createWindow("Vôlei", "volei.html");
});

// Cadastro
ipcMain.handle("register", async (event, username, password) => {
  return await appFacade.register(username, password);
});

// Login
ipcMain.handle("login", async (event, username, password) => {
  return await appFacade.login(username, password);
});

// Trocar para a tela principal após login
ipcMain.handle("abrir-index", () => {
  if (mainWindow) {
    mainWindow.loadFile("index.html");
  }
});

// CREATE - Nova mensagem/conversa (com conversation_id)
ipcMain.handle(
  "enviar-mensagem",
  async (event, mensagem, userId, esporte, conversationId = null) => {
    return await appFacade.sendMessage(
      userId,
      mensagem,
      esporte,
      conversationId
    );
  }
);

// READ - Buscar conversas agrupadas por conversation_id
ipcMain.handle(
  "get-conversations-grouped",
  async (event, userId, esporte = null) => {
    return await appFacade.getConversationsGrouped(userId, esporte);
  }
);

// DELETE - Apagar conversa (por id individual)
ipcMain.handle("apagar-conversa", async (event, id, userId) => {
  return await appFacade.deleteConversation(id, userId);
});

// DELETE - Apagar conversa inteira (por conversation_id)
ipcMain.handle("apagar-thread", async (event, conversationId, userId) => {
  return await appFacade.deleteThread(conversationId, userId);
});

// UPDATE - Atualizar mensagem da conversa
ipcMain.handle(
  "atualizar-conversa",
  async (event, id, novaMensagem, userId) => {
    return await appFacade.updateConversation(id, novaMensagem, userId);
  }
);

// BUSCA - Buscar conversas por termo
ipcMain.handle(
  "search-conversations",
  async (event, userId, searchTerm, sport = null) => {
    return await appFacade.searchConversations(userId, searchTerm, sport);
  }
);

// ESTATÍSTICAS - Obter estatísticas do usuário
ipcMain.handle("get-user-stats", async (event, userId) => {
  return await appFacade.getUserStats(userId);
});

// CONFIGURAÇÕES - Obter configurações da aplicação
ipcMain.handle("get-app-config", async (event) => {
  return appFacade.getAppConfig();
});

// SAÚDE - Verificar saúde da aplicação
ipcMain.handle("health-check", async (event) => {
  return await appFacade.healthCheck();
});

// BACKUP - Exportar dados do usuário
ipcMain.handle("export-user-data", async (event, userId) => {
  return await appFacade.exportUserData(userId);
});

// USUÁRIO - Obter informações do usuário
ipcMain.handle("get-user-info", async (event, userId) => {
  return await appFacade.getUserInfo(userId);
});

// SENHA - Alterar senha do usuário
ipcMain.handle(
  "change-password",
  async (event, userId, currentPassword, newPassword) => {
    return await appFacade.changePassword(userId, currentPassword, newPassword);
  }
);

// MANUTENÇÃO - Limpar dados antigos
ipcMain.handle("cleanup-old-data", async (event, daysOld = 30) => {
  return await appFacade.cleanupOldData(daysOld);
});

ipcMain.handle("abrir-login", () => {
  if (mainWindow) {
    mainWindow.loadFile("login.html");
  }
});
