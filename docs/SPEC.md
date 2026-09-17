# SPEC — Automação de Testes ServeRest (Cypress + JavaScript)

> Documento de especificação técnica para implementação assistida por IA (Claude Code).
> **Leia este arquivo inteiro antes de escrever a primeira linha de código.**
> Arquivos complementares obrigatórios: `docs/ELEMENTS-MAP.md` (mapa de elementos da UI) e `docs/API-REFERENCE.md` (contrato da API).

---

## 0. Instruções para o agente de execução

1. Trate esta SPEC como fonte da verdade. Se algo aqui conflitar com "o jeito mais rápido", siga a SPEC.
2. **Não invente seletores.** Todos os seletores já estão mapeados em `docs/ELEMENTS-MAP.md`, extraídos do código-fonte oficial do front. Use exatamente o que está lá.
3. **Não invente mensagens de resposta.** Todas as mensagens da API e da UI estão catalogadas em `docs/API-REFERENCE.md` e `docs/ELEMENTS-MAP.md`.
4. Implemente em fases, seguindo o §16 (Roadmap), fazendo **um commit por fase** conforme o §14.
5. Depois de cada fase, rode `npx cypress run` e só siga adiante com a suíte verde.
6. Ao final, rode o checklist do §15 (Definition of Done) item a item.

---

## 1. Contexto e objetivo

Desafio técnico de QA Sênior: construir uma suíte automatizada em **Cypress + JavaScript** cobrindo:

- **3 cenários E2E** do frontend `https://front.serverest.dev/`
- **3 cenários automatizados** da API `https://serverest.dev/`

O código será avaliado por: boas práticas de desenvolvimento, qualidade de construção, aplicação de padrões de projeto, clareza das assertivas, escrita/organização dos cenários e qualidade dos commits. **A suíte é o produto, mas a arquitetura é o que está sendo avaliado.** Priorize legibilidade, reuso e ausência de redundância sobre quantidade de testes.

### Fora de escopo
- Testes de carga (proibido pelo próprio ServeRest — ele detecta e bloqueia).
- Testes de performance, acessibilidade e visual regression.
- Cobertura exaustiva de todas as rotas; a entrega pede profundidade, não volume.

---

## 2. Restrições do ambiente (leia antes de projetar os testes)

O ambiente online é **público e compartilhado**. Isso dita decisões de arquitetura:

| Restrição | Consequência no design |
|---|---|
| Os dados são resetados diariamente e outros usuários escrevem no mesmo banco | **Nunca** dependa de dados pré-existentes (ex.: `fulano@qa.com`). Toda massa é criada pelo próprio teste. |
| Produtos têm nome único global (`Já existe produto com esse nome`) | Nomes de produto sempre gerados com sufixo aleatório/timestamp. |
| Emails são únicos (`Este email já está sendo usado`) | Emails sempre gerados dinamicamente. |
| Token JWT expira em **600s** | Gere token por spec/teste; não reaproveite token entre execuções longas. |
| Usuário com carrinho não pode ser excluído; produto em carrinho não pode ser excluído | A ordem de cleanup importa: carrinho → produto → usuário. |
| O front é SPA React sem SSR | `cy.visit()` de rotas internas exige sessão/token no `localStorage`; ver §7.4. |

---

## 3. Stack

| Item | Escolha | Justificativa |
|---|---|---|
| Runner | **Cypress 13.x** (`e2e` testing type) | Exigência do desafio. |
| Linguagem | **JavaScript (ES2022, módulos ESM)** | Exigência do desafio. |
| Massa de dados | `@faker-js/faker` | Dados realistas e não determinísticos onde faz sentido. |
| Contrato | `ajv` + `ajv-formats` | Validação de schema JSON das respostas da API. |
| Lint/format | `eslint` + `eslint-plugin-cypress` + `prettier` | Critério "boas práticas". |
| Hooks de commit | `husky` + `lint-staged` + `commitlint` | Critério "qualidade e clareza nos commits". |
| Relatório | `mochawesome` + `mochawesome-merge` + `marge` | Evidência de execução. |
| CI | GitHub Actions | Repositório público exigido. |

Node ≥ 18. `package-lock.json` **deve** ser versionado.

---

## 4. Arquitetura e padrões de projeto

A suíte tem **duas camadas de abstração distintas**, e elas não se misturam:

