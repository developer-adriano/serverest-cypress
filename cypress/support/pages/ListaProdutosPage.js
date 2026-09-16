import BasePage from './BasePage';
import { listagemSelectors as sel } from '../selectors/listagens.selectors';
import { ROUTES } from '../constants/routes';

/**
 * A listagem exibe TODOS os produtos do ambiente compartilhado.
 * Por isso toda assertiva e escopada na linha do produto sob teste.
 */
class ListaProdutosPage extends BasePage {
  constructor() {
    super(ROUTES.ADMIN_LISTA_PRODUTOS);
  }

  tabela() {
    return cy.get(sel.tabela);
  }

  linhaDoProduto(nome) {
    return this.tabela().contains(sel.linha, nome);
  }

  assertProdutoListado({ nome, preco, descricao, quantidade }) {
    this.linhaDoProduto(nome)
      .should('have.length', 1)
      .within(() => {
        cy.contains('td', nome).should('be.visible');
        cy.contains('td', String(preco)).should('be.visible');
        cy.contains('td', descricao).should('be.visible');
        cy.contains('td', String(quantidade)).should('be.visible');
      });
    return this;
  }

  excluirProduto(nome) {
    this.linhaDoProduto(nome).within(() => {
      cy.get(sel.botaoExcluir).click();
    });
    return this;
  }

  assertProdutoNaoListado(nome) {
    this.tabela().should('not.contain.text', nome);
    return this;
  }
}

export default new ListaProdutosPage();
