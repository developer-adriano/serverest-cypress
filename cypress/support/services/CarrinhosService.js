import BaseService from './BaseService';
import { ENDPOINTS } from '../constants/endpoints';

class CarrinhosService extends BaseService {
  constructor() {
    super(ENDPOINTS.CARRINHOS);
  }

  concluirCompra(token) {
    return this.request({ method: 'DELETE', path: '/concluir-compra', token });
  }

  cancelarCompra(token) {
    return this.request({ method: 'DELETE', path: '/cancelar-compra', token });
  }
}

export default new CarrinhosService();
