import produtosService from '../../support/services/ProdutosService';
import usuariosService from '../../support/services/UsuariosService';
import { produtoFactory } from '../../support/factories/produto.factory';
import { usuarioFactory } from '../../support/factories/usuario.factory';
import { API_MESSAGES } from '../../support/constants/messages';
import { STATUS } from '../../support/constants/statusCodes';
import { ID_PATTERN } from '../../support/constants/patterns';
import { validarSchema } from '../../support/utils/schemaValidator';

/**
 * CT-API-003 - Rota protegida de produtos: autenticacao, autorizacao e ciclo de vida
 */
describe('API | POST /produtos', () => {
  const idsDeProdutos = [];
  const idsDeUsuarios = [];

  let tokenAdministrador;
  let tokenCliente;
  let schemaProduto;

  before(() => {
    cy.fixture('schemas/produto.schema').then((schema) => {
      schemaProduto = schema;
    });

    cy.criarUsuarioViaApi(usuarioFactory.admin()).then((usuario) => {
      idsDeUsuarios.push(usuario._id);

      cy.obterToken(usuario).then((token) => {
        tokenAdministrador = token;
      });
    });

    cy.criarUsuarioViaApi(usuarioFactory.cliente()).then((usuario) => {
      idsDeUsuarios.push(usuario._id);

      cy.obterToken(usuario).then((token) => {
        tokenCliente = token;
      });
    });
  });

  after(() => {
    // A ordem importa: a API recusa excluir usuario que ainda possua vinculos.
    idsDeProdutos.forEach((id) => produtosService.remove(id, tokenAdministrador));
    idsDeUsuarios.forEach((id) => usuariosService.remove(id));
  });

  it('cadastra o produto quando o token pertence a um administrador', () => {
    const produto = produtoFactory.build();

    produtosService.create(produto, tokenAdministrador).then((resposta) => {
      expect(resposta.status, 'status do cadastro de produto').to.eq(STATUS.CREATED);
      expect(resposta.body.message, 'mensagem de retorno').to.eq(API_MESSAGES.POST_SUCCESS);
      expect(resposta.body._id, 'identificador gerado').to.match(ID_PATTERN);

      idsDeProdutos.push(resposta.body._id);

      produtosService.getById(resposta.body._id).then(({ status, body }) => {
        expect(status, 'status da consulta do produto criado').to.eq(STATUS.OK);
        expect(body.nome, 'nome persistido').to.eq(produto.nome);
        expect(body.preco, 'preco persistido').to.eq(produto.preco);
        expect(body.descricao, 'descricao persistida').to.eq(produto.descricao);
        expect(body.quantidade, 'quantidade persistida').to.eq(produto.quantidade);

        validarSchema(schemaProduto, body);
      });
    });
  });

  it('recusa o cadastro quando a requisicao nao envia token de acesso', () => {
    produtosService.create(produtoFactory.build()).then((resposta) => {
      expect(resposta.status, 'status da requisicao sem token').to.eq(STATUS.UNAUTHORIZED);
      expect(resposta.body.message, 'mensagem de retorno').to.eq(API_MESSAGES.INVALID_TOKEN);
    });
  });

  it('recusa o cadastro quando o token pertence a um usuario nao administrador', () => {
    produtosService.create(produtoFactory.build(), tokenCliente).then((resposta) => {
      expect(resposta.status, 'status da requisicao sem permissao').to.eq(STATUS.FORBIDDEN);
      expect(resposta.body.message, 'mensagem de retorno').to.eq(API_MESSAGES.REQUIRED_ADMIN);
    });
  });

  it('exclui o produto cadastrado e o torna inacessivel', () => {
    const produto = produtoFactory.build();

    produtosService.create(produto, tokenAdministrador).then(({ body }) => {
      const produtoId = body._id;

      produtosService.remove(produtoId, tokenAdministrador).then((resposta) => {
        expect(resposta.status, 'status da exclusao').to.eq(STATUS.OK);
        expect(resposta.body.message, 'mensagem de retorno').to.eq(API_MESSAGES.DELETE_SUCCESS);
      });

      produtosService.getById(produtoId).then((resposta) => {
        expect(resposta.status, 'status da consulta apos exclusao').to.eq(STATUS.BAD_REQUEST);
        expect(resposta.body.message, 'mensagem de retorno').to.eq(API_MESSAGES.PRODUCT_NOT_FOUND);
      });
    });
  });

  it('nao cadastra dois produtos com o mesmo nome', () => {
    const produto = produtoFactory.build();

    produtosService.create(produto, tokenAdministrador).then(({ body }) => {
      idsDeProdutos.push(body._id);

      produtosService.create(produto, tokenAdministrador).then((resposta) => {
        expect(resposta.status, 'status do cadastro duplicado').to.eq(STATUS.BAD_REQUEST);
        expect(resposta.body.message, 'mensagem de retorno').to.eq(API_MESSAGES.NAME_ALREADY_USED);
      });
    });
  });
});
