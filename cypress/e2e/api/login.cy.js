import loginService from '../../support/services/LoginService';
import usuariosService from '../../support/services/UsuariosService';
import { usuarioFactory } from '../../support/factories/usuario.factory';
import { API_MESSAGES, VALIDATION_MESSAGES } from '../../support/constants/messages';
import { STATUS } from '../../support/constants/statusCodes';
import { BEARER_PATTERN } from '../../support/constants/patterns';
import { validarSchema } from '../../support/utils/schemaValidator';

/**
 * CT-API-002 - Autenticacao de usuario
 */
describe('API | POST /login', () => {
  let usuario;
  let schemaLogin;

  before(() => {
    cy.fixture('schemas/login.schema').then((schema) => {
      schemaLogin = schema;
    });

    cy.criarUsuarioViaApi(usuarioFactory.admin()).then((criado) => {
      usuario = criado;
    });
  });

  after(() => {
    if (usuario?._id) {
      usuariosService.remove(usuario._id);
    }
  });

  it('autentica o usuario e devolve um token de acesso valido', () => {
    loginService.autenticar(usuario).then((resposta) => {
      expect(resposta.status, 'status da autenticacao').to.eq(STATUS.OK);
      expect(resposta.body.message, 'mensagem de retorno').to.eq(API_MESSAGES.LOGIN_SUCCESS);
      expect(resposta.body.authorization, 'token com prefixo Bearer').to.match(BEARER_PATTERN);

      validarSchema(schemaLogin, resposta.body);
    });
  });

  it('recusa a autenticacao quando a senha esta incorreta', () => {
    loginService
      .autenticar({ email: usuario.email, password: 'senha-incorreta' })
      .then((resposta) => {
        expect(resposta.status, 'status da autenticacao recusada').to.eq(STATUS.UNAUTHORIZED);
        expect(resposta.body.message, 'mensagem de retorno').to.eq(API_MESSAGES.LOGIN_FAIL);
        expect(resposta.body, 'nenhum token emitido').to.not.have.property('authorization');
      });
  });

  it('recusa a autenticacao quando o email nao esta em um formato valido', () => {
    loginService
      .autenticar({ email: 'email-invalido', password: usuario.password })
      .then((resposta) => {
        expect(resposta.status, 'status da validacao de schema').to.eq(STATUS.BAD_REQUEST);
        expect(resposta.body.email, 'mensagem do campo email').to.eq(
          VALIDATION_MESSAGES.emailInvalido('email')
        );
      });
  });
});
