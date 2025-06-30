const userId = localStorage.getItem('userId');
const esporte = document.body.getAttribute('data-esporte');

document.getElementById('chat-form').onsubmit = async (e) => {
  e.preventDefault();
  const mensagem = document.getElementById('mensagem').value;
  adicionarMensagem('Você', mensagem, 'usuario');
  document.getElementById('mensagem').value = '';
  const resposta = await window.electronAPI.enviarMensagem(mensagem, userId, esporte);
  adicionarMensagem('Bot', resposta, 'bot');
};

function adicionarMensagem(remetente, texto, classe) {
  const div = document.createElement('div');
  div.className = 'mensagem ' + classe;
  div.textContent = `${remetente}: ${texto}`;
  document.getElementById('mensagens').appendChild(div);
}

document.getElementById('btn-historico').onclick = async () => {
  document.getElementById('chat-form').style.display = 'none';
  document.getElementById('mensagens').style.display = 'none';
  document.getElementById('historico').style.display = 'block';
  const conversas = await window.electronAPI.getConversas(userId, esporte);
  const lista = document.getElementById('lista-conversas');
  lista.innerHTML = '';
  conversas.forEach(conv => {
    const item = document.createElement('div');
    item.innerHTML = `<b>${new Date(conv.timestamp).toLocaleString()}</b><br>
      <span class="usuario">Você: ${conv.message}</span><br>
      <span class="bot">Bot: ${conv.response}</span><hr>`;
    lista.appendChild(item);
  });
};

document.getElementById('btn-voltar').onclick = () => {
  document.getElementById('historico').style.display = 'none';
  document.getElementById('chat-form').style.display = 'block';
  document.getElementById('mensagens').style.display = 'block';
};

document.getElementById('btn-fechar').onclick = () => {
  window.close();
};