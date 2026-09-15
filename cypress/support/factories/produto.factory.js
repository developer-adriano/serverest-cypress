import { faker } from '@faker-js/faker';

/**
 * Gera massa de produto valida.
 *
 * O nome recebe sufixo unico porque a API responde 400
 * "Ja existe produto com esse nome" para nomes repetidos no ambiente compartilhado.
 * `preco` e `quantidade` respeitam o schema da API: inteiro positivo e inteiro >= 0.
 */
export const produtoFactory = {
  build(overrides = {}) {
    const sufixo = `${Date.now()}${faker.string.alphanumeric(4)}`;

    return {
      nome: `${faker.commerce.productName()} ${sufixo}`,
      preco: faker.number.int({ min: 1, max: 5000 }),
      descricao: faker.commerce.productDescription(),
      quantidade: faker.number.int({ min: 1, max: 500 }),
      ...overrides,
    };
  },
};
