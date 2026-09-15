import BaseService from './BaseService';
import { ENDPOINTS } from '../constants/endpoints';

class LoginService extends BaseService {
  constructor() {
    super(ENDPOINTS.LOGIN);
  }

  autenticar({ email, password }) {
    return this.create({ email, password });
  }
}

export default new LoginService();
