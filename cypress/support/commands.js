import loginService from './services/LoginService';
import usuariosService from './services/UsuariosService';
import produtosService from './services/ProdutosService';
import { ROUTES, STORAGE_KEYS } from './constants/routes';
import { STATUS } from './constants/statusCodes';

/**
 * Custom commands existem apenas para primitivas realmente transversais.
 * Regra de corte: se e especifico de uma tela, vira metodo de Page Object;
 * se e especifico de um recurso da API, vira metodo de Service Object.
 */

Cypress.Commands.add('getByTestId', (testId) => cy.get(`[data-testid="${testId}"]`));

/**
 * Cria um usuario via API (setup rapido, sem passar pela interface).
 * Devolve o proprio usuario acrescido do _id gerado, para permitir a limpeza.
 */
Cypress.Commands.add('criarUsuarioViaApi', (usuario) =>
  usuariosService.create(usuario).then(({ status, body }) => {
    expect(status, 'pre-condicao: criacao de usuario via api').to.eq(STATUS.CREATED);
    return { ...usuario, _id: body._id };
  })
);

/**
 * Autentica via API e devolve o valor completo do header Authorization.
 */
Cypress.Commands.add('obterToken', ({ email, password }) =>
  loginService.autenticar({ email, password }).then(({ status, body }) => {
    expect(status, 'pre-condicao: autenticacao via api').to.eq(STATUS.OK);
    return body.authorization;
  })
);

/**
 * Injeta a sessao no localStorage do front, pulando o login pela interface.
 *
 * Usado nos cenarios cujo objeto de teste NAO e o login - mantem o teste
 * focado no comportamento sob validacao e reduz pontos de falha.
 * O cenario de login continua passando pela interface, obrigatoriamente.
 */
Cypress.Commands.add('sessaoAdmin', (usuario) => {
  cy.session(
    usuario.email,
    () => {
      cy.obterToken(usuario).then((token) => {
        cy.visit(ROUTES.LOGIN);
        cy.window().then((win) => {
          win.localStorage.setItem(STORAGE_KEYS.TOKEN, token);
          win.localStorage.setItem(STORAGE_KEYS.EMAIL, usuario.email);
          win.localStorage.setItem(STORAGE_KEYS.NOME, usuario.nome);
        });
      });
    },
    { cacheAcrossSpecs: true }
  );
});

/**
 * Limpeza de massa. Respeita a ordem exigida pela API: produto antes de usuario.
 */
Cypress.Commands.add('removerProdutoPorNome', (nome, token) =>
  produtosService.buscarPorNome(nome).then(({ body }) => {
    const produto = body.produtos?.find((item) => item.nome === nome);
    if (!produto) {
      return undefined;
    }
    return produtosService.remove(produto._id, token).then(() => produto);
  })
);
