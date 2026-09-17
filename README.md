# ServeRest — Automação de Testes E2E e API

[![CI](https://github.com/<usuario>/serverest-cypress/actions/workflows/ci.yml/badge.svg)](https://github.com/<usuario>/serverest-cypress/actions/workflows/ci.yml)

Suíte de testes automatizados da aplicação [ServeRest](https://serverest.dev), construída com **Cypress** e **JavaScript**, cobrindo o frontend ([front.serverest.dev](https://front.serverest.dev)) e a API REST ([serverest.dev](https://serverest.dev)).

O projeto foi estruturado em camadas — **Page Object Model** para a interface e **Service Objects** para a API — com massa de dados gerada dinamicamente e limpeza automática após cada execução.

---

## Stack

| Ferramenta | Versão | Uso |
|---|---|---|
| Cypress | 13.x | Runner de testes E2E e de API |
| JavaScript | ES2022 (ESM) | Linguagem |
| @faker-js/faker | 8.x | Geração de massa de dados |
| Ajv + ajv-formats | 8.x | Validação de contrato (JSON Schema) |
| ESLint + Prettier | 8.x / 3.x | Padronização de código |
| Husky + commitlint + lint-staged | — | Qualidade no commit |
| Mochawesome | 7.x | Relatórios de execução |
| GitHub Actions | — | Integração contínua |

Requisito: **Node.js 18+**.

---

## Como executar

```bash
# instalar dependências (usa o package-lock.json versionado)
npm ci

# modo interativo
npm run cy:open

# suíte completa em modo headless
npm test

# apenas testes de API
npm run test:api

# apenas testes de interface
npm run test:ui

# lint
npm run lint

# relatório HTML (após uma execução)
npm run report
```

Não é necessário configurar variáveis de ambiente: a URL do frontend está em `baseUrl` e a da API em `env.apiUrl`, ambas no `cypress.config.js`. Para apontar para uma instância local do ServeRest:

```bash
npx cypress run --config baseUrl=http://localhost:3000 --env apiUrl=http://localhost:3000
```

---

## Arquitetura

```
cypress/
├── e2e/
│   ├── api/                 # cenários de API — orquestram Service Objects
│   │   ├── login.cy.js
│   │   ├── usuarios.cy.js
│   │   └── produtos.cy.js
│   └── ui/                  # cenários de interface — orquestram Page Objects
│       ├── login.cy.js
│       └── produtos.cy.js
├── fixtures/
│   └── schemas/             # JSON Schemas para validação de contrato
└── support/
    ├── constants/           # rotas, endpoints, mensagens, status codes, regex
    ├── factories/           # geradores de massa de dados
    ├── pages/               # Page Objects (BasePage + páginas)
    ├── selectors/           # seletores externalizados, um módulo por tela
    ├── services/            # Service Objects (BaseService + recursos da API)
    ├── utils/               # validador de schema
    ├── commands.js          # custom commands transversais
    └── e2e.js
docs/
├── SPEC.md                  # especificação técnica do projeto
├── ELEMENTS-MAP.md          # mapa completo de elementos da UI
└── API-REFERENCE.md         # contrato da API e catálogo de mensagens
```

### O papel de cada camada

**`specs` (`*.cy.js`)** — descrevem **o que** se espera do sistema. Contêm apenas orquestração e assertivas de negócio. Nenhum seletor CSS, nenhum `cy.get`, nenhum `cy.request`, nenhuma lógica condicional.

**`pages`** — descrevem **como** se interage com cada tela. Todas herdam de `BasePage`, que concentra navegação, acesso por `data-testid` e o tratamento dos alertas globais do ServeRest. Métodos de ação retornam `this`, permitindo encadeamento fluente (`loginPage.preencherEmail(x).preencherSenha(y).submeter()`). Cada Page Object é exportado como instância única.

**`selectors`** — descrevem **onde** o elemento está. Nenhum seletor aparece hardcoded no corpo de um método. Quando o front muda, há exatamente um arquivo a alterar por tela.

**`services`** — camada de acesso à API, com `BaseService` fornecendo o CRUD genérico e cada recurso especializando o que lhe é próprio. Os services **nunca** fazem assertivas e sempre usam `failOnStatusCode: false` — avaliar a resposta é responsabilidade da spec, o que torna os cenários negativos (400/401/403) naturais de escrever.

**`factories`** — geram massa válida por padrão e permitem sobrescrever qualquer campo para montar cenários negativos. Emails e nomes de produto recebem sufixo único, porque o ServeRest impõe unicidade global para ambos.

**`constants`** — mensagens da API e mensagens da interface ficam em catálogos **separados**, porque o componente `ErrorAlert` do front transforma o texto antes de exibi-lo (capitaliza a primeira letra e minusculiza o restante).

---

## Cenários cobertos

### Interface (E2E)

| ID | Cenário | Arquivo |
|---|---|---|
| CT-E2E-001 | Login com credenciais válidas de administrador redireciona ao painel, exibe a saudação e o menu administrativo completo, e grava o token de sessão | `ui/login.cy.js` |
| CT-E2E-002 | Login inválido exibe a mensagem correta e mantém o usuário na tela — cobre usuário inexistente, email vazio e senha vazia (data-driven), além do fechamento do alerta | `ui/login.cy.js` |
| CT-E2E-003 | Administrador cadastra produto, é redirecionado à listagem, encontra os dados corretos na mesma linha da tabela e a persistência é confirmada na API | `ui/produtos.cy.js` |

### API

| ID | Cenário | Arquivo |
|---|---|---|
| CT-API-001 | `POST /usuarios` — cadastro com sucesso (status, mensagem, `_id`, contrato e persistência via `GET`), unicidade de email e campo obrigatório ausente | `api/usuarios.cy.js` |
| CT-API-002 | `POST /login` — emissão de token com prefixo `Bearer` e contrato validado, senha incorreta (401) e email em formato inválido (400) | `api/login.cy.js` |
| CT-API-003 | `POST /produtos` — autorização em três condições (admin 201, sem token 401, não-admin 403), persistência com contrato validado, exclusão e unicidade de nome | `api/produtos.cy.js` |

---

## Decisões técnicas

**Por que Page Object com `BasePage`.** As telas do ServeRest compartilham navegação, alertas e o mesmo mecanismo de localização por `data-testid`. Concentrar isso numa classe base elimina duplicação e faz cada Page Object ficar com apenas o que é específico da sua tela. `CadastroUsuarioPage` vai além e atende as duas telas de cadastro (pública e administrativa) por parametrização, já que elas diferem apenas no botão de submit.

**Por que Service Objects em vez de custom commands para a API.** Custom commands são globais e sem tipo; uma classe por recurso deixa explícito o que a API oferece, permite herança do CRUD comum e mantém a spec legível. Custom commands ficaram restritos a três primitivas realmente transversais: `getByTestId`, `criarUsuarioViaApi` e `obterToken`.

**Por que criar massa via API e não pela interface.** Criar um usuário pela tela para depois testar outro fluxo torna o teste lento e o faz falhar por um motivo que não é o seu objeto de validação. O setup via API é rápido e determinístico; a interface só é exercitada no comportamento que o cenário realmente cobre. O cenário de login, esse sim, passa integralmente pela tela.

**Por que injetar a sessão no `localStorage`.** O front guarda `serverest/userToken`, `serverest/userEmail` e `serverest/userNome` no `localStorage`. Nos testes cujo objeto não é o login, `cy.sessaoAdmin()` autentica via API e injeta essas chaves dentro de um `cy.session()` com cache entre specs — o mesmo efeito do login manual, sem repetir o fluxo a cada teste.

**Por que `retries: 2` apenas em `runMode`.** O ServeRest online é um ambiente público e compartilhado, sujeito a latência e a escrita concorrente de outros usuários. O retry cobre esse risco de infraestrutura, nunca instabilidade de teste mal escrito — não há uma única espera fixa no projeto (`cy.wait` só é usado com alias de `cy.intercept`).

**Por que validar contrato com JSON Schema.** Verificar status e mensagem prova que a rota respondeu; validar o schema prova que ela respondeu **com a estrutura acordada**. `additionalProperties: false` faz o teste falhar quando um campo novo aparece sem aviso — que é exatamente o tipo de regressão silenciosa que uma suíte de API precisa capturar.

**Por que a massa é sempre destruída.** O ambiente é compartilhado e resetado apenas uma vez por dia. Cada spec remove o que criou nos hooks `after`, respeitando a ordem exigida pela API (produto antes de usuário), para não degradar o ambiente de quem vier depois.

---

## Relatórios

Cada execução grava um JSON em `cypress/reports/`. Para consolidar em HTML:

```bash
npm run report
# abre em cypress/reports/html/report.html
```

No CI, o relatório de cada suíte e os screenshots de falha são publicados como artefatos do workflow.

---

## Observações e possíveis defeitos encontrados

Achados levantados durante o mapeamento da aplicação. Nenhum deles impede a execução da suíte; estão registrados porque fazem parte do trabalho de QA.

**Interface**

1. `data-testid="cadastarProdutos"` — o botão de cadastro de produtos tem um erro de digitação no atributo (falta o segundo "d"). A suíte usa o valor real, sem contorná-lo.
2. `data-testid` duplicado — o botão de checkout em `/minhaListaDeProdutos` declara o atributo duas vezes (`checkout-products` e `adicionar carrinho`). No JSX o último prevalece, então `checkout-products` **não existe** no DOM e o valor válido contém um espaço.
3. Classe `btn-close-succcess-alert` — erro de digitação (três "c") no botão de fechar o alerta de sucesso.
4. Inconsistência de nomenclatura — o campo de senha é `senha` no login e `password` nos cadastros; o campo de quantidade usa `quantity` em inglês entre campos em português; os cards do painel usam camelCase enquanto a navbar usa kebab-case.
5. Campo **Imagem** marcado como obrigatório (`Imagem: *`) na tela de cadastro de produtos, mas a API trata `imagem` como opcional — é possível cadastrar e listar o produto sem imagem.
6. `/detalhesProduto/:id` depende de `location.state` e quebra ao ser acessada diretamente pela URL, o que impede compartilhar o link de um produto.

**Segurança**

7. A senha do usuário é gravada em texto plano no `localStorage` (`serverest/userPassword`) durante o cadastro público.
8. A tela `/admin/listarusuarios` exibe uma coluna **Senha** com as senhas de todos os usuários, e o endpoint `GET /usuarios` as retorna em texto plano.

---

## Documentação complementar

- [`docs/SPEC.md`](docs/SPEC.md) — especificação técnica: arquitetura, padrões, cenários detalhados e Definition of Done.
- [`docs/ELEMENTS-MAP.md`](docs/ELEMENTS-MAP.md) — mapa completo dos elementos da interface, alertas e armadilhas conhecidas.
- [`docs/API-REFERENCE.md`](docs/API-REFERENCE.md) — endpoints, payloads, regras de negócio, catálogo de mensagens e schemas.
