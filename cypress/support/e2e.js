import './commands';

/**
 * O front do ServeRest e uma SPA React que emite erros nao tratados de
 * renderizacao em rotas do cliente. Eles nao afetam os fluxos sob teste e nao
 * devem derrubar a suite - erros de aplicacao relevantes continuam sendo
 * capturados pelas assertivas dos cenarios.
 */
Cypress.on('uncaught:exception', () => false);
