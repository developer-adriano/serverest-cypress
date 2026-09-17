# Mapa de Elementos — Front ServeRest

**Aplicação:** https://front.serverest.dev
**Fonte:** código-fonte oficial (`github.com/ServeRest/front`, React SPA com React Router + React-Bootstrap).
**Estratégia de seletor:** `data-testid` como primeira opção. Quando o elemento não possui `data-testid` (tabelas, botões de ação das listagens, alertas), o seletor estrutural documentado aqui é o oficial do projeto.

Convenção adotada nos Page Objects: `cy.get('[data-testid="<valor>"]')` via `BasePage.getByTestId()`.

---

## 1. Mapa de rotas

| Rota | Tela | Requer token | Perfil |
|---|---|---|---|
| `/` | Redireciona para `/login` | Não | — |
| `/login` | Login | Não | — |
| `/cadastrarusuarios` | Cadastro público de usuário | Não | — |
| `/admin/home` | Painel administrativo | Sim | Admin |
| `/admin/cadastrarusuarios` | Cadastro de usuário (admin) | Sim | Admin |
| `/admin/listarusuarios` | Lista de usuários | Sim | Admin |
| `/admin/cadastrarprodutos` | Cadastro de produto | Sim | Admin |
| `/admin/listarprodutos` | Lista de produtos | Sim | Admin |
| `/admin/relatorios` | Relatórios | Sim | Admin |
| `/home` | Loja (home do cliente) | Sim | Cliente |
| `/detalhesProduto/:id` | Detalhe do produto | Sim | Cliente |
| `/minhaListaDeProdutos` | Lista de compras | Sim | Cliente |
| `/carrinho` | Checkout | Sim | Cliente |

**Proteção de rota:** `validateToken()` roda no `componentDidMount` e redireciona para `/login` quando `localStorage['serverest/userToken']` é `null`. Por isso `cy.visit('/admin/...')` sem sessão injetada cai no login.

---

## 2. Tela de Login — `/login`

| Elemento | Seletor | Tipo | Observações |
|---|---|---|---|
| Campo Email | `[data-testid="email"]` | `input[type=email]` | placeholder `Digite seu email` |
| Campo Senha | `[data-testid="senha"]` | `input[type=password]` | placeholder `Digite sua senha`; **note que aqui o testid é `senha`**, diferente das telas de cadastro |
| Botão Entrar | `[data-testid="entrar"]` | `button[type=submit]` | texto `Entrar` |
| Link "Cadastre-se" | `[data-testid="cadastrar"]` | `a` | leva a `/cadastrarusuarios` |
| Logo | `img.imagem` | `img` | — |
| Título | `h1.font-robot` | `h1` | texto `Login` |
| Alerta de erro | `.alert.alert-secondary` | `div` | ver §7 |

**Fluxo pós-submit:** `POST /login` → grava `serverest/userEmail` e `serverest/userToken` → chama `GET /usuarios` (lista inteira) → se `administrador === 'true'`, grava `serverest/userNome` e vai para `/admin/home`; senão vai para `/home`.

> Como o redirecionamento depende do `GET /usuarios`, intercepte essa chamada antes do submit em vez de usar espera fixa:
> `cy.intercept('GET', '**/usuarios').as('listaUsuarios')`.

---

## 3. Cadastro público de usuário — `/cadastrarusuarios`

| Elemento | Seletor | Tipo | Observações |
|---|---|---|---|
| Campo Nome | `[data-testid="nome"]` | `input[type=text]` | placeholder `Digite seu nome` |
| Campo Email | `[data-testid="email"]` | `input[type=email]` | — |
| Campo Senha | `[data-testid="password"]` | `input[type=password]` | **testid `password`** (na tela de login é `senha`) |
| Checkbox Administrador | `[data-testid="checkbox"]` | `input[type=checkbox]` | label `Cadastrar como administrador?` |
| Botão Cadastrar | `[data-testid="cadastrar"]` | `button[type=submit]` | — |
| Link "Entrar" | `[data-testid="entrar"]` | `a` | leva a `/login` |
| Título | `h2.font-robot` | `h2` | texto `Cadastro` |
| Alerta de sucesso | `.alert.alert-primary .alert-link` | `a` | ver §7 |
| Alertas de erro | `.alert.alert-secondary` | `div` | um por campo com erro |

