const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  abrirFutebol: () => ipcRenderer.send('abrir-futebol'),
  abrirFutsal: () => ipcRenderer.send('abrir-futsal'),
  abrirBasquete: () => ipcRenderer.send('abrir-basquete'),
  abrirVolei: () => ipcRenderer.send('abrir-volei'),
  enviarMensagem: (mensagem, userId, esporte) => ipcRenderer.invoke('enviar-mensagem', mensagem, userId, esporte),
  getConversas: (userId, esporte) => ipcRenderer.invoke('get-conversations', userId, esporte),
  invoke: (canal, ...args) => ipcRenderer.invoke(canal, ...args),
  on: (canal, func) => ipcRenderer.on(canal, func)
});