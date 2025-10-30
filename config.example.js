// Copie este arquivo para config.js e preencha com suas credenciais do Supabase.
// Atenção: a chave anon é pública e segura para uso no cliente.
// Nunca exponha chaves de serviço no cliente.

window.APP_CONFIG = {
  // URL do seu projeto Supabase (ex.: https://xxxx.supabase.co)
  supabaseUrl: 'COLOQUE_SUA_SUPABASE_URL_AQUI',
  // Chave pública anon do Supabase
  supabaseAnonKey: 'COLOQUE_SUA_SUPABASE_ANON_KEY_AQUI',
  // Opcional: IDs de posts para ocultar apenas na UI (não deleta)
  hiddenPostIds: [
    'patricia-amanhecer',
    'higino-movimentos',
    'paulo-sintonia'
  ],
  // Opcional: títulos de posts para ocultar apenas na UI (não deleta)
  hiddenPostTitles: [
    'Respirar o amanhecer com presença',
    'Movimentos que despertam coragem',
    'Sintonia entre mente e intuição'
  ],
};