**Comportamento pós-cadastro:** exibe o alerta de sucesso, faz login automático e, após **3 segundos** (`setTimeout` no código), redireciona conforme o perfil. Aguarde pela URL/elemento de destino, não por tempo.

---

## 4. Navbars (componentes compartilhados)

### 4.1 Navbar Admin — presente em todas as telas `/admin/*`

| Item | Seletor | Destino |
|---|---|---|
| Home | `[data-testid="home"]` | `/admin/home` |
| Cadastrar Usuários | `[data-testid="cadastrar-usuarios"]` | `/admin/cadastrarusuarios` |
| Listar Usuários | `[data-testid="listar-usuarios"]` | `/admin/listarusuarios` |
| Cadastrar Produtos | `[data-testid="cadastrar-produtos"]` | `/admin/cadastrarprodutos` |
| Listar Produtos | `[data-testid="listar-produtos"]` | `/admin/listarprodutos` |
| Relatórios | `[data-testid="link-relatorios"]` | `/admin/relatorios` |
| Logout | `[data-testid="logout"]` | limpa `localStorage` e vai para `/login` |

### 4.2 Navbar Cliente — telas `/home`, `/detalhesProduto/:id`, `/minhaListaDeProdutos`, `/carrinho`

| Item | Seletor | Destino |
|---|---|---|
| Home | `[data-testid="home"]` | `/home` |
| Lista de Compras | `[data-testid="lista-de-compras"]` | `/minhaListaDeProdutos` |
| Carrinho | `[data-testid="carrinho"]` | `/carrinho` |
| Logout | `[data-testid="logout"]` | limpa `localStorage` e vai para `/login` |

> Os testids `home` e `logout` existem nas **duas** navbars. Como só uma renderiza por vez, não há colisão — mas o Page Object da navbar deve ser único e reutilizado por herança/composição, não duplicado.

---

## 5. Área administrativa

### 5.1 Painel — `/admin/home`

| Elemento | Seletor | Observações |
|---|---|---|
| Saudação | `h1` | texto `Bem Vindo {nome}` — o nome vem de `localStorage['serverest/userNome']` |
| Card → Cadastrar Usuários | `[data-testid="cadastrarUsuarios"]` | **camelCase**, diferente do testid da navbar (`cadastrar-usuarios`) |
| Card → Listar Usuários | `[data-testid="listarUsuarios"]` | |
| Card → Cadastrar Produtos | `[data-testid="cadastrarProdutos"]` | |
| Card → Listar Produtos | `[data-testid="listarProdutos"]` | |
| Card → Relatórios | `[data-testid="relatorios"]` | |

> **Armadilha:** os cards usam camelCase (`cadastrarUsuarios`) e a navbar usa kebab-case (`cadastrar-usuarios`). São elementos diferentes que levam ao mesmo lugar. Modele ambos, cada um no seu Page Object.

### 5.2 Cadastro de usuário (admin) — `/admin/cadastrarusuarios`

| Elemento | Seletor | Observações |
|---|---|---|
| Nome | `[data-testid="nome"]` | |
| Email | `[data-testid="email"]` | |
| Senha | `[data-testid="password"]` | |
| Checkbox Administrador | `[data-testid="checkbox"]` | |
| Botão Cadastrar | `[data-testid="cadastrarUsuario"]` | **diferente da tela pública**, que usa `cadastrar` |

Sucesso → redireciona para `/admin/listarusuarios`.

### 5.3 Cadastro de produto — `/admin/cadastrarprodutos`

