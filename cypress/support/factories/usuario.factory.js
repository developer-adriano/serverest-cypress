import { faker } from '@faker-js/faker';

/**
 * Gera massa de usuario valida por padrao, permitindo sobrescrever
 * qualquer campo para montar cenarios negativos.
 *
 * O email e sempre unico: o ServeRest rejeita duplicidade no ambiente inteiro.
 */
export const usuarioFactory = {
  build({ administrador = 'true', ...overrides } = {}) {
    const sufixo = `${Date.now()}${faker.string.alphanumeric(4)}`;

    return {
      nome: faker.person.fullName(),
      email: `qa.${sufixo}@serverest.test`.toLowerCase(),
      password: faker.internet.password({ length: 12 }),
      administrador,
      ...overrides,
    };
  },

  admin(overrides = {}) {
    return this.build({ ...overrides, administrador: 'true' });
  },

  cliente(overrides = {}) {
    return this.build({ ...overrides, administrador: 'false' });
  },
};
