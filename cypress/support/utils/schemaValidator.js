import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * Valida o contrato de uma resposta da API contra um JSON Schema.
 * A mensagem de erro lista todas as violacoes de uma vez.
 */
export const validarSchema = (schema, dados) => {
  const valido = ajv.validate(schema, dados);

  expect(valido, `contrato da resposta: ${ajv.errorsText(ajv.errors, { separator: ' | ' })}`).to.eq(
    true
  );
};