| Elemento | Seletor | Tipo | Observações |
|---|---|---|---|
| Nome | `[data-testid="nome"]` | `input[type=text]` | label `Nome: *` |
| Preço | `[data-testid="preco"]` | `input[type=number]` | label `Preço: *` — só aceita **inteiro positivo** na API |
| Descrição | `[data-testid="descricao"]` | `textarea` | label `Descrição: *` |
| Quantidade | `[data-testid="quantity"]` | `input[type=number]` | **testid em inglês**, diferente dos demais campos |
| Imagem | `[data-testid="imagem"]` | `input[type=file]` | label `Imagem: *` |
| Botão Cadastrar | `[data-testid="cadastarProdutos"]` | `button[type=submit]` | ⚠️ **typo no código-fonte: `cadastarProdutos`**, sem o segundo "d". Use exatamente assim. |
| Título | `h1` | | texto `Cadastro de Produtos` |

Sucesso → redireciona para `/admin/listarprodutos`.

> **Bug candidato para o README:** o campo Imagem exibe asterisco de obrigatório, mas `POST /produtos` trata `imagem` como opcional — é possível cadastrar sem imagem e o produto aparece normalmente na listagem.

### 5.4 Lista de usuários — `/admin/listarusuarios`

Sem `data-testid`. Estrutura:

| Elemento | Seletor |
|---|---|
| Título | `h1` (texto `Lista dos usuários`) |
| Tabela | `table.table.table-striped` |
| Cabeçalhos | `Nome`, `Email`, `Senha`, `Administrador`, `Ações` |
| Linha do usuário | `cy.contains('tr', email)` |
| Botão Editar (na linha) | `button.btn-info` dentro da `tr` |
| Botão Excluir (na linha) | `button.btn-danger` dentro da `tr` |
| Alerta de erro | `.alert.alert-secondary` |

Regra: ao tentar excluir o **próprio** usuário logado, a UI exibe `Não é possível excluir o próprio usuário!` (validação do front, não da API). Exclusão bem-sucedida dispara `window.location.reload()`.

**Padrão obrigatório de assertiva em tabela:**
```js
cy.contains('tr', emailDoUsuario).within(() => {
  cy.contains('td', nome).should('be.visible');
});
```

### 5.5 Lista de produtos — `/admin/listarprodutos`

| Elemento | Seletor |
|---|---|
| Título | `h1` (texto `Lista dos Produtos`) |
| Tabela | `table.table.table-striped` |
| Cabeçalhos | `Nome`, `Preço`, `Descrição`, `Quantidade`, `Imagem`, `Ações` |
| Linha do produto | `cy.contains('tr', nomeDoProduto)` |
| Botão Editar | `button.btn-info` dentro da `tr` |
| Botão Excluir | `button.btn-danger` dentro da `tr` |

A tabela lista **todos** os produtos do ambiente compartilhado (centenas de linhas). Sempre escope no `tr` do produto criado pelo teste.

---

## 6. Área do cliente

### 6.1 Home da loja — `/home`

| Elemento | Seletor | Observações |
|---|---|---|
| Campo de busca | `[data-testid="pesquisar"]` | `input[type=search]`, placeholder `Pesquisar Produtos` |
| Botão Pesquisar | `[data-testid="botaoPesquisar"]` | dispara `GET /produtos?nome={termo}` |
| Card de produto | `.card.col-3` | |
| Link de detalhes (imagem e texto) | `[data-testid="product-detail-link"]` | **aparece 2x por card** (imagem + link "Detalhes") — use `.first()` ou escope no card |
| Botão "Adicionar a lista" | `[data-testid="adicionarNaLista"]` | 1 por card |
| Ícone do carrinho | `[data-testid="shopping-cart-button"]` | |
| Contador do carrinho | `[data-testid="listaProdutos"]` | número de itens |
| Mensagem de busca vazia | texto `Nenhum produto foi encontrado` | componente `NoSearching`, sem testid |
| Título | `h1` (texto `Serverest Store`) | |

> A busca usa `GET /produtos?nome=` com match **parcial e case-insensitive** (o backend converte o valor em regex com flag `i`). Um termo parcial em minúsculas encontra o produto.
>
> O testid `home-initial-message` existe no componente `SearchBar`, mas **esse componente não é renderizado** na home atual. Não o use.

