# Referência da API — ServeRest

**Base URL:** `https://serverest.dev`
**Swagger:** https://serverest.dev/
**Fonte:** `docs/swagger.json` e código-fonte oficial (`github.com/ServeRest/ServeRest`) — rotas, schemas de validação (Joi) e catálogo de mensagens.

---

## 1. Autenticação

- Obtida em `POST /login`. O corpo retorna `authorization: "Bearer <jwt>"`.
- Enviar **o valor completo, com o prefixo `Bearer`**, no header `Authorization`.
- Expiração: **600 segundos** (10 minutos).
- Rotas protegidas exigem, além do token válido, que o usuário seja **administrador**.

| Condição | Status | `message` |
|---|---|---|
| Sem header / token inválido / expirado | `401` | `Token de acesso ausente, inválido, expirado ou usuário do token não existe mais` |
| Token válido de usuário não-admin | `403` | `Rota exclusiva para administradores` |

---

## 2. Endpoints

| Método | Rota | Auth | Admin |
|---|---|:---:|:---:|
| POST | `/login` | — | — |
| GET | `/usuarios` | — | — |
| POST | `/usuarios` | — | — |
| GET | `/usuarios/{_id}` | — | — |
| PUT | `/usuarios/{_id}` | — | — |
| DELETE | `/usuarios/{_id}` | — | — |
| GET | `/produtos` | — | — |
| POST | `/produtos` | ✅ | ✅ |
| GET | `/produtos/{_id}` | — | — |
| PUT | `/produtos/{_id}` | ✅ | ✅ |
| DELETE | `/produtos/{_id}` | ✅ | ✅ |
| GET | `/carrinhos` | — | — |
| POST | `/carrinhos` | ✅ | — |
| GET | `/carrinhos/{_id}` | — | — |
| DELETE | `/carrinhos/concluir-compra` | ✅ | — |
| DELETE | `/carrinhos/cancelar-compra` | ✅ | — |

> `PUT` funciona como *upsert*: retorna `200` (`Registro alterado com sucesso`) quando o `_id` existe e `201` (`Cadastro realizado com sucesso`) quando não existe.

---

## 3. `/login`

### `POST /login`

```json
{ "email": "string (formato de email, obrigatório)",
  "password": "string (obrigatório)" }
```

| Status | Corpo |
|---|---|
| `200` | `{ "message": "Login realizado com sucesso", "authorization": "Bearer eyJ..." }` |
| `401` | `{ "message": "Email e/ou senha inválidos" }` |
| `400` | `{ "email": "email deve ser um email válido" }` (validação de schema) |

---

## 4. `/usuarios`

### `GET /usuarios`
Query params aceitos: `_id`, `nome`, `email`, `password`, `administrador` (`'true'` \| `'false'`).
`nome` e `password` fazem match **parcial e case-insensitive**; os demais são exatos.

`200`:
```json
{ "quantidade": 2, "usuarios": [ { "nome": "...", "email": "...", "password": "...", "administrador": "true", "_id": "0uxuPY0cbmQhpEz1" } ] }
```

### `POST /usuarios`

```json
{ "nome": "string (obrigatório)",
  "email": "string, email válido (obrigatório)",
  "password": "string (obrigatório)",
  "administrador": "'true' | 'false' (string, obrigatório)" }
```

| Status | Corpo |
|---|---|
| `201` | `{ "message": "Cadastro realizado com sucesso", "_id": "<16 alfanuméricos>" }` |
| `400` | `{ "message": "Este email já está sendo usado" }` |
| `400` | `{ "email": "email é obrigatório" }` (e equivalentes por campo) |

> `administrador` é **string**, não boolean. Enviar `true` (boolean) retorna `400` com `administrador deve ser 'true' ou 'false'`.

### `GET /usuarios/{_id}`
`200` com o objeto do usuário; `400` `{ "message": "Usuário não encontrado" }`.

### `DELETE /usuarios/{_id}`

