const userId = localStorage.getItem('userId');
const esporte = document.body.getAttribute('data-esporte');

const botAvatar = document.getElementById('bot-avatar');
if (botAvatar) {
  let img = 'img/robo futebol.jpg';
  if (esporte === 'futsal') img = 'img/robo futebol.jpg';
  else if (esporte === 'basquete') img = 'img/robo basquete.jfif';
  else if (esporte === 'volei') img = 'img/robo volei.jpg';
  botAvatar.src = img;
}

let conversationId = null;

document.getElementById('chat-form').onsubmit = async (e) => {
  e.preventDefault();
  const mensagem = document.getElementById('mensagem').value;
  adicionarMensagem('Você', mensagem, 'usuario');
  document.getElementById('mensagem').value = '';
  // Envia também o conversationId atual (ou null para nova thread)
  const respostaObj = await window.electronAPI.enviarMensagem(mensagem, userId, esporte, conversationId);
  adicionarMensagem('Bot', respostaObj.respostaTexto, 'bot');
  // Atualiza conversationId para manter a thread
  if (respostaObj.conversationId) conversationId = respostaObj.conversationId;
};

function adicionarMensagem(remetente, texto, classe) {
  const div = document.createElement('div');
  div.className = 'mensagem ' + classe;
  let img = 'img/robo futebol.jpg';
  if (esporte === 'futsal') img = 'img/robo futebol.jpg';
  else if (esporte === 'basquete') img = 'img/robo basquete.jfif';
  else if (esporte === 'volei') img = 'img/robo volei.jpg';
  if (classe === 'bot') {
    div.innerHTML = `<img src="${img}" class="bot-avatar-mini"> <span>${remetente}: ${texto}</span>`;
  } else {
    div.textContent = `${remetente}: ${texto}`;
  }
  document.getElementById('mensagens').appendChild(div);
}

// Exibir histórico agrupado por conversation_id (estilo ChatGPT)
document.getElementById('btn-historico').onclick = async () => {
  document.getElementById('chat-form').style.display = 'none';
  document.getElementById('mensagens').style.display = 'none';
  document.getElementById('historico').style.display = 'block';
  const historico = await window.electronAPI.getConversasAgrupadas(userId, esporte);
  const lista = document.getElementById('lista-conversas');
  lista.innerHTML = '';
  Object.entries(historico).forEach(([conversationId, mensagens]) => {
    const bloco = document.createElement('div');
    bloco.className = 'bloco-conversa';
    bloco.innerHTML = `<b>Conversa #${conversationId}</b><br>`;
    mensagens.forEach(conv => {
      bloco.innerHTML += `
        <div class="mensagem usuario">Você: ${conv.message}</div>
        <div class="mensagem bot">Bot: ${conv.response}</div>
      `;
    });
    bloco.innerHTML += `
      <div class="botoes-historico">
        <button class="btn-continuar-thread" data-id="${conversationId}">Continuar conversa</button>
        <button class="btn-apagar-thread" data-id="${conversationId}">Apagar conversa</button>
      </div>
      <hr>
    `;
    lista.appendChild(bloco);
  });

  // Apagar thread
  document.querySelectorAll('.btn-apagar-thread').forEach(btn => {
  btn.onclick = async () => {
    const id = btn.getAttribute('data-id');
    const ok = await window.electronAPI.apagarThread(id);
    if (ok) {
      btn.closest('.bloco-conversa').remove();
    } else {
      alert('Erro ao apagar conversa!');
    }
  };
});

  // Continuar thread
  document.querySelectorAll('.btn-continuar-thread').forEach(btn => {
    btn.onclick = () => {
      conversationId = btn.getAttribute('data-id');
      document.getElementById('historico').style.display = 'none';
      document.getElementById('chat-form').style.display = 'block';
      document.getElementById('mensagens').style.display = 'block';
      document.getElementById('mensagem').focus();
    };
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