import BasePage from './BasePage';
import { adminHomeSelectors as sel } from '../selectors/adminHome.selectors';
import { ROUTES } from '../constants/routes';

class AdminHomePage extends BasePage {
  constructor() {
    super(ROUTES.ADMIN_HOME);
  }

  saudacao() {
    return cy.get(sel.titulo);
  }

  assertUsuarioLogado(nome) {
    this.saudacao().should('contain.text', 'Bem Vindo').and('contain.text', nome);
    return this;
  }

  irParaCadastroDeProdutos() {
    this.getByTestId(sel.cardCadastrarProdutos).click();
    return this;
  }

  irParaListaDeUsuarios() {
    this.getByTestId(sel.cardListarUsuarios).click();
    return this;
  }
}

export default new AdminHomePage();
