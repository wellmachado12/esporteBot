require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao MySQL:', err);
  } else {
    console.log('Conectado ao MySQL!');
  }
});

let mainWindow;

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 1000,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
  });

  mainWindow.loadFile('login.html');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
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
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
  });
  win.loadFile(file);
}

// Abrir chats de esportes
ipcMain.on('abrir-futebol', () => {
  createWindow('Futebol', 'futebol.html');
});
ipcMain.on('abrir-futsal', () => {
  createWindow('Futsal', 'futsal.html');
});
ipcMain.on('abrir-basquete', () => {
  createWindow('Basquete', 'basquete.html');
});
ipcMain.on('abrir-volei', () => {
  createWindow('Vôlei', 'volei.html');
});

// Cadastro
ipcMain.handle('register', async (event, username, password) => {
  return new Promise((resolve) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return resolve({ success: false, error: 'Erro ao criptografar senha.' });
      db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err, results) => {
        if (err) {
          console.error('Erro ao cadastrar usuário:', err);
          return resolve({ success: false, error: 'Usuário já existe ou erro no banco.' });
        }
        resolve({ success: true });
      });
    });
  });
});

// Login
ipcMain.handle('login', async (event, username, password) => {
  return new Promise((resolve) => {
    db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
      if (err || results.length === 0) return resolve({ success: false, error: 'Usuário não encontrado.' });
      const user = results[0];
      bcrypt.compare(password, user.password, (err, result) => {
        if (result) resolve({ success: true, userId: user.id });
        else resolve({ success: false, error: 'Senha incorreta.' });
      });
    });
  });
});

// Trocar para a tela principal após login
ipcMain.handle('abrir-index', () => {
  if (mainWindow) {
    mainWindow.loadFile('index.html');
  }
});

// CREATE - Nova mensagem/conversa (com conversation_id)
ipcMain.handle('enviar-mensagem', async (event, mensagem, userId, esporte, conversationId = null) => {
  try {
    // Se não veio conversationId, cria um novo (buscando o maior + 1)
    if (!conversationId) {
      const [rows] = await db.promise().query('SELECT MAX(conversation_id) as maxId FROM conversations');
      conversationId = (rows[0].maxId || 0) + 1;
    }
    const prompt = `Você é um assistente IA especialista em ${esporte}. Responda a pergunta do usuário ${mensagem} de forma clara e objetiva, levando em consideração as informações mais atuais disponibilizadas na internet.`;
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const resposta = await model.generateContent(prompt);
    const respostaTexto = resposta.response.text();

    db.query(
      'INSERT INTO conversations (user_id, message, response, sport, conversation_id) VALUES (?, ?, ?, ?, ?)',
      [userId, mensagem, respostaTexto, esporte, conversationId]
    );

    return { respostaTexto, conversationId };
  } catch (error) {
    console.error('Erro ao gerar resposta:', error.message || error);
    return { respostaTexto: 'Desculpe, ocorreu um erro ao processar sua mensagem.', conversationId: null };
  }
});

// READ - Buscar conversas agrupadas por conversation_id
ipcMain.handle('get-conversations-grouped', async (event, userId, esporte = null) => {
  return new Promise((resolve) => {
    let sql = 'SELECT * FROM conversations WHERE user_id = ?';
    let params = [userId];
    if (esporte) {
      sql += ' AND sport = ?';
      params.push(esporte);
    }
    sql += ' ORDER BY conversation_id DESC, timestamp ASC';
    db.query(sql, params, (err, results) => {
      if (err) return resolve([]);
      // Agrupa por conversation_id
      const grouped = {};
      results.forEach(conv => {
        if (!grouped[conv.conversation_id]) grouped[conv.conversation_id] = [];
        grouped[conv.conversation_id].push(conv);
      });
      resolve(grouped);
    });
  });
});

// DELETE - Apagar conversa (por id individual)
ipcMain.handle('apagar-conversa', async (event, id) => {
  return new Promise((resolve) => {
    db.query('DELETE FROM conversations WHERE id = ?', [id], (err, result) => {
      if (err) resolve(false);
      else resolve(true);
    });
  });
});

// DELETE - Apagar conversa inteira (por conversation_id)
ipcMain.handle('apagar-thread', async (event, conversationId) => {
  return new Promise((resolve) => {
    db.query('DELETE FROM conversations WHERE conversation_id = ?', [conversationId], (err, result) => {
      if (err) resolve(false);
      else resolve(true);
    });
  });
});

// UPDATE - Atualizar mensagem da conversa
ipcMain.handle('atualizar-conversa', async (event, id, novaMensagem) => {
  return new Promise((resolve) => {
    db.query('UPDATE conversations SET message = ? WHERE id = ?', [novaMensagem, id], (err, result) => {
      if (err) resolve(false);
      else resolve(true);
    });
  });
});

ipcMain.handle('abrir-login', () => {
  if (mainWindow) {
    mainWindow.loadFile('login.html');
  }
});