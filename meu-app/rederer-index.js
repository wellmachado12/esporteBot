document.getElementById('btn-futebol').onclick = () => {
  window.electronAPI.abrirFutebol();
};
document.getElementById('btn-futsal').onclick = () => {
  window.electronAPI.abrirFutsal();
};
document.getElementById('btn-basquete').onclick = () => {
  window.electronAPI.abrirBasquete();
};
document.getElementById('btn-volei').onclick = () => {
  window.electronAPI.abrirVolei();
};
document.getElementById('btn-logout').onclick = async () => {
  localStorage.removeItem('userId');
  await window.electronAPI.invoke('abrir-login');
};