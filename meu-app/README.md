# Aplicativo de Chat Esportivo com Knex.js

Este aplicativo agora utiliza Knex.js como query builder para o banco de dados MySQL.

## Configuração

1. **Instalar dependências:**

   ```bash
   npm install
   ```

2. **Configurar variáveis de ambiente:**
   Certifique-se de que seu arquivo `.env` contém:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=sua_senha
   DB_DATABASE=nome_do_banco
   GEMINI_API_KEY=sua_chave_api
   ```

## Migrations

### Executar migrations (criar tabelas):

```bash
npm run migrate
```

### Criar nova migration:

```bash
npm run migrate:make nome_da_migration
```

### Reverter última migration:

```bash
npm run migrate:rollback
```

## Seeds

### Executar seeds (popular dados de exemplo):

```bash
npm run seed
```

### Criar novo seed:

```bash
npm run seed:make nome_do_seed
```

## Estrutura do Banco de Dados

### Tabela `users`

- `id` (Primary Key)
- `username` (Unique)
- `password` (Hash bcrypt)
- `created_at`
- `updated_at`

### Tabela `conversations`

- `id` (Primary Key)
- `user_id` (Foreign Key para users)
- `message` (Texto da mensagem do usuário)
- `response` (Resposta da IA)
- `sport` (Esporte da conversa)
- `conversation_id` (ID da thread/conversa)
- `timestamp`

## Funcionalidades do Knex

O Knex oferece várias vantagens sobre SQL puro:

1. **Query Builder:** Sintaxe JavaScript limpa e legível
2. **Migrations:** Controle de versão do banco de dados
3. **Seeds:** Dados de exemplo/teste
4. **Connection Pooling:** Gerenciamento automático de conexões
5. **Transactions:** Suporte a transações
6. **Cross-database:** Compatibilidade com diferentes SGBDs

## Exemplo de uso do Knex no código

```javascript
// Buscar usuário
const user = await db("users").where("username", "admin").first();

// Inserir conversa
await db("conversations").insert({
  user_id: 1,
  message: "Olá",
  response: "Oi!",
  sport: "futebol",
  conversation_id: 1,
});

// Atualizar mensagem
await db("conversations").where("id", 1).update({ message: "Nova mensagem" });

// Deletar conversa
await db("conversations").where("id", 1).del();
```

## Executar o aplicativo

```bash
npm start
```
