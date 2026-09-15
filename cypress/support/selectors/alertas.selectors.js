/**
 * Alertas globais do ServeRest (componentes ErrorAlert e SuccessAlert).
 */
export const alertaSelectors = {
  erro: '.alert.alert-secondary',
  erroTexto: '.alert.alert-secondary span',
  fecharErro: '.btn-close-error-alert',
  sucesso: '.alert.alert-primary',
  sucessoTexto: '.alert.alert-primary .alert-link',
  // Typo presente no codigo-fonte do front (tres "c").
  fecharSucesso: '.btn-close-succcess-alert',
};
