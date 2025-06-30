require('dotenv').config();
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'senacrs',
  database: 'chatbot'
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
    width: 1000,
    height: 800,
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
    width: 800,
    height: 600,
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

// Manipulador para processar mensagens do chatbot e salvar conversa
ipcMain.handle('enviar-mensagem', async (event, mensagem, userId, esporte) => {
  try {
    const prompt = `Você é um assistente IA especialista em ${esporte}. Responda a pergunta do usuário ${mensagem} de forma clara e objetiva, levando em consideração as informações mais atuais disponibilizadas na internet.`;
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const resposta = await model.generateContent(prompt);
    const respostaTexto = resposta.response.text();

    // Salva a conversa no banco de dados, incluindo o esporte
    db.query(
      'INSERT INTO conversations (user_id, message, response, sport) VALUES (?, ?, ?, ?)',
      [userId, mensagem, respostaTexto, esporte]
    );

    return respostaTexto;
  } catch (error) {
    console.error('Erro ao gerar resposta:', error.message || error);
    return 'Desculpe, ocorreu um erro ao processar sua mensagem.';
  }
});

// Buscar conversas do usuário (opcionalmente filtrando por esporte)
ipcMain.handle('get-conversations', async (event, userId, esporte = null) => {
  return new Promise((resolve) => {
    let sql = 'SELECT * FROM conversations WHERE user_id = ?';
    let params = [userId];
    if (esporte) {
      sql += ' AND sport = ?';
      params.push(esporte);
    }
    sql += ' ORDER BY timestamp DESC';
    db.query(sql, params, (err, results) => {
      if (err) resolve([]);
      else resolve(results);
    });
  })
});

ipcMain.handle('abrir-login', () => {
  if (mainWindow) {
    mainWindow.loadFile('login.html');
  }
});