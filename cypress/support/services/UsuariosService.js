import BaseService from './BaseService';
import { ENDPOINTS } from '../constants/endpoints';

class UsuariosService extends BaseService {
  constructor() {
    super(ENDPOINTS.USUARIOS);
  }

  buscarPorEmail(email) {
    return this.getAll({ email });
  }
}

export default new UsuariosService();
