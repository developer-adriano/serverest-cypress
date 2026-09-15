/**
 * Todo _id gerado pelo ServeRest tem exatamente 16 caracteres alfanumericos.
 */
export const ID_PATTERN = /^[a-zA-Z0-9]{16}$/;

/**
 * O header Authorization e retornado com o prefixo "Bearer ".
 */
export const BEARER_PATTERN = /^Bearer .+/;
