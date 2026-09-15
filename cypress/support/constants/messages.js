/**
 * Mensagens retornadas pela API ServeRest.
 * Fonte: src/utils/constants.js do projeto oficial.
 */
export const API_MESSAGES = {
  POST_SUCCESS: 'Cadastro realizado com sucesso',
  PUT_SUCCESS: 'Registro alterado com sucesso',
  DELETE_SUCCESS: 'Registro excluído com sucesso',
  DELETE_NONE: 'Nenhum registro excluído',
  LOGIN_SUCCESS: 'Login realizado com sucesso',
  LOGIN_FAIL: 'Email e/ou senha inválidos',
  EMAIL_ALREADY_USED: 'Este email já está sendo usado',
  NAME_ALREADY_USED: 'Já existe produto com esse nome',
  REQUIRED_ADMIN: 'Rota exclusiva para administradores',
  INVALID_TOKEN: 'Token de acesso ausente, inválido, expirado ou usuário do token não existe mais',
  USER_NOT_FOUND: 'Usuário não encontrado',
  PRODUCT_NOT_FOUND: 'Produto não encontrado',
};

/**
 * Mensagens de validacao de schema, geradas por campo pela API.
 */
export const VALIDATION_MESSAGES = {
  obrigatorio: (campo) => `${campo} é obrigatório`,
  emailInvalido: (campo) => `${campo} deve ser um email válido`,
  naoPositivo: (campo) => `${campo} deve ser um número positivo`,
};

/**
 * Mensagens como sao EXIBIDAS na interface.
 * O componente ErrorAlert capitaliza a primeira letra e minusculiza o restante,
 * por isso este catalogo e separado do catalogo da API.
 */
export const UI_MESSAGES = {
  CREDENCIAIS_INVALIDAS: 'Email e/ou senha inválidos',
  EMAIL_OBRIGATORIO: 'Email é obrigatório',
  SENHA_OBRIGATORIA: 'Password é obrigatório',
  EMAIL_JA_USADO: 'Este email já está sendo usado',
  CADASTRO_SUCESSO: 'Cadastro realizado com sucesso',
};