```
specs (o QUE se valida)  →  Page Objects / Service Objects (COMO se interage)  →  seletores / endpoints (ONDE)
```

### 4.1 Padrões obrigatórios

| Padrão | Onde | Regra |
|---|---|---|
| **Page Object Model (POM)** | `cypress/support/pages/` | Uma classe ES6 por página. Encapsula **ações e acesso a elementos**. |
| **Herança (`BasePage`)** | `cypress/support/pages/BasePage.js` | Comportamento comum (visitar, obter por `data-testid`, validar URL, fechar alertas) mora aqui. Nenhuma página reimplementa isso. |
| **Service Object / API Client** | `cypress/support/services/` | Uma classe por recurso da API (`UsuariosService`, `ProdutosService`, `LoginService`, `CarrinhosService`), herdando de `BaseService`. |
| **Factory / Builder de dados** | `cypress/support/factories/` | `UsuarioFactory`, `ProdutoFactory`. Geram payloads válidos com override parcial. |
| **Singleton de instâncias de página** | export de instância única no final de cada Page Object | A spec importa `loginPage`, não faz `new LoginPage()` toda hora. |
| **Constantes centralizadas** | `cypress/support/constants/` | Mensagens, rotas, status codes. Zero string mágica nas specs. |
| **Seletores externalizados** | `cypress/support/selectors/` | Um módulo por página. Página nenhuma tem seletor hardcoded no corpo do método. |
| **Custom Commands** | `cypress/support/commands.js` | Apenas para primitivas realmente transversais (`getByTestId`, `apiLogin`, `loginViaApi`). Regra de corte no §7.5. |

### 4.2 Separação de responsabilidades (não negociável)

| Camada | PODE | NÃO PODE |
|---|---|---|
| **Spec** (`*.cy.js`) | Orquestrar fluxo, fazer **assertivas de negócio** | Conter seletor CSS, `cy.get()` cru, `if/else`, loops de lógica |
| **Page Object** | `cy.get`, `.click()`, `.type()`, navegação, getters de elemento | Conter `expect`/`should` de regra de negócio (ver exceção abaixo) |
| **Service Object** | `cy.request`, montar headers, montar URL | Conter assertiva; deve sempre usar `failOnStatusCode: false` |
| **Factory** | Gerar dados | Chamar API ou UI |
| **Selectors** | Exportar strings | Qualquer lógica |

> **Exceção pragmática:** Page Objects podem expor métodos de verificação estrutural (ex.: `assertIsLoaded()`, que checa se a URL e o elemento âncora da página existem). Assertiva de *resultado de negócio* fica sempre na spec — é isso que o avaliador vai ler.

### 4.3 Princípios de código

- **DRY com limite:** abstraia o que se repete 3+ vezes. Não crie um helper para algo usado uma vez só.
- **Nomes revelam intenção:** `criarProdutoComoAdmin()`, não `doStuff()`. Métodos de página em português são aceitáveis e até desejáveis aqui (o domínio é em português) — mas **escolha um idioma e mantenha em todo o projeto**. Recomendação: **código/estrutura em inglês, domínio/dados em português** (`ProdutosService.create()`, `produtoFactory.valido()`).
- **Encadeamento fluente:** métodos de ação dos Page Objects retornam `this` para permitir `loginPage.preencherEmail(x).preencherSenha(y).submeter()`.
- **Nada de lógica condicional em teste.** Se precisar de `if`, o cenário está mal modelado.

---

## 5. Estrutura de diretórios

