import BasePage from './BasePage';
import { listagemSelectors as sel } from '../selectors/listagens.selectors';
import { ROUTES } from '../constants/routes';

class ListaUsuariosPage extends BasePage {
  constructor() {
    super(ROUTES.ADMIN_LISTA_USUARIOS);
  }

  tabela() {
    return cy.get(sel.tabela);
  }

  linhaDoUsuario(email) {
    return this.tabela().contains(sel.linha, email);
  }

  assertUsuarioListado({ nome, email }) {
    this.linhaDoUsuario(email)
      .should('have.length', 1)
      .within(() => {
        cy.contains('td', nome).should('be.visible');
      });
    return this;
  }

  excluirUsuario(email) {
    this.linhaDoUsuario(email).within(() => {
      cy.get(sel.botaoExcluir).click();
    });
    return this;
  }
}

export default new ListaUsuariosPage();