| Status | Corpo |
|---|---|
| `200` | `{ "message": "Registro excluído com sucesso" }` |
| `200` | `{ "message": "Nenhum registro excluído" }` (id inexistente) |
| `400` | `{ "message": "Não é permitido excluir usuário com carrinho cadastrado", "idCarrinho": "..." }` |

---

## 5. `/produtos`

### `GET /produtos`
Query params: `_id`, `nome`, `preco`, `descricao`, `quantidade`, `imagem`.
`nome` e `descricao` fazem match **parcial e case-insensitive** (útil para o cenário de busca da loja).

`200`:
```json
{ "quantidade": 1, "produtos": [ { "nome": "...", "preco": 470, "descricao": "...", "quantidade": 381, "_id": "BeeJh5lz3k6kSIzA" } ] }
```

### `POST /produtos` — protegida, admin

```json
{ "nome": "string (obrigatório, único global)",
  "preco": "inteiro positivo (obrigatório)",
  "descricao": "string (obrigatório)",
  "quantidade": "inteiro >= 0 (obrigatório)",
  "imagem": "string (opcional)" }
```

| Status | Corpo |
|---|---|
| `201` | `{ "message": "Cadastro realizado com sucesso", "_id": "<16 alfanuméricos>" }` |
| `400` | `{ "message": "Já existe produto com esse nome" }` |
| `400` | `{ "preco": "preco deve ser um número positivo" }` (e equivalentes) |
| `401` | token ausente/inválido |
| `403` | usuário não administrador |

### `DELETE /produtos/{_id}` — protegida, admin

| Status | Corpo |
|---|---|
| `200` | `{ "message": "Registro excluído com sucesso" }` |
| `200` | `{ "message": "Nenhum registro excluído" }` |
| `400` | `{ "message": "Não é permitido excluir produto que faz parte de carrinho", "idCarrinhos": [...] }` |

---

## 6. `/carrinhos`

### `POST /carrinhos` — protegida (qualquer usuário autenticado)

```json
{ "produtos": [ { "idProduto": "string (obrigatório)", "quantidade": "inteiro positivo (obrigatório)" } ] }
```

| Status | Corpo |
|---|---|
| `201` | `{ "message": "Cadastro realizado com sucesso", "_id": "..." }` |
| `400` | `{ "message": "Não é permitido ter mais de 1 carrinho" }` |
| `400` | `{ "message": "Produto não possui quantidade suficiente" }` |
| `400` | `{ "message": "Não é permitido possuir produto duplicado" }` |
| `400` | `{ "message": "Produto não encontrado" }` |

### `DELETE /carrinhos/concluir-compra`
`200` `{ "message": "Registro excluído com sucesso" }` — baixa o estoque.

### `DELETE /carrinhos/cancelar-compra`
`200` `{ "message": "Registro excluído com sucesso. Estoque dos produtos reabastecido" }` — devolve o estoque.

Sem carrinho para o usuário: `200` `{ "message": "Não foi encontrado carrinho para esse usuário" }`.

---

## 7. Catálogo completo de mensagens (`constants/messages.js`)

```js
export const API_MESSAGES = {
  POST_SUCCESS: 'Cadastro realizado com sucesso',
  PUT_SUCCESS: 'Registro alterado com sucesso',
  DELETE_SUCCESS: 'Registro excluído com sucesso',
  DELETE_NONE: 'Nenhum registro excluído',
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  LOGIN_FAIL: 'Email e/ou senha inválidos',
  EMAIL_ALREADY_USED: 'Este email já está sendo usado',
  NAME_ALREADY_USED: 'Já existe produto com esse nome',
  REQUIRED_ADMIN: 'Rota exclusiva para administradores',
  INVALID_TOKEN:
    'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
  LIMIT_JUST_ONE_CART: 'Não é permitido ter mais de 1 carrinho',
  INSUFFICIENT_STOCK: 'Produto não possui quantidade suficiente',
  DELETE_USER_WITH_CART: 'Não é permitido excluir usuário com carrinho cadastrado',
  DELETE_PRODUCT_WITH_CART: 'Não é permitido excluir produto que faz parte de carrinho',
  CART_WITH_DUPLICATE_PRODUCT: 'Não é permitido possuir produto duplicado',
  NO_CART: 'Não foi encontrado carrinho para esse usuário',
  USER_NOT_FOUND: 'Usuário não encontrado',
  CART_NOT_FOUND: 'Carrinho não encontrado',
  PRODUCT_NOT_FOUND: 'Produto não encontrado',
};
```

