import BasePage from './BasePage';
import { loginSelectors as sel } from '../selectors/login.selectors';
import { ROUTES } from '../constants/routes';

class LoginPage extends BasePage {
  constructor() {
    super(ROUTES.LOGIN);
  }

  preencherEmail(email) {
    return this.preencher(sel.email, email);
  }

  preencherSenha(senha) {
    return this.preencher(sel.senha, senha, { log: false });
  }

  submeter() {
    this.getByTestId(sel.botaoEntrar).click();
    return this;
  }

  logar({ email, password }) {
    return this.preencherEmail(email).preencherSenha(password).submeter();
  }

  irParaCadastro() {
    this.getByTestId(sel.linkCadastrar).click();
    return this;
  }
}

export default new LoginPage();