### 6.2 Detalhe do produto — `/detalhesProduto/:id`

| Elemento | Seletor |
|---|---|
| Nome do produto | `[data-testid="product-detail-name"]` |
| Botão "Adicionar a lista" | `[data-testid="adicionarNaLista"]` |
| Botão Voltar | `[data-testid="voltarHome"]` |
| Preço / Quantidade / Descrição | `h4.title` (textos `R$: x`, `Quantidade: x`, `Descrição: x`) |

> **Limitação importante:** esta tela lê o produto de `location.state`, populado pela navegação interna. `cy.visit('/detalhesProduto/<id>')` direto **quebra a página**. Sempre chegue aqui clicando no card.

### 6.3 Lista de compras — `/minhaListaDeProdutos`

| Elemento | Seletor | Observações |
|---|---|---|
| Botão "Página Inicial" | `[data-testid="paginaInicial"]` | |
| Mensagem de lista vazia | `[data-testid="shopping-cart-empty-message"]` | texto `Seu carrinho está vazio` |
| Botão "Adicionar no carrinho" | `[data-testid="adicionar carrinho"]` | ⚠️ ver nota abaixo |
| Botão "Limpar Lista" | `[data-testid="limparLista"]` | |
| Nome do produto no item | `[data-testid="shopping-cart-product-name"]` | |
| Quantidade do item | `[data-testid="shopping-cart-product-quantity"]` | |
| Diminuir quantidade | `[data-testid="product-decrease-quantity"]` | |
| Aumentar quantidade | `[data-testid="product-increase-quantity"]` | |

> **Bug candidato para o README:** o botão de checkout declara `data-testid` **duas vezes** no mesmo elemento (`checkout-products` e `adicionar carrinho`). No JSX o último prevalece, então o valor renderizado é `adicionar carrinho` — **com espaço no meio**. O seletor válido é `[data-testid="adicionar carrinho"]`. `checkout-products` não existe no DOM.

### 6.4 Checkout — `/carrinho`

Sem `data-testid`. Use seletores estruturais/por texto apenas se implementar cenário opcional.

---

## 7. Alertas — contrato de mensagens da UI

### 7.1 Alerta de erro (`ErrorAlert`)

```html
<div class="alert alert-secondary alert-dismissible" role="alert">
  <button class="close btn-close-error-alert">×</button>
  <span>Mensagem capitalizada</span>
</div>
```

| Uso | Seletor |
|---|---|
| Container | `.alert.alert-secondary` |
| Texto | `.alert.alert-secondary span` |
| Botão fechar | `.btn-close-error-alert` |

> ⚠️ **Transformação de texto:** o componente aplica `primeiraLetraMaiúscula + restanteEmMinúsculas`. A mensagem da API `email é obrigatório` é exibida como **`Email é obrigatório`**. Escreva as assertivas com o texto **como aparece na tela**, e mantenha essas strings em `constants/messages.js` separadas das mensagens da API.

Várias validações produzem vários alertas simultâneos — nesse caso use `.should('have.length', n)` ou escope por texto.

### 7.2 Alerta de sucesso (`SuccessAlert`)

```html
<div class="alert alert-dismissible alert-primary">
  <button class="close btn-close-succcess-alert">×</button>
  <a href="/#" class="alert-link">Cadastro realizado com sucesso</a>
</div>
```

| Uso | Seletor |
|---|---|
| Container | `.alert.alert-primary` |
| Texto | `.alert.alert-primary .alert-link` |
| Botão fechar | `.btn-close-succcess-alert` (⚠️ três "c" — typo no código-fonte) |

Sem transformação de texto: a mensagem aparece exatamente como veio da API.

### 7.3 Catálogo de mensagens exibidas na UI