```
serverest-cypress/
├── .github/
│   └── workflows/
│       └── ci.yml
├── cypress/
│   ├── e2e/
│   │   ├── api/
│   │   │   ├── login.cy.js
│   │   │   ├── usuarios.cy.js
│   │   │   └── produtos.cy.js
│   │   └── ui/
│   │       ├── login.cy.js
│   │       └── produtos.cy.js
│   ├── fixtures/
│   │   └── schemas/
│   │       ├── login.schema.json
│   │       ├── usuarios.schema.json
│   │       └── produtos.schema.json
│   └── support/
│       ├── commands.js
│       ├── e2e.js
│       ├── constants/
│       │   ├── endpoints.js
│       │   ├── messages.js
│       │   ├── routes.js
│       │   └── statusCodes.js
│       ├── factories/
│       │   ├── usuario.factory.js
│       │   └── produto.factory.js
│       ├── pages/
│       │   ├── BasePage.js
│       │   ├── LoginPage.js
│       │   ├── CadastroUsuarioPage.js
│       │   ├── AdminHomePage.js
│       │   ├── CadastroProdutoPage.js
│       │   ├── ListaProdutosPage.js
│       │   └── ListaUsuariosPage.js
│       ├── selectors/
│       │   ├── index.js
│       │   ├── login.selectors.js
│       │   ├── cadastroUsuario.selectors.js
│       │   ├── adminHome.selectors.js
│       │   ├── navbar.selectors.js
│       │   ├── cadastroProduto.selectors.js
│       │   └── listagens.selectors.js
│       ├── services/
│       │   ├── BaseService.js
│       │   ├── LoginService.js
│       │   ├── UsuariosService.js
│       │   ├── ProdutosService.js
│       │   └── CarrinhosService.js
│       └── utils/
│           └── schemaValidator.js
├── docs/
│   ├── ELEMENTS-MAP.md
│   └── API-REFERENCE.md
├── .eslintrc.json
├── .prettierrc
├── .gitignore
├── commitlint.config.js
├── cypress.config.js
├── package.json
├── package-lock.json
└── README.md
```

---

## 6. Configuração

### 6.1 `cypress.config.js`

```js
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://front.serverest.dev',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    testIsolation: true,
    viewportWidth: 1440,
    viewportHeight: 900,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    video: false,
    screenshotOnRunFailure: true,
    retries: { runMode: 2, openMode: 0 },
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/reports',
      overwrite: false,
      html: false,
      json: true,
    },
    env: {
      apiUrl: 'https://serverest.dev',
    },
    setupNodeEvents(on, config) {
      return config;
    },
  },
});
```

> `retries: 2` em `runMode` existe porque o ambiente é público e compartilhado — não para mascarar teste instável mal escrito. Se um teste seu só passa com retry, ele está errado.

### 6.2 Scripts (`package.json`)

```json
{
  "scripts": {
    "cy:open": "cypress open",
    "test": "cypress run",
    "test:ui": "cypress run --spec 'cypress/e2e/ui/**/*.cy.js'",
    "test:api": "cypress run --spec 'cypress/e2e/api/**/*.cy.js'",
    "lint": "eslint . --ext .js",
    "lint:fix": "eslint . --ext .js --fix",
    "report:merge": "mochawesome-merge cypress/reports/*.json > cypress/reports/report.json",
    "report:html": "marge cypress/reports/report.json -f report -o cypress/reports/html",
    "report": "npm run report:merge && npm run report:html"
  }
}
```

### 6.3 `.gitignore`

Ignorar: `node_modules/`, `cypress/reports/`, `cypress/screenshots/`, `cypress/videos/`, `.env`.
**Não** ignorar `package-lock.json`.

---

## 7. Esqueletos de referência

> Os blocos abaixo definem o **contrato de cada camada**. Implemente seguindo estas assinaturas; expanda conforme necessário, sem quebrar o padrão.

### 7.1 `BasePage`

```js
export default class BasePage {
  visit(route = '/') {
    cy.visit(route);
    return this;
  }

  getByTestId(testId) {
    return cy.get(`[data-testid="${testId}"]`);
  }

  assertUrl(route) {
    cy.url().should('include', route);
    return this;
  }

  // Alerta de erro do ServeRest: .alert-secondary, texto dentro de <span>
  errorAlert() {
    return cy.get('.alert.alert-secondary');
  }

  // Alerta de sucesso: .alert-primary, texto dentro de <a.alert-link>
  successAlert() {
    return cy.get('.alert.alert-primary .alert-link');
  }

  assertErrorMessage(message) {
    this.errorAlert().should('be.visible').and('contain.text', message);
    return this;
  }

  closeErrorAlert() {
    cy.get('.btn-close-error-alert').click();
    return this;
  }
}
```

### 7.2 Selectors + Page Object

```js
// cypress/support/selectors/login.selectors.js
export const loginSelectors = {
  email: 'email',
  senha: 'senha',
  botaoEntrar: 'entrar',
  linkCadastrar: 'cadastrar',
};
```

