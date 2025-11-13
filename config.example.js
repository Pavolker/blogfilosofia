/**
 * Copie este arquivo para config.js (listado no .gitignore) e personalize.
 * Nunca coloque chaves de serviço diretamente no cliente; exponha apenas a anon key.
 */
window.APP_CONFIG = {
  /**
   * Configuração do Supabase (URL + anon key). Leituras usam a anon key.
   * Escritas acontecem por sessões autenticadas via Supabase Auth.
   */
  supabaseUrl: 'COLOQUE_SUA_SUPABASE_URL_AQUI',
  supabaseAnonKey: 'COLOQUE_SUA_SUPABASE_ANON_KEY_AQUI',

  /**
   * Quando true, o bootstrap vai semear a base remota com os posts iniciais.
   * Requer um serviço protegido utilizando a service key.
   */
  seedRemote: false,

  /**
   * Opcional: IDs ou títulos para esconder apenas na UI.
   * Útil para ocultar posts legacy sem removê-los do banco.
   */
  hiddenPostIds: [],
  hiddenPostTitles: [],

  /**
   * Endereço de um serviço protegido (Edge Function, Cloud Run etc.)
   * responsável por criar/apagar posts, persistir feedback e sincronizar likes.
   * Deve validar autenticação do publicador e usar a service key do Supabase.
   *
   * Exemplo: https://minha-funcao.cloudfunctions.net/blog
   */
  publisherServiceUrl: '',

  /**
   * Token opcional enviado via Authorization: Bearer <token> para o serviço acima.
   */
  publisherServiceToken: '',

  /**
   * Supabase Auth: identifique os publicadores usando o mesmo identificador da UI.
   * Configure aqui os e-mails cadastrados no Supabase e, opcionalmente, o nome exibido.
   */
  publisherAccounts: {
    PAULO: {
      email: 'paulo@example.com',
      displayName: 'Paulo',
    },
    ANGELICA: {
      email: 'angelica@example.com',
      displayName: 'Angélica Sátiro',
    },
  },

  /**
   * Caminho (relativo ao publisherServiceUrl) utilizado para cada tipo de ação.
   * Edite somente se o backend usar rotas diferentes.
   */
  endpoints: {
    posts: '/posts',
    feedback: '/feedback',
    likes: '/likes',
    backup: '/backup',
  },

  /**
   * Quando true, o contador de curtidas tenta sincronizar com o serviço remoto.
   * Caso contrário, apenas o armazenamento local é utilizado.
   */
  enableSharedLikes: false,
};
