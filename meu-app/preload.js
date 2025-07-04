const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  abrirFutebol: () => ipcRenderer.send('abrir-futebol'),
  abrirFutsal: () => ipcRenderer.send('abrir-futsal'),
  abrirBasquete: () => ipcRenderer.send('abrir-basquete'),
  abrirVolei: () => ipcRenderer.send('abrir-volei'),
  enviarMensagem: (mensagem, userId, esporte) => ipcRenderer.invoke('enviar-mensagem', mensagem, userId, esporte),
  getConversas: (userId, esporte) => ipcRenderer.invoke('get-conversations', userId, esporte),
  apagarConversa: (id) => ipcRenderer.invoke('apagar-conversa', id),
  atualizarConversa: (id, novaMensagem) => ipcRenderer.invoke('atualizar-conversa', id, novaMensagem),
  getConversasAgrupadas: (userId, esporte) => ipcRenderer.invoke('get-conversations-grouped', userId, esporte),
  apagarThread: (conversationId) => ipcRenderer.invoke('apagar-thread', conversationId),
  invoke: (canal, ...args) => ipcRenderer.invoke(canal, ...args),
  on: (canal, func) => ipcRenderer.on(canal, func)
});