```js
// cypress/support/pages/LoginPage.js
import BasePage from './BasePage';
import { loginSelectors as sel } from '../selectors/login.selectors';
import { ROUTES } from '../constants/routes';

class LoginPage extends BasePage {
  visit() {
    return super.visit(ROUTES.LOGIN);
  }

  preencherEmail(email) {
    this.getByTestId(sel.email).clear().type(email);
    return this;
  }

  preencherSenha(senha) {
    this.getByTestId(sel.senha).clear().type(senha, { log: false });
    return this;
  }

  submeter() {
    this.getByTestId(sel.botaoEntrar).click();
    return this;
  }

  logar({ email, password }) {
    return this.preencherEmail(email).preencherSenha(password).submeter();
  }
}

export default new LoginPage();
```

### 7.3 `BaseService` + Service Object

```js
// cypress/support/services/BaseService.js
export default class BaseService {
  constructor(resource) {
    this.baseUrl = Cypress.env('apiUrl');
    this.resource = resource;
  }

  request({ method, path = '', body, qs, token }) {
    return cy.request({
      method,
      url: `${this.baseUrl}${this.resource}${path}`,
      body,
      qs,
      headers: token ? { Authorization: token } : {},
      failOnStatusCode: false, // assertiva de status é responsabilidade da spec
    });
  }

  getAll(qs) { return this.request({ method: 'GET', qs }); }
  getById(id) { return this.request({ method: 'GET', path: `/${id}` }); }
  create(body, token) { return this.request({ method: 'POST', body, token }); }
  update(id, body, token) { return this.request({ method: 'PUT', path: `/${id}`, body, token }); }
  remove(id, token) { return this.request({ method: 'DELETE', path: `/${id}`, token }); }
}
```

```js
// cypress/support/services/ProdutosService.js
import BaseService from './BaseService';
import { ENDPOINTS } from '../constants/endpoints';

class ProdutosService extends BaseService {
  constructor() {
    super(ENDPOINTS.PRODUTOS);
  }

  buscarPorNome(nome) {
    return this.getAll({ nome });
  }
}

export default new ProdutosService();
```

### 7.4 Factories

```js
// cypress/support/factories/usuario.factory.js
import { faker } from '@faker-js/faker';

export const usuarioFactory = {
  build({ administrador = 'true', ...overrides } = {}) {
    return {
      nome: faker.person.fullName(),
      email: faker.internet.email({ provider: 'qa.serverest.dev' }).toLowerCase(),
      password: faker.internet.password({ length: 10 }),
      administrador,
      ...overrides,
    };
  },
  admin(overrides) { return this.build({ administrador: 'true', ...overrides }); },
  cliente(overrides) { return this.build({ administrador: 'false', ...overrides }); },
};
```

```js
// cypress/support/factories/produto.factory.js
import { faker } from '@faker-js/faker';

export const produtoFactory = {
  build(overrides = {}) {
    return {
      // nome único: o ServeRest rejeita nomes duplicados globalmente
      nome: `${faker.commerce.productName()} ${Date.now()}`,
      preco: faker.number.int({ min: 1, max: 5000 }),
      descricao: faker.commerce.productDescription(),
      quantidade: faker.number.int({ min: 1, max: 500 }),
      ...overrides,
    };
  },
};
```

### 7.5 Custom Commands — regra de corte

Custom command só para **primitiva transversal usada por mais de uma camada**. Implemente exatamente estes:

```js
// cypress/support/commands.js
Cypress.Commands.add('getByTestId', (testId) =>
  cy.get(`[data-testid="${testId}"]`));

// Cria usuário via API e retorna as credenciais + _id (setup rápido, sem passar pela UI)
Cypress.Commands.add('criarUsuarioViaApi', (usuario) => { /* POST /usuarios */ });

// Autentica via API e devolve o token "Bearer ..."
Cypress.Commands.add('obterToken', ({ email, password }) => { /* POST /login */ });

// Injeta sessão no localStorage para pular o login pela UI em testes que NÃO testam login
Cypress.Commands.add('sessaoAdmin', (usuario) => { /* ver observação abaixo */ });
```