### Mensagens de validação de schema (geradas dinamicamente por campo)

| Tipo de erro | Formato |
|---|---|
| Campo ausente | `{campo} é obrigatório` |
| String vazia | `{campo} não pode ficar em branco` |
| Tipo errado (string) | `{campo} deve ser uma string` |
| Tipo errado (número) | `{campo} deve ser um número` |
| Não inteiro | `{campo} deve ser um inteiro` |
| Não positivo | `{campo} deve ser um número positivo` |
| Menor que zero | `{campo} deve ser maior ou igual a 0` |
| Email inválido | `{campo} deve ser um email válido` |
| `administrador` inválido | `{campo} deve ser 'true' ou 'false'` |
| `_id` fora do padrão | `{campo} deve ter exatamente 16 caracteres alfanuméricos` |
| Campo não previsto no body | `{campo} não é permitido` |

> `{campo}` é o nome literal do campo no payload (`email`, `preco`, `quantidade`…), em minúsculas. Útil para montar testes data-driven de validação.

---

## 8. Schemas JSON para validação de contrato

Salvar em `cypress/fixtures/schemas/`.

### `login.schema.json`
```json
{
  "type": "object",
  "required": ["message", "authorization"],
  "properties": {
    "message": { "type": "string" },
    "authorization": { "type": "string", "pattern": "^Bearer .+" }
  },
  "additionalProperties": false
}
```

### `usuarios.schema.json` (`GET /usuarios/{_id}`)
```json
{
  "type": "object",
  "required": ["nome", "email", "password", "administrador", "_id"],
  "properties": {
    "nome": { "type": "string", "minLength": 1 },
    "email": { "type": "string", "format": "email" },
    "password": { "type": "string", "minLength": 1 },
    "administrador": { "type": "string", "enum": ["true", "false"] },
    "_id": { "type": "string", "pattern": "^[a-zA-Z0-9]{16}$" }
  },
  "additionalProperties": false
}
```

### `produtos.schema.json` (`GET /produtos/{_id}`)
```json
{
  "type": "object",
  "required": ["nome", "preco", "descricao", "quantidade", "_id"],
  "properties": {
    "nome": { "type": "string", "minLength": 1 },
    "preco": { "type": "integer", "minimum": 1 },
    "descricao": { "type": "string" },
    "quantidade": { "type": "integer", "minimum": 0 },
    "imagem": { "type": "string" },
    "_id": { "type": "string", "pattern": "^[a-zA-Z0-9]{16}$" }
  },
  "additionalProperties": false
}
```

### `cadastro.schema.json` (resposta genérica de `POST`)
```json
{
  "type": "object",
  "required": ["message", "_id"],
  "properties": {
    "message": { "type": "string" },
    "_id": { "type": "string", "pattern": "^[a-zA-Z0-9]{16}$" }
  },
  "additionalProperties": false
}
```

---

## 9. Regras de negócio relevantes para os testes

1. **Email de usuário é único** no ambiente inteiro.
2. **Nome de produto é único** no ambiente inteiro — sempre gere com sufixo aleatório.
3. `administrador` trafega como **string**, não boolean.
4. `preco` deve ser **inteiro positivo**; `quantidade`, inteiro ≥ 0.
5. Cada usuário pode ter **no máximo 1 carrinho**.
6. Ordem de exclusão: **carrinho → produto → usuário**.
7. `_id` sempre tem **16 caracteres alfanuméricos** — ótima assertiva de contrato.
8. O token expira em 600s; gere um por spec.
9. O ambiente online é **compartilhado e resetado diariamente** — não dependa de dado pré-existente nem valide contagens globais (`quantidade` da listagem completa).
10. **Teste de carga é proibido** e detectado pelo servidor; não paralelize agressivamente nem faça loops de centenas de requisições.
