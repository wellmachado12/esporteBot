const { test, expect } = require('@playwright/test');

test('fluxo completo do EsporteBot', async ({ page, context }) => {
  // 1. Acessa a tela de login
  await page.goto('file://' + __dirname + '/../login.html');

  // 2. Faz cadastro de novo usuário
  await page.click('#btn-mostrar-cadastro');
  await page.fill('#register-username', 'wellteste');
  await page.fill('#register-password', '123456');
  await page.click('#register-form button[type="submit"]');
  await page.waitForTimeout(1000);
  await page.click('#btn-voltar-login');

  // 3. Faz login
  await page.fill('#login-username', 'wellteste');
  await page.fill('#login-password', '123456');
  await page.click('#login-form button[type="submit"]');
  await page.waitForTimeout(2000);

  // 4. Abre o chat de Futebol (pode abrir em nova janela)
  const [chatPage] = await Promise.all([
    context.waitForEvent('page'),
    page.click('#btn-futebol')
  ]);
  await chatPage.waitForLoadState();

  // 5. Envia uma mensagem no chat de Futebol
  await chatPage.fill('#mensagem', 'Olá, galera!');
  await chatPage.click('#chat-form button[type="submit"]');
  await chatPage.waitForTimeout(1000);

  // 6. Fecha o chat de Futebol
  await chatPage.click('#btn-fechar');
  await chatPage.close();

  // 7. De volta ao menu principal, faz logout
  await page.bringToFront();
  await page.click('#btn-logout');
  await page.waitForTimeout(1000);

  // Screenshot final do fluxo
  await page.screenshot({ path: 'fluxo-completo.png' });
});