**`sessaoAdmin` — como funciona e quando usar.** O front guarda a sessão em `localStorage` (`serverest/userToken`, `serverest/userEmail`, `serverest/userNome`). Para um teste cujo objetivo *não* é o login (ex.: cadastro de produto), autentique via API, escreva essas chaves e visite a rota direto. Isso deixa o teste focado, rápido e menos frágil. Use `cy.session()` para cachear. **Nunca** use esse atalho no cenário que testa o próprio login.

### 7.6 Validador de schema

```js
// cypress/support/utils/schemaValidator.js
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const validarSchema = (schema, dados) => {
  const valido = ajv.validate(schema, dados);
  expect(valido, `Contrato inválido: ${ajv.errorsText(ajv.errors)}`).to.be.true;
};
```

---

## 8. Cenários E2E (frontend)

Formato obrigatório: `describe` = funcionalidade, `context` = condição (quando houver), `it` = comportamento esperado em voz ativa. Assertiva sempre com mensagem clara.

---

### CT-E2E-001 — Login com credenciais válidas de administrador

| Campo | Conteúdo |
|---|---|
| **Arquivo** | `cypress/e2e/ui/login.cy.js` |
| **Objetivo** | Garantir que um administrador autenticado é redirecionado para o painel e vê o menu administrativo. |
| **Pré-condição** | Usuário administrador criado via API no `beforeEach` (`usuarioFactory.admin()`). |
| **Passos** | 1. Visitar `/login`. 2. Preencher email e senha do usuário criado. 3. Clicar em **Entrar**. |
| **Assertivas** | • URL passa a conter `/admin/home`.<br>• Título exibe `Bem Vindo {nome}`.<br>• Menu admin visível: `[data-testid="cadastrar-usuarios"]`, `listar-usuarios`, `cadastrar-produtos`, `listar-produtos`, `link-relatorios`.<br>• `localStorage['serverest/userToken']` começa com `Bearer `. |
| **Pós-condição** | Remover o usuário criado (`DELETE /usuarios/{_id}`). |

> **Atenção de implementação:** o redirecionamento pós-login depende de um `GET /usuarios` que retorna a lista inteira e pode demorar. Use `cy.intercept('GET', '**/usuarios').as('listaUsuarios')` antes do submit e `cy.wait('@listaUsuarios')` — **nunca** `cy.wait(3000)`.

---

### CT-E2E-002 — Login com credenciais inválidas exibe mensagem de erro

| Campo | Conteúdo |
|---|---|
| **Arquivo** | `cypress/e2e/ui/login.cy.js` |
| **Objetivo** | Garantir que credenciais inválidas não autenticam e que o usuário recebe feedback claro. |
| **Pré-condição** | Nenhuma. Dados inexistentes gerados por factory. |
| **Passos** | 1. Visitar `/login`. 2. Preencher email inexistente e senha qualquer. 3. Clicar em **Entrar**. |
| **Assertivas** | • Alerta `.alert-secondary` visível com o texto **`Email e/ou senha inválidos`**.<br>• URL permanece em `/login`.<br>• `localStorage['serverest/userToken']` é `null`. |
| **Variações (data-driven)** | Use `forEach` sobre um array de casos para cobrir também: campos vazios → `Email é obrigatório` e `Password é obrigatório`. A tabela de casos fica em constante no topo do arquivo, não inline no `it`. |
| **Pós-condição** | Nenhuma. |

> **Atenção:** o componente de alerta aplica `capitalize` — a primeira letra vira maiúscula e **o restante vira minúsculo**. Compare com o texto exatamente como renderizado (ver `docs/ELEMENTS-MAP.md` §7).

---

### CT-E2E-003 — Administrador cadastra produto e o encontra na listagem

| Campo | Conteúdo |
|---|---|
| **Arquivo** | `cypress/e2e/ui/produtos.cy.js` |
| **Objetivo** | Validar o fluxo de negócio de ponta a ponta: cadastro de produto pelo admin, redirecionamento e persistência na listagem. |
| **Pré-condição** | Admin criado via API; sessão injetada via `cy.sessaoAdmin()`; produto gerado por `produtoFactory.build()`. |
| **Passos** | 1. Visitar `/admin/cadastrarprodutos`. 2. Preencher Nome, Preço, Descrição, Quantidade. 3. Clicar em **Cadastrar** (`[data-testid="cadastarProdutos"]`). |
| **Assertivas** | • URL passa a `/admin/listarprodutos`.<br>• Existe **uma única linha** na tabela com o nome do produto.<br>• Na **mesma linha**, as células de preço, descrição e quantidade batem com os dados enviados.<br>• `GET /produtos?nome={nome}` retorna `quantidade: 1` (confirmação na fonte de verdade). |
| **Pós-condição** | `DELETE /produtos/{_id}` e depois `DELETE /usuarios/{_id}` (nessa ordem). |

> **Atenção 1:** o `data-testid` do botão tem um typo no código do front — é `cadastarProdutos` (sem o segundo "d"). Não "corrija".
> **Atenção 2:** valide preço/descrição/quantidade **dentro da mesma `<tr>`** (`cy.contains('tr', nome).within(...)`), nunca com asserts soltos na página — a tabela é compartilhada e tem centenas de linhas.
> **Atenção 3:** o campo Imagem aparece com asterisco de obrigatório na UI, mas a API aceita produto sem imagem. Se identificar isso, registre como **observação de bug** no README (§13) — é ponto de qualidade, não motivo para fazer o teste falhar.

---

### Cenários opcionais (só se sobrar tempo, sem prejudicar os 3 obrigatórios)
- **CT-E2E-004** — Cadastro de novo usuário pela tela pública `/cadastrarusuarios` com auto-login.
- **CT-E2E-005** — Busca de produto na home do cliente (`GET /produtos?nome=` é *case-insensitive* e parcial).
- **CT-E2E-006** — Logout limpa o `localStorage` e retorna para `/login`.

---

## 9. Cenários de API

Todos os testes de API usam **Service Objects**, jamais `cy.request` direto na spec.
Toda resposta valida **status + corpo + contrato (schema)**.

---

### CT-API-001 — `POST /usuarios` cadastra usuário e rejeita email duplicado

| Campo | Conteúdo |
|---|---|
| **Arquivo** | `cypress/e2e/api/usuarios.cy.js` |
| **Objetivo** | Validar criação de usuário e a regra de unicidade de email. |
| **Caso 1 — sucesso** | `POST /usuarios` com payload válido → **201**, `message = "Cadastro realizado com sucesso"`, `_id` presente e com **16 caracteres alfanuméricos** (`/^[a-zA-Z0-9]{16}$/`). |
| **Caso 2 — duplicidade** | Repetir o mesmo payload → **400**, `message = "Este email já está sendo usado"`. |
| **Caso 3 — campo obrigatório** | `POST /usuarios` sem `email` → **400**, `email = "email é obrigatório"`. |
| **Contrato** | Validar resposta do caso 1 contra `usuarios.schema.json`. |
| **Pós-condição** | `DELETE /usuarios/{_id}` no `after`. |

---

### CT-API-002 — `POST /login` autentica e bloqueia credenciais inválidas

| Campo | Conteúdo |
|---|---|
| **Arquivo** | `cypress/e2e/api/login.cy.js` |
| **Objetivo** | Validar emissão de token e a rejeição de credenciais inválidas. |
| **Caso 1 — sucesso** | **200**, `message = "Login realizado com sucesso"`, `authorization` presente e com prefixo `Bearer `. Validar contra `login.schema.json`. |
| **Caso 2 — senha incorreta** | **401**, `message = "Email e/ou senha inválidos"`, e **sem** propriedade `authorization` no corpo. |
| **Caso 3 — payload inválido** | `email` em formato inválido → **400**, `email = "email deve ser um email válido"`. |
| **Pré-condição** | Usuário criado via `UsuariosService` no `before`. |
| **Pós-condição** | Excluir o usuário. |

---

### CT-API-003 — `POST /produtos` respeita autenticação e autorização

| Campo | Conteúdo |
|---|---|
| **Arquivo** | `cypress/e2e/api/produtos.cy.js` |
| **Objetivo** | Validar a rota protegida de produtos em suas três condições de acesso, mais o ciclo de vida do recurso. |
| **Caso 1 — admin autenticado** | `POST /produtos` com token de admin → **201**, `message = "Cadastro realizado com sucesso"`, `_id` com 16 caracteres. Em seguida, `GET /produtos/{_id}` → **200** com os mesmos dados enviados (validação de persistência, não só do retorno do POST). |
| **Caso 2 — sem token** | `POST /produtos` sem header `Authorization` → **401**, `message = "Token de acesso ausente, inválido, expirado ou usuário do token não existe mais"`. |
| **Caso 3 — token de usuário não administrador** | **403**, `message = "Rota exclusiva para administradores"`. |
| **Contrato** | Validar o `GET /produtos/{_id}` contra `produtos.schema.json`. |
| **Pós-condição** | `DELETE /produtos/{_id}` → **200** `"Registro excluído com sucesso"`; depois excluir os usuários criados. |

