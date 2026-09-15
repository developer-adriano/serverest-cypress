import BaseService from './BaseService';
import { ENDPOINTS } from '../constants/endpoints';

class ProdutosService extends BaseService {
  constructor() {
    super(ENDPOINTS.PRODUTOS);
  }

  /**
   * A API aplica regex case-insensitive sobre `nome`, entao a busca e parcial.
   */
  buscarPorNome(nome) {
    return this.getAll({ nome });
  }
}

export default new ProdutosService();
