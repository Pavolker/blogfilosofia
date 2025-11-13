/**
 * Configuration for Supabase connection
 * This file contains the credentials needed to connect to Supabase
 */
window.APP_CONFIG = {
  /**
   * Supabase configuration for reading data (posts/feedback/likes)
   * To connect to your Supabase project, replace the placeholder values below:
   * 1. Go to your Supabase dashboard
   * 2. In Project Settings > API, find your Project URL and Public API key
   * 3. Replace the placeholder values with your actual credentials
   * 
   * Example format: 
   * supabaseUrl: 'https://bxvlfxawfwfqgsyipgyr.supabase.co'
   * supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4dmxmeGF3ZndmcWdzeWlwZ3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTkzODIsImV4cCI6MjA3ODA5NTM4Mn0.mNVK3WlTuTqT82RK8C922dTpTvE_WYGBI4EJUoGzY0g'
   */
  supabaseUrl: 'https://bxvlfxawfwfqgsyipgyr.supabase.co', // Add your Supabase project URL here (e.g., https://your-project.supabase.co)
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4dmxmeGF3ZndmcWdzeWlwZ3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MTkzODIsImV4cCI6MjA3ODA5NTM4Mn0.mNVK3WlTuTqT82RK8C922dTpTvE_WYGBI4EJUoGzY0g', // Add your Supabase anon key here

  /**
   * When true, the bootstrap will seed the remote database with initial posts
   * Requires a protected service using the service key
   */
  seedRemote: false,

  /**
   * Optional: IDs or titles to hide only in the UI
   * Useful for hiding legacy posts without removing them from the database
   */
  hiddenPostIds: [],
  hiddenPostTitles: [],

  /**
   * Protected service URL (Edge Function, Cloud Run, etc.)
   * Responsible for creating/deleting posts, persisting feedback, and syncing likes
   * Should validate publisher authentication and use Supabase service key
   *
   * Example: https://my-function.cloudfunctions.net/blog
   */
  publisherServiceUrl: '',

  /**
   * Optional token sent via Authorization: Bearer <token> to the service above
   */
  publisherServiceToken: '',

  /**
   * Supabase Auth: mapeia identificadores usados na UI para e-mails cadastrados no Supabase.
   * ATENÇÃO: atualize estes e-mails com os usuários reais criados na aba Authentication do Supabase.
   */
  publisherAccounts: {
    PAULO: {
      email: 'pvolker@mdh-hability.com',
      displayName: 'Paulo',
    },
    ANGELICA: {
      email: 'angelica@lacasacreativa.net', 
      displayName: 'Angelica',
    },
  },

  /**
   * Endpoint paths (relative to publisherServiceUrl) used for each type of action
   * Only edit if the backend uses different routes
   */
  endpoints: {
    posts: '/posts',
    feedback: '/feedback',
    likes: '/likes',
    backup: '/backup',
  },

  /**
   * When true, the like counter attempts to sync with the remote service
   * Otherwise, only local storage is used
   */
  enableSharedLikes: false,
};