> Este cenário é o mais valioso dos três: cobre autenticação, autorização, persistência e contrato num único fluxo coeso. Não o fragmente em três arquivos.

---

### Cenários opcionais de API
- `GET /produtos?nome=` — busca parcial e *case-insensitive*.
- `POST /carrinhos` — regra "Não é permitido ter mais de 1 carrinho" (400).
- `DELETE /usuarios/{_id}` com carrinho ativo → 400 `"Não é permitido excluir usuário com carrinho cadastrado"`.

---

## 10. Massa de dados, isolamento e limpeza

1. **Toda massa é criada pelo teste**, via API (mais rápido e estável que via UI), em `before`/`beforeEach`.
2. **Todo recurso criado é destruído** em `after`/`afterEach`, mesmo se o teste falhar. Guarde os IDs em variáveis de escopo do `describe`.
3. **Ordem de limpeza:** carrinho → produto → usuário. Inverter causa 400.
4. **Não use `fulano@qa.com` ou qualquer dado pré-existente.** Ele pode ter sido alterado ou excluído por outra pessoa.
5. `testIsolation: true` fica ligado. Se um teste depender do estado de outro, o cenário está mal modelado.

---

## 11. Qualidade das assertivas

O critério "adequação e clareza das assertivas" é avaliado explicitamente. Portanto:

- Sempre afirme **status code + corpo**, nunca só o status.
- Sempre afirme **o valor esperado**, nunca só a existência (`.should('exist')` sozinho não prova nada).
- Use mensagens customizadas em asserts críticos: `expect(res.status, 'status do cadastro de produto').to.eq(201)`.
- Em tabelas, escopo sempre na linha (`cy.contains('tr', nome).within(...)`).
- Compare contra **constantes de mensagem**, nunca contra string literal digitada na spec.
- Valide o **contrato** (schema) nas rotas principais — isso diferencia uma suíte sênior de uma júnior.

---

## 12. Anti-padrões proibidos

| ❌ Proibido | ✅ Faça assim |
|---|---|
| `cy.wait(3000)` | `cy.intercept()` + `cy.wait('@alias')` |
| `cy.get('.btn-primary')` na spec | `produtoPage.cadastrar()` |
| Seletor por classe do Bootstrap ou por texto instável | `data-testid` mapeado em `docs/ELEMENTS-MAP.md` |
| Credencial hardcoded na spec | Factory + criação via API |
| `if/else` ou `try/catch` dentro de `it` | Um `it` por comportamento |
| Um `it` gigante validando 8 coisas | Um comportamento por `it`, com `before` compartilhado |
| `cy.request` cru na spec | Service Object |
| Comentário explicando o que o código faz | Nome de método que dispensa comentário |
| `.should('exist')` como assertiva final | Assertiva de valor |
| Teste que depende da ordem de execução | Isolamento total |
| Login pela UI em todo teste | `cy.session()` + injeção de token, exceto na spec de login |

---

## 13. CI e relatórios

`.github/workflows/ci.yml`:

- Gatilhos: `push` em `main` e `pull_request`.
- Passos: checkout → setup-node (com cache npm) → `npm ci` → `npm run lint` → `cypress-io/github-action` executando a suíte → `npm run report` → upload de `cypress/reports/html` e `cypress/screenshots` como artefato (com `if: always()`).
- Sugestão: dois jobs em paralelo (`api` e `ui`), o que também demonstra organização.

Adicione o badge de status do workflow no topo do `README.md`.

---

## 14. Padrão de commits

**Conventional Commits**, em português, no imperativo, escopo obrigatório. Sem commits do tipo "ajustes", "wip", "correções finais".

```
<tipo>(<escopo>): <descrição curta em minúsculas, sem ponto final>

[corpo opcional: o PORQUÊ da mudança, não o o quê]
```

Tipos: `feat`, `fix`, `test`, `refactor`, `chore`, `docs`, `ci`, `style`.

