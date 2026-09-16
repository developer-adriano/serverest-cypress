import usuariosService from '../../support/services/UsuariosService';
import { usuarioFactory } from '../../support/factories/usuario.factory';
import { API_MESSAGES, VALIDATION_MESSAGES } from '../../support/constants/messages';
import { STATUS } from '../../support/constants/statusCodes';
import { ID_PATTERN } from '../../support/constants/patterns';
import { validarSchema } from '../../support/utils/schemaValidator';

/**
 * CT-API-001 - Cadastro de usuarios e regra de unicidade de email
 */
describe('API | POST /usuarios', () => {
  const idsCriados = [];
  let schemaCadastro;
  let schemaUsuario;

  before(() => {
    cy.fixture('schemas/cadastro.schema').then((schema) => {
      schemaCadastro = schema;
    });
    cy.fixture('schemas/usuario.schema').then((schema) => {
      schemaUsuario = schema;
    });
  });

  after(() => {
    idsCriados.forEach((id) => usuariosService.remove(id));
  });

  it('cadastra um novo usuario e persiste os dados enviados', () => {
    const usuario = usuarioFactory.admin();

    usuariosService.create(usuario).then((resposta) => {
      expect(resposta.status, 'status do cadastro').to.eq(STATUS.CREATED);
      expect(resposta.body.message, 'mensagem de retorno').to.eq(API_MESSAGES.POST_SUCCESS);
      expect(resposta.body._id, 'identificador gerado').to.match(ID_PATTERN);

      validarSchema(schemaCadastro, resposta.body);
      idsCriados.push(resposta.body._id);

      // O cadastro so esta correto se o recurso for recuperavel com os mesmos dados.
      usuariosService.getById(resposta.body._id).then(({ status, body }) => {
        expect(status, 'status da consulta do usuario criado').to.eq(STATUS.OK);
        expect(body.nome, 'nome persistido').to.eq(usuario.nome);
        expect(body.email, 'email persistido').to.eq(usuario.email);
        expect(body.administrador, 'perfil persistido').to.eq(usuario.administrador);

        validarSchema(schemaUsuario, body);
      });
    });
  });

  it('impede o cadastro de dois usuarios com o mesmo email', () => {
    const usuario = usuarioFactory.cliente();

    cy.criarUsuarioViaApi(usuario).then(({ _id }) => idsCriados.push(_id));

    usuariosService.create(usuario).then((resposta) => {
      expect(resposta.status, 'status do cadastro duplicado').to.eq(STATUS.BAD_REQUEST);
      expect(resposta.body.message, 'mensagem de retorno').to.eq(API_MESSAGES.EMAIL_ALREADY_USED);
    });
  });

  it('impede o cadastro quando um campo obrigatorio nao e informado', () => {
    const { email: _email, ...usuarioSemEmail } = usuarioFactory.admin();

    usuariosService.create(usuarioSemEmail).then((resposta) => {
      expect(resposta.status, 'status da validacao de schema').to.eq(STATUS.BAD_REQUEST);
      expect(resposta.body.email, 'mensagem do campo email').to.eq(
        VALIDATION_MESSAGES.obrigatorio('email')
      );
    });
  });
});
