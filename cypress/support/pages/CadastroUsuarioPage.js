import BasePage from './BasePage';
import { cadastroUsuarioSelectors as sel } from '../selectors/cadastroUsuario.selectors';
import { ROUTES } from '../constants/routes';

/**
 * Atende as duas telas de cadastro de usuario (publica e administrativa),
 * que compartilham os mesmos campos e diferem apenas no botao de submit.
 */
class CadastroUsuarioPage extends BasePage {
  constructor(route = ROUTES.CADASTRO_USUARIO, botaoSubmit = sel.botaoCadastrarPublico) {
    super(route);
    this.botaoSubmit = botaoSubmit;
  }

  static admin() {
    return new CadastroUsuarioPage(ROUTES.ADMIN_CADASTRO_USUARIO, sel.botaoCadastrarAdmin);
  }

  preencherFormulario({ nome, email, password, administrador }) {
    this.preencher(sel.nome, nome)
      .preencher(sel.email, email)
      .preencher(sel.password, password, { log: false });

    if (administrador === 'true') {
      this.marcarComoAdministrador();
    }
    return this;
  }

  marcarComoAdministrador() {
    this.getByTestId(sel.checkboxAdministrador).check();
    return this;
  }

  submeter() {
    this.getByTestId(this.botaoSubmit).click();
    return this;
  }

  cadastrar(usuario) {
    return this.preencherFormulario(usuario).submeter();
  }
}

export default new CadastroUsuarioPage();
export { CadastroUsuarioPage };
