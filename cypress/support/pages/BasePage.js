import { alertaSelectors } from '../selectors/alertas.selectors';

/**
 * Comportamento comum a todas as paginas.
 * Nenhuma pagina filha reimplementa acesso a elemento, navegacao ou alertas.
 */
export default class BasePage {
  constructor(route = '/') {
    this.route = route;
  }

  visit() {
    cy.visit(this.route);
    return this;
  }

  getByTestId(testId) {
    return cy.getByTestId(testId);
  }

  assertUrl(route = this.route) {
    cy.url().should('include', route);
    return this;
  }

  // ----- alertas -----

  alertaDeErro() {
    return cy.get(alertaSelectors.erro);
  }

  alertaDeSucesso() {
    return cy.get(alertaSelectors.sucessoTexto);
  }

  /**
   * O componente ErrorAlert capitaliza a primeira letra e minusculiza o resto,
   * por isso a comparacao usa o catalogo UI_MESSAGES e nao o da API.
   */
  assertMensagemDeErro(mensagem) {
    this.alertaDeErro().should('be.visible').and('contain.text', mensagem);
    return this;
  }

  assertMensagemDeSucesso(mensagem) {
    this.alertaDeSucesso().should('be.visible').and('have.text', mensagem);
    return this;
  }

  fecharAlertaDeErro() {
    cy.get(alertaSelectors.fecharErro).click();
    return this;
  }

  assertSemAlertaDeErro() {
    cy.get(alertaSelectors.erro).should('not.exist');
    return this;
  }

  // ----- helpers -----

  /**
   * Preenche um campo apenas quando ha valor.
   * Permite reutilizar o mesmo fluxo em cenarios de campo obrigatorio vazio.
   */
  preencher(testId, valor, opcoes = {}) {
    if (valor === undefined || valor === null || valor === '') {
      return this;
    }
    this.getByTestId(testId).clear().type(valor, opcoes);
    return this;
  }
}
