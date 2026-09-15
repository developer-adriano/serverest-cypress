/**
 * Rotas do frontend (React Router).
 */
export const ROUTES = {
  LOGIN: '/login',
  CADASTRO_USUARIO: '/cadastrarusuarios',
  ADMIN_HOME: '/admin/home',
  ADMIN_CADASTRO_USUARIO: '/admin/cadastrarusuarios',
  ADMIN_LISTA_USUARIOS: '/admin/listarusuarios',
  ADMIN_CADASTRO_PRODUTO: '/admin/cadastrarprodutos',
  ADMIN_LISTA_PRODUTOS: '/admin/listarprodutos',
  ADMIN_RELATORIOS: '/admin/relatorios',
  HOME_CLIENTE: '/home',
  LISTA_DE_COMPRAS: '/minhaListaDeProdutos',
  CARRINHO: '/carrinho',
};

/**
 * Chaves de sessao gravadas pelo front no localStorage.
 */
export const STORAGE_KEYS = {
  TOKEN: 'serverest/userToken',
  EMAIL: 'serverest/userEmail',
  NOME: 'serverest/userNome',
};
