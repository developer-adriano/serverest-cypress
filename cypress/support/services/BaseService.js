/**
 * Camada de acesso a API.
 *
 * Responsabilidade unica: montar e disparar a requisicao.
 * Nenhum service faz assertiva - quem avalia a resposta e a spec, sempre.
 * Por isso `failOnStatusCode` e sempre false: cenarios negativos precisam
 * receber o 400/401/403 como resposta, e nao como falha de teste.
 */
export default class BaseService {
  constructor(resource) {
    this.resource = resource;
  }

  get baseUrl() {
    return Cypress.env('apiUrl');
  }

  request({ method, path = '', body, qs, token, headers = {} }) {
    return cy.request({
      method,
      url: `${this.baseUrl}${this.resource}${path}`,
      body,
      qs,
      headers: token ? { ...headers, Authorization: token } : headers,
      failOnStatusCode: false,
    });
  }

  getAll(qs) {
    return this.request({ method: 'GET', qs });
  }

  getById(id) {
    return this.request({ method: 'GET', path: `/${id}` });
  }

  create(body, token) {
    return this.request({ method: 'POST', body, token });
  }

  update(id, body, token) {
    return this.request({ method: 'PUT', path: `/${id}`, body, token });
  }

  remove(id, token) {
    return this.request({ method: 'DELETE', path: `/${id}`, token });
  }
}
