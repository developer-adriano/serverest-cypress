import BasePage from './BasePage';
import { cadastroProdutoSelectors as sel } from '../selectors/cadastroProduto.selectors';
import { ROUTES } from '../constants/routes';

class CadastroProdutoPage extends BasePage {
  constructor() {
    super(ROUTES.ADMIN_CADASTRO_PRODUTO);
  }

  preencherFormulario({ nome, preco, descricao, quantidade }) {
    return this.preencher(sel.nome, nome)
      .preencher(sel.preco, preco)
      .preencher(sel.descricao, descricao)
      .preencher(sel.quantidade, quantidade);
  }

  submeter() {
    this.getByTestId(sel.botaoCadastrar).click();
    return this;
  }

  cadastrar(produto) {
    return this.preencherFormulario(produto).submeter();
  }
}

export default new CadastroProdutoPage();