| Situação | Texto renderizado |
|---|---|
| Login com credencial inválida | `Email e/ou senha inválidos` |
| Login/cadastro com email vazio | `Email é obrigatório` |
| Login com senha vazia | `Password é obrigatório` |
| Cadastro com email já usado | `Este email já está sendo usado` |
| Cadastro de usuário com sucesso | `Cadastro realizado com sucesso` |
| Produto com nome repetido | `Já existe produto com esse nome` |
| Nome de produto vazio | `Nome é obrigatório` |
| Preço vazio | `Preco é obrigatório` |
| Excluir o próprio usuário na listagem | `Não é possível excluir o próprio usuário!` |
| Busca sem resultados | `Nenhum produto foi encontrado` |

---

## 8. Sessão e `localStorage`

| Chave | Conteúdo | Gravada em |
|---|---|---|
| `serverest/userToken` | `Bearer eyJ...` | login e cadastro |
| `serverest/userEmail` | email do usuário | login e cadastro |
| `serverest/userNome` | nome do usuário | apenas quando admin |
| `serverest/userPassword` | senha em texto plano | cadastro público ⚠️ |

**Injeção de sessão** (para pular o login pela UI em testes que não testam login):

```js
cy.request('POST', `${Cypress.env('apiUrl')}/login`, { email, password })
  .then(({ body }) => {
    window.localStorage.setItem('serverest/userToken', body.authorization);
    window.localStorage.setItem('serverest/userEmail', email);
    window.localStorage.setItem('serverest/userNome', nome);
  });
```

Envolva em `cy.session()` para cache entre testes. **Logout** limpa todo o `localStorage` e redireciona para `/login`.

> **Bug candidato para o README:** a senha do usuário é persistida em texto plano no `localStorage` no cadastro público, e a listagem de usuários exibe a coluna `Senha` na tela. São dois achados de segurança legítimos para a seção de observações.

---

## 9. Resumo — todos os `data-testid` da aplicação

```
Login .................... email, senha, entrar, cadastrar
Cadastro público ......... nome, email, password, checkbox, cadastrar, entrar
Navbar admin ............. home, cadastrar-usuarios, listar-usuarios,
                           cadastrar-produtos, listar-produtos, link-relatorios, logout
Navbar cliente ........... home, lista-de-compras, carrinho, logout
Painel admin ............. cadastrarUsuarios, listarUsuarios, cadastrarProdutos,
                           listarProdutos, relatorios
Cadastro usuário (admin) . nome, email, password, checkbox, cadastrarUsuario
Cadastro produto ......... nome, preco, descricao, quantity, imagem, cadastarProdutos
Home cliente ............. pesquisar, botaoPesquisar, product-detail-link,
                           adicionarNaLista, shopping-cart-button, listaProdutos
Detalhe do produto ....... product-detail-name, adicionarNaLista,
                           product-detail-link, voltarHome
Lista de compras ......... paginaInicial, shopping-cart-empty-message,
                           "adicionar carrinho", limparLista,
                           shopping-cart-product-name, shopping-cart-product-quantity,
                           product-decrease-quantity, product-increase-quantity
Sem testid ............... tabelas de listagem, botões Editar/Excluir,
                           alertas, checkout
```

---

## 10. Armadilhas — checklist rápido

1. `senha` (login) ≠ `password` (cadastros).
2. `quantity` em inglês, no meio de campos em português.
3. `cadastarProdutos` tem typo — não corrija.
4. `adicionar carrinho` tem espaço no valor; `checkout-products` não existe no DOM.
5. `.btn-close-succcess-alert` tem três "c".
6. Cards do painel usam camelCase; navbar usa kebab-case.
7. `product-detail-link` repete dentro do mesmo card.
8. Alertas de erro têm o texto capitalizado pelo componente.
9. `/detalhesProduto/:id` não funciona com `cy.visit()` direto.
10. Toda rota autenticada exige token no `localStorage` **antes** do `visit`.
11. As tabelas de listagem são globais e enormes — sempre escope na `tr`.
12. Tanto o cadastro público quanto o login disparam `GET /usuarios` antes de redirecionar; intercepte em vez de esperar tempo fixo.
