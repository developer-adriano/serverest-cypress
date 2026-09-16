import BasePage from './BasePage';
import { navbarAdminSelectors as sel } from '../selectors/navbar.selectors';

class NavbarAdminPage extends BasePage {
  itens() {
    return Object.values(sel).filter((testId) => testId !== sel.logout);
  }

  assertMenuCompleto() {
    this.itens().forEach((testId) => {
      this.getByTestId(testId).should('be.visible');
    });
    return this;
  }

  irParaCadastroDeProdutos() {
    this.getByTestId(sel.cadastrarProdutos).click();
    return this;
  }

  irParaListaDeProdutos() {
    this.getByTestId(sel.listarProdutos).click();
    return this;
  }

  irParaListaDeUsuarios() {
    this.getByTestId(sel.listarUsuarios).click();
    return this;
  }

  logout() {
    this.getByTestId(sel.logout).click();
    return this;
  }
}

export default new NavbarAdminPage();
