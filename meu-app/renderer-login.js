// Alternar para tela de cadastro
document.getElementById('btn-mostrar-cadastro').onclick = () => {
  document.getElementById('login-area').style.display = 'none';
  document.getElementById('cadastro-area').style.display = 'block';
};

// Voltar para tela de login
document.getElementById('btn-voltar-login').onclick = () => {
  document.getElementById('cadastro-area').style.display = 'none';
  document.getElementById('login-area').style.display = 'block';
};

// Cadastro
document.getElementById('register-form').onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById('register-username').value;
  const password = document.getElementById('register-password').value;
  const result = await window.electronAPI.invoke('register', username, password);
  if (result.success) {
    document.getElementById('register-erro').textContent = 'Cadastro realizado! Faça login.';
  } else {
    document.getElementById('register-erro').textContent = result.error;
  }
};

// Login
document.getElementById('login-form').onsubmit = async (e) => {
  e.preventDefault();
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const result = await window.electronAPI.invoke('login', username, password);
  if (result.success) {
    localStorage.setItem('userId', result.userId);
    await window.electronAPI.invoke('abrir-index');
  } else {
    document.getElementById('login-erro').textContent = result.error;
  }
};