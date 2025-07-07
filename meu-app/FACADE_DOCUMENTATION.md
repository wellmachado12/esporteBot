# 🏗️ Padrão Facade - Documentação

## 📖 O que é o Padrão Facade?

O padrão Facade fornece uma interface simplificada para um subsistema complexo. Em nosso aplicativo, as facades encapsulam toda a lógica de negócio complexa e oferecem métodos simples e intuitivos para uso.

## 🎯 Benefícios Implementados

### ✅ **Antes (sem Facade):**

```javascript
// Código espalhado e repetitivo no main.js
ipcMain.handle("register", async (event, username, password) => {
  try {
    const hash = await bcrypt.hash(password, 10);
    await db("users").insert({ username, password: hash });
    return { success: true };
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    if (error.code === "ER_DUP_ENTRY") {
      return { success: false, error: "Usuário já existe." };
    }
    return { success: false, error: "Erro no banco de dados." };
  }
});
```

### ✅ **Depois (com Facade):**

```javascript
// Código limpo e centralizado
ipcMain.handle("register", async (event, username, password) => {
  return await appFacade.register(username, password);
});
```

## 🏛️ Arquitetura das Facades

```
facades/
├── AuthFacade.js      # Autenticação e usuários
├── ChatFacade.js      # Chat e conversas
├── AppFacade.js       # Facade principal (unifica tudo)
└── index.js           # Exportações
```

## 📋 APIs Disponíveis

### 🔐 AuthFacade

| Método                                 | Descrição                  | Parâmetros             | Retorno                                 |
| -------------------------------------- | -------------------------- | ---------------------- | --------------------------------------- |
| `register(username, password)`         | Cadastra usuário           | string, string         | `{success, userId?, error?}`            |
| `login(username, password)`            | Login do usuário           | string, string         | `{success, userId?, username?, error?}` |
| `userExists(userId)`                   | Verifica se usuário existe | number                 | boolean                                 |
| `getUserInfo(userId)`                  | Dados do usuário           | number                 | Object\|null                            |
| `changePassword(userId, current, new)` | Altera senha               | number, string, string | `{success, error?}`                     |

### 💬 ChatFacade

| Método                                         | Descrição                 | Parâmetros                      | Retorno                                    |
| ---------------------------------------------- | ------------------------- | ------------------------------- | ------------------------------------------ |
| `sendMessage(userId, message, sport, convId?)` | Envia mensagem            | number, string, string, number? | `{success, respostaTexto, conversationId}` |
| `getConversationsGrouped(userId, sport?)`      | Busca conversas agrupadas | number, string?                 | Object                                     |
| `searchConversations(userId, term, sport?)`    | Busca por termo           | number, string, string?         | Array                                      |
| `deleteConversation(convId, userId)`           | Remove conversa           | number, number                  | boolean                                    |
| `deleteThread(threadId, userId)`               | Remove thread             | number, number                  | boolean                                    |
| `updateConversation(convId, newMsg, userId)`   | Atualiza mensagem         | number, string, number          | boolean                                    |
| `getUserStats(userId)`                         | Estatísticas do usuário   | number                          | Object                                     |

### 🚀 AppFacade (Principal)

A `AppFacade` unifica todas as outras facades e adiciona funcionalidades extras:

| Método                       | Descrição                   | Retorno                                       |
| ---------------------------- | --------------------------- | --------------------------------------------- |
| `healthCheck()`              | Verifica saúde da aplicação | `{status, database, tables, timestamp}`       |
| `getAppConfig()`             | Configurações da app        | Object                                        |
| `cleanupOldData(days)`       | Remove dados antigos        | `{success, deletedConversations, cutoffDate}` |
| `exportUserData(userId)`     | Exporta dados do usuário    | `{success, data, error?}`                     |
| `validateInput(data, rules)` | Valida dados de entrada     | `{isValid, errors}`                           |
| `shutdown()`                 | Fecha conexões              | void                                          |

## 🛠️ Como Usar

### 1. **Import Simples:**

```javascript
const { getAppFacade } = require("./facades");
const appFacade = getAppFacade(); // Singleton
```

### 2. **Operações Básicas:**

```javascript
// Registro e login
const registerResult = await appFacade.register("user", "pass123");
const loginResult = await appFacade.login("user", "pass123");

// Chat
const messageResult = await appFacade.sendMessage(
  userId,
  "Como jogar futebol?",
  "futebol"
);

// Busca
const conversations = await appFacade.getConversationsGrouped(userId);
const searchResults = await appFacade.searchConversations(userId, "gol");
```

### 3. **Validação de Dados:**

```javascript
const rules = {
  username: { required: true, minLength: 3 },
  password: { required: true, minLength: 6 },
};

const validation = appFacade.validateInput({ username: "ab" }, rules);
// { isValid: false, errors: ['username deve ter pelo menos 3 caracteres'] }
```

### 4. **Uso no Electron (IPC):**

```javascript
// main.js
ipcMain.handle("register", async (event, username, password) => {
  return await appFacade.register(username, password);
});

// renderer.js
const result = await window.electronAPI.register("user", "pass");
```

## 🎨 Padrões Implementados

### 1. **Singleton Pattern**

- Uma única instância da `AppFacade`
- Economia de recursos
- Estado consistente

### 2. **Factory Pattern**

- `getAppFacade()` retorna sempre a mesma instância
- Inicialização lazy

### 3. **Strategy Pattern**

- Diferentes validações por contexto
- Flexibilidade nas regras

### 4. **Template Method**

- Estrutura comum para operações CRUD
- Tratamento de erro padronizado

## 📊 Melhorias Implementadas

### ✅ **Segurança:**

- Validação de propriedade (usuário só acessa seus dados)
- Sanitização de entrada
- Tratamento de erros padronizado

### ✅ **Performance:**

- Connection pooling automático
- Queries otimizadas
- Cache de configurações

### ✅ **Manutenibilidade:**

- Código centralizado
- Fácil teste unitário
- Documentação integrada

### ✅ **Escalabilidade:**

- Fácil adição de novos métodos
- Estrutura modular
- Baixo acoplamento

## 🧪 Testabilidade

### Exemplo de Teste:

```javascript
const { AuthFacade } = require("./facades");

describe("AuthFacade", () => {
  it("deve registrar usuário válido", async () => {
    const result = await AuthFacade.register("teste", "senha123");
    expect(result.success).toBe(true);
    expect(result.userId).toBeDefined();
  });

  it("deve rejeitar senha curta", async () => {
    const result = await AuthFacade.register("teste", "123");
    expect(result.success).toBe(false);
    expect(result.error).toContain("6 caracteres");
  });
});
```

## 🔧 Configuração Avançada

### Personalizar Validações:

```javascript
// Criar regras customizadas
const customRules = {
  sport: {
    required: true,
    pattern: /^(futebol|futsal|basquete|volei)$/,
  },
};

const validation = appFacade.validateInput({ sport: "tenis" }, customRules);
```

### Monitoramento:

```javascript
// Verificar saúde periodicamente
setInterval(async () => {
  const health = await appFacade.healthCheck();
  console.log("App status:", health.status);
}, 60000); // A cada minuto
```

## 🚀 Próximos Passos

### Possíveis Expansões:

1. **CacheFacade:** Para cache de respostas da IA
2. **NotificationFacade:** Para notificações push
3. **AnalyticsFacade:** Para métricas e analytics
4. **FileFacade:** Para manipulação de arquivos
5. **EmailFacade:** Para envio de emails

### Exemplo de Nova Facade:

```javascript
// facades/CacheFacade.js
class CacheFacade {
  constructor() {
    this.cache = new Map();
  }

  async getOrSet(key, generator, ttl = 300000) {
    if (this.cache.has(key)) {
      const { value, expiry } = this.cache.get(key);
      if (Date.now() < expiry) return value;
    }

    const value = await generator();
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });

    return value;
  }
}
```

## 📝 Resumo

O padrão Facade implementado oferece:

- ✅ **Simplicidade:** Interface única e intuitiva
- ✅ **Segurança:** Validações e autorizações integradas
- ✅ **Manutenibilidade:** Código organizado e testável
- ✅ **Performance:** Otimizações transparentes
- ✅ **Escalabilidade:** Fácil extensão e modificação

**Resultado:** Código mais limpo, seguro e fácil de manter! 🎉
