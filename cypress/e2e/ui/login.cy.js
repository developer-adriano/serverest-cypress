import loginPage from '../../support/pages/LoginPage';
import adminHomePage from '../../support/pages/AdminHomePage';
import navbarAdminPage from '../../support/pages/NavbarAdminPage';
import usuariosService from '../../support/services/UsuariosService';
import { usuarioFactory } from '../../support/factories/usuario.factory';
import { UI_MESSAGES } from '../../support/constants/messages';
import { ROUTES, STORAGE_KEYS } from '../../support/constants/routes';
import { BEARER_PATTERN } from '../../support/constants/patterns';

/**
 * CT-E2E-001 e CT-E2E-002 - Autenticacao pela interface
 */
describe('E2E | Login', () => {
  let administrador;

  before(() => {
    cy.criarUsuarioViaApi(usuarioFactory.admin()).then((usuario) => {
      administrador = usuario;
    });
  });

  after(() => {
    if (administrador?._id) {
      usuariosService.remove(administrador._id);
    }
  });

  beforeEach(() => {
    loginPage.visit();
  });

  context('com credenciais validas de administrador', () => {
    it('autentica o usuario e o direciona ao painel administrativo', () => {
      // O front so redireciona apos consultar a lista de usuarios;
      // esperar por essa requisicao substitui qualquer espera fixa.
      cy.intercept('GET', '**/usuarios*').as('consultaDePerfil');

      loginPage.logar(administrador);
      cy.wait('@consultaDePerfil');

      adminHomePage.assertUrl(ROUTES.ADMIN_HOME).assertUsuarioLogado(administrador.nome);
      navbarAdminPage.assertMenuCompleto();

      cy.window()
        .then((win) => win.localStorage.getItem(STORAGE_KEYS.TOKEN))
        .should('match', BEARER_PATTERN);
    });
  });

  context('com credenciais invalidas', () => {
    const cenarios = [
      {
        titulo: 'quando o usuario nao existe',
        credenciais: () => usuarioFactory.build(),
        mensagem: UI_MESSAGES.CREDENCIAIS_INVALIDAS,
      },
      {
        titulo: 'quando o email nao e informado',
        credenciais: () => ({ email: '', password: 'senha-qualquer' }),
        mensagem: UI_MESSAGES.EMAIL_OBRIGATORIO,
      },
      {
        titulo: 'quando a senha nao e informada',
        credenciais: () => ({ email: 'usuario.inexistente@example.com', password: '' }),
        mensagem: UI_MESSAGES.SENHA_OBRIGATORIA,
      },
    ];

    cenarios.forEach(({ titulo, credenciais, mensagem }) => {
      it(`exibe mensagem de erro e mantem o usuario na tela de login ${titulo}`, () => {
        loginPage.logar(credenciais());

        loginPage.assertMensagemDeErro(mensagem).assertUrl(ROUTES.LOGIN);

        cy.window()
          .then((win) => win.localStorage.getItem(STORAGE_KEYS.TOKEN))
          .should('be.null');
      });
    });

    it('permite fechar o alerta de erro exibido', () => {
      loginPage.logar(usuarioFactory.build());

      loginPage
        .assertMensagemDeErro(UI_MESSAGES.CREDENCIAIS_INVALIDAS)
        .fecharAlertaDeErro()
        .assertSemAlertaDeErro();
    });
  });
});