Exemplos bons:
```
chore(setup): configurar cypress com baseUrl e retries
feat(support): adicionar BasePage com acesso por data-testid
feat(services): criar camada de service objects para a api
test(api-usuarios): validar cadastro e unicidade de email
test(e2e-login): cobrir login valido e credenciais invalidas
refactor(pages): extrair seletores para modulos dedicados
ci(actions): executar suite e publicar relatorio mochawesome
docs(readme): documentar execucao, arquitetura e decisoes tecnicas
```

Commits atômicos: um commit não mistura configuração, page object e spec. Use `husky` + `commitlint` para impedir desvio.

---

## 15. README.md (obrigatório)

Seções mínimas:

1. **Sobre** — o que é, o que cobre, badge de CI.
2. **Stack** — versões.
3. **Como executar** — `npm ci`, `npm run cy:open`, `npm test`, `npm run test:api`, `npm run test:ui`.
4. **Arquitetura** — a árvore de diretórios do §5 e um parágrafo por camada explicando **por que** ela existe. É aqui que se demonstra a "aplicação de padrões de projeto".
5. **Cenários cobertos** — tabela ID / descrição / tipo.
6. **Decisões técnicas** — por que POM, por que Service Object, por que criar massa via API, por que `retries` no ambiente compartilhado.
7. **Relatórios** — como gerar e onde ficam.
8. **Observações / possíveis bugs encontrados** — ex.: `data-testid="cadastarProdutos"` com typo; campo Imagem marcado como obrigatório na UI mas opcional na API; `data-testid` duplicado no botão de checkout. **Isso vale ponto** — mostra olhar de QA, não só de automatizador.

---

## 16. Definition of Done

- [ ] Repositório público no GitHub com histórico de commits limpo e semântico.
- [ ] `npm ci && npm test` verde do zero, sem dados pré-existentes.
- [ ] 3 cenários E2E + 3 cenários de API implementados conforme §8 e §9.
- [ ] Nenhum seletor fora de `cypress/support/selectors/`.
- [ ] Nenhuma string de mensagem fora de `cypress/support/constants/messages.js`.
- [ ] Nenhum `cy.wait(<número>)` no projeto (`grep -rn "cy.wait([0-9]" cypress/` retorna vazio).
- [ ] Nenhum `cy.request` ou `cy.get` dentro de arquivos `*.cy.js`.
- [ ] Toda massa criada é removida ao final.
- [ ] Validação de schema em pelo menos 3 respostas.
- [ ] `npm run lint` sem erros.
- [ ] Pipeline de CI verde, com relatório publicado como artefato.
- [ ] README completo conforme §15.
- [ ] `docs/ELEMENTS-MAP.md` e `docs/API-REFERENCE.md` versionados no repositório.

---

## 17. Roadmap de execução (uma fase = um commit)

| Fase | Entrega | Commit sugerido |
|---|---|---|
| 1 | `npm init`, Cypress, ESLint, Prettier, husky, commitlint, `.gitignore` | `chore(setup): inicializar projeto com cypress e ferramentas de qualidade` |
| 2 | `cypress.config.js`, scripts, estrutura de pastas vazia | `chore(config): configurar cypress e scripts de execucao` |
| 3 | `constants/`, `selectors/` (copiados do ELEMENTS-MAP) | `feat(support): centralizar constantes e seletores` |
| 4 | `BaseService` + services de login/usuários/produtos | `feat(services): implementar camada de acesso a api` |
| 5 | Factories + schemas + `schemaValidator` | `feat(support): adicionar factories de massa e validacao de contrato` |
| 6 | Specs de API (CT-API-001..003) | `test(api): validar usuarios, login e regras de acesso a produtos` |
| 7 | `BasePage` + Page Objects + custom commands | `feat(pages): implementar page objects com heranca de BasePage` |
| 8 | Specs de UI (CT-E2E-001..003) | `test(e2e): cobrir login e cadastro de produto pela interface` |
| 9 | Relatórios + GitHub Actions | `ci(actions): executar suite e publicar relatorio` |
| 10 | README + docs | `docs(readme): documentar arquitetura, execucao e decisoes` |

**Comece pela fase 1 e não pule etapas.** Ao concluir cada fase, execute a suíte antes de commitar.
