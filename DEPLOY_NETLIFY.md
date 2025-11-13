# Deploy no Netlify

## Configuração Rápida

1. Acesse [Netlify](https://netlify.com)
2. Clique em "New site from Git"
3. Conecte seu repositório (GitHub, GitLab, etc.)
4. Configure:
   - Build command: `npm run build` (ou deixe vazio)
   - Publish directory: `.` (raiz do projeto)
5. Clique em "Deploy site"

## Configuração Manual (Drag & Drop)

1. Faça download deste repositório como ZIP
2. Acesse [Netlify](https://netlify.com)
3. Arraste a pasta descompactada para a área de deploy
4. O site será publicado automaticamente

## Configurações Importantes

O arquivo `netlify.toml` já contém:
- Configuração de redirecionamento SPA
- Variáveis de ambiente para produção
- Configurações de build

## Próximos Passos Após Deploy

1. Configure as variáveis de ambiente no Netlify:
   - `SUPABASE_URL`: URL do seu projeto Supabase
   - `SUPABASE_ANON_KEY`: Chave anônima do Supabase

2. Configure os publicadores no arquivo `config.js`:
   - Atualize os emails em `publisherAccounts`
   - Configure as credenciais do Supabase

3. Teste o login com os publicadores:
   - Paulo: pvolker@mdh-hability.com
   - Angelica: angelica@lacasacreativa.net

4. **Teste o menu lateral**: Clique no botão de menu (☰) para garantir que a sidebar funciona corretamente
 
## Domínio Customizado

- O Netlify fornece um domínio gratuito `.netlify.app`
- Você pode configurar um domínio customizado nas configurações

## ✅ Funcionalidades Verificadas

- **Menu Lateral**: Corrigido e funcionando corretamente (botão toggle com ícone e texto dinâmico)
- **Site Estático**: JavaScript puro, sem necessidade de build process
- O Supabase é usado para funcionalidades dinâmicas (likes, comentários)
- Os arquivos estáticos são servidos diretamente sem build process

## 🛠️ Correções Aplicadas

- **Função setupSidebarToggle**: Adicionada para controlar o menu lateral
- **Toggle dinâmico**: Ícone alterna entre "menu" e "close"
- **Texto dinâmico**: Label alterna entre "Abrir menu" e "Fechar menu"
- **Acessibilidade**: Atributos ARIA são atualizados dinamicamente
