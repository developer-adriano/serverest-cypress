import cadastroProdutoPage from '../../support/pages/CadastroProdutoPage';
import listaProdutosPage from '../../support/pages/ListaProdutosPage';
import produtosService from '../../support/services/ProdutosService';
import usuariosService from '../../support/services/UsuariosService';
import { produtoFactory } from '../../support/factories/produto.factory';
import { usuarioFactory } from '../../support/factories/usuario.factory';
import { ROUTES } from '../../support/constants/routes';
import { STATUS } from '../../support/constants/statusCodes';

/**
 * CT-E2E-003 - Cadastro de produto pelo administrador e persistencia na listagem
 */
describe('E2E | Cadastro de produtos', () => {
  const produto = produtoFactory.build();

  let administrador;
  let tokenAdministrador;

  before(() => {
    cy.criarUsuarioViaApi(usuarioFactory.admin()).then((usuario) => {
      administrador = usuario;

      cy.obterToken(usuario).then((token) => {
        tokenAdministrador = token;
      });
    });
  });

  after(() => {
    cy.removerProdutoPorNome(produto.nome, tokenAdministrador).then(() => {
      if (administrador?._id) {
        usuariosService.remove(administrador._id);
      }
    });
  });

  beforeEach(() => {
    // O objeto deste cenario e o cadastro de produto, nao o login:
    // a sessao e injetada via API para manter o teste focado e estavel.
    cy.sessaoAdmin(administrador);
    cadastroProdutoPage.visit();
  });

  it('cadastra o produto, redireciona para a listagem e persiste os dados informados', () => {
    cadastroProdutoPage.cadastrar(produto);

    listaProdutosPage.assertUrl(ROUTES.ADMIN_LISTA_PRODUTOS).assertProdutoListado(produto);

    // A interface pode exibir o dado sem que ele exista de fato:
    // a confirmacao final e feita na fonte da verdade.
    produtosService.buscarPorNome(produto.nome).then((resposta) => {
      expect(resposta.status, 'status da consulta de produtos').to.eq(STATUS.OK);
      expect(resposta.body.quantidade, 'produtos encontrados com o nome cadastrado').to.eq(1);
      expect(resposta.body.produtos[0].preco, 'preco persistido').to.eq(produto.preco);
      expect(resposta.body.produtos[0].quantidade, 'quantidade persistida').to.eq(
        produto.quantidade
      );
    });
  });
});
