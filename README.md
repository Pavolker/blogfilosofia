# 🧠 Conversas Filosóficas - Sinapses do Vento

Plataforma de conversas filosóficas com foco na elucidação de problemas, formulação de perguntas e construção de hipóteses.

## ✨ Características

- 📝 **Publicações Filosóficas**: Autores podem compartilhar reflexões e insights
- 💬 **Comentários e Perguntas**: Leitores podem interagir com comentários e perguntas
- ❤️ **Sistema de Curtidas**: Apoio às publicações que ressoam
- 🔄 **Modo Híbrido**: Funciona offline (localStorage) ou online (Supabase)
- 🎨 **Design Responsivo**: Interface moderna e adaptativa
- 🔐 **Área de Administração**: Painel protegido para publicadores

## 🚀 Início Rápido

### Opção 1: Modo Local (sem Supabase)

1. Abra o arquivo `index.html` em um navegador moderno
2. O blog funcionará em modo offline usando localStorage
3. Pronto! Você pode testar todas as funcionalidades localmente

### Opção 2: Integração com Supabase (Recomendado)

Para ter sincronização online e persistência de dados na nuvem:

📖 **Siga o guia completo**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)

**Resumo rápido:**
1. Crie uma conta em [supabase.com](https://supabase.com)
2. Crie um novo projeto
3. Execute o SQL do arquivo `supabase.sql`
4. Configure suas credenciais no `config.js`

## 📁 Estrutura do Projeto

```
BLOG FILOSOFIA/
├── index.html              # Página principal
├── style.css               # Estilos e design
├── script.js               # Lógica do aplicativo
├── config.js               # Configurações (suas credenciais)
├── config.example.js       # Template de configuração
├── supabase.sql            # Schema do banco de dados
├── supabase_test.html      # Teste de conexão
├── SETUP_GUIDE.md          # Guia detalhado de setup
├── README.md               # Este arquivo
├── .gitignore              # Arquivos ignorados pelo Git
└── imagens/                # Fotos de autores
    ├── logofi.png
    ├── angelica.jpg
    └── sinapse.jpeg
```

## ⚙️ Configuração

### Arquivo config.js

O arquivo `config.js` contém suas credenciais e configurações:

```javascript
window.APP_CONFIG = {
  // Credenciais do Supabase (obrigatório para modo online)
  supabaseUrl: 'https://seu-projeto.supabase.co',
  supabaseAnonKey: 'sua-chave-aqui',

  // Opções de visualização
  hiddenPostIds: [],          // IDs de posts para ocultar
  hiddenPostTitles: [],       // Títulos de posts para ocultar

  // Configurações avançadas (opcional)
  publisherServiceUrl: '',    // URL do serviço backend protegido
  publisherServiceToken: '',  // Token de autenticação
  enableSharedLikes: false,   // Curtidas sincronizadas (requer backend)
};
```

### Credenciais de Publicador (Supabase Auth)

O login de publicadores agora usa o **Supabase Auth**. Configure tudo no `config.js`:

```javascript
publisherAccounts: {
  PAULO: { email: 'paulo@example.com', displayName: 'Paulo' },
  ANGELICA: { email: 'angelica@example.com', displayName: 'Angélica Sátiro' },
}
```

1. Crie usuários na aba **Authentication > Users** do Supabase com esses e-mails.
2. Defina uma senha segura para cada um (é a mesma digitada no campo "Senha" do painel).
3. No Supabase, edite o **User Metadata** e informe `author: "Paulo"` (o nome precisa corresponder ao campo `author` dos posts).
4. Habilite **Anonymous Sign-In** no Supabase Auth para que leitores possam curtir/comentar.

Para publicar:
- Clique em "Administração"
- Informe a identificação (ex.: `PAULO`) — o app converte para o e-mail configurado
- Digite a senha do usuário Supabase correspondente

Se o login for bem-sucedido, o Supabase devolverá um token autenticado e os posts/comentários serão gravados direto no banco remoto.

## 🎯 Funcionalidades Principais

### Para Leitores

- ✅ Ler publicações filosóficas
- ✅ Curtir publicações
- ✅ Comentar e fazer perguntas
- ✅ Responder a outros comentários
- ✅ Identidade persistente automática (Visitante-XXXX)

### Para Publicadores

- ✅ Login na área de Administração
- ✅ Criar novas publicações
- ✅ Responder comentários (réplicas e tréplicas)
- ✅ Fazer backup de dados
- ✅ Restaurar de backup
- ✅ Gerenciar visualização de posts

## 🗄️ Estrutura do Banco de Dados

### Tabela `posts`
```sql
- id: identificador único
- author: nome do autor
- title: título da publicação
- content: array de parágrafos (JSONB)
- createdAt: data de criação
```

### Tabela `feedback`
```sql
- id: identificador único
- postId: referência ao post
- parentId: referência ao comentário pai (para respostas)
- author: nome do autor do comentário
- role: 'reader' ou 'author'
- type: 'Comentário', 'Pergunta', 'Réplica', 'Tréplica'
- message: conteúdo do comentário
- timestamp: data/hora
```

### Tabela `likes`
```sql
- postId: referência ao post
- fingerprint: identificador único do usuário
- createdAt: data da curtida
```

## 🔒 Segurança

- ✅ Row Level Security (RLS) habilitado em todas as tabelas
- ✅ Login de publicadores via Supabase Auth (nenhuma senha fixa no frontend)
- ✅ Leitores anônimos podem ler e comentar
- ✅ Apenas usuários autenticados podem criar/deletar posts
- ✅ `config.js` está no `.gitignore` (credenciais não vão para Git)
- ✅ Chave `service_role` nunca exposta no frontend

## 🧪 Testando a Integração

### Teste Rápido

1. Abra `index.html` no navegador
2. Pressione `F12` para abrir o DevTools
3. Vá na aba Console
4. Verifique se não há erros vermelhos
5. Tente curtir e comentar em um post

### Teste Detalhado

Use o arquivo `supabase_test.html` para:
- Verificar conexão com Supabase
- Testar leitura de dados
- Testar inserção de feedback
- Ver logs detalhados

## 📊 Status da Conexão

No painel de Administração, você verá um indicador de status:

- 🟢 **Verde**: Serviço protegido ativo para publicações
- 🟡 **Amarelo**: Somente leitura - Supabase disponível (sem serviço de publicação)
- 🔴 **Vermelho**: Visualização local (localStorage)

## 🛠️ Solução de Problemas

### Posts não aparecem

1. Verifique o Console (F12) em busca de erros
2. Confirme que o SQL foi executado no Supabase
3. Verifique as credenciais no `config.js`

### Erro de conexão

1. Confirme que copiou a URL completa (com `https://`)
2. Verifique se copiou a chave `anon` (não a `service_role`)
3. Remova espaços antes/depois das credenciais

### Não consigo comentar

1. Verifique se a policy `allow_anon_insert_feedback` existe
2. No Supabase: Authentication > Policies > feedback
3. Execute novamente o `supabase.sql` se necessário

📖 **Mais detalhes**: Consulte [SETUP_GUIDE.md](./SETUP_GUIDE.md) para solução completa de problemas

## 📦 Backup e Restauração

### Fazer Backup

1. Administração > Backup e Restauração
2. Clique em "Baixar backup (.json)"
3. Salve em local seguro

### Restaurar

1. Administração > Backup e Restauração
2. "Restaurar de backup"
3. Selecione o arquivo .json

## 🌐 Deployment

Para colocar o blog online:

1. **GitHub Pages**: Faça push do código (sem config.js) e configure as credenciais via secrets
2. **Vercel**: Deploy direto do repositório Git
3. **Netlify**: Deploy com variáveis de ambiente
4. **Servidor próprio**: Upload via FTP/SSH

⚠️ **Lembre-se**: Configure as credenciais como variáveis de ambiente ou secrets, nunca no código!

## 🤝 Contribuindo

Para contribuir com o projeto:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é de código aberto. Use livremente para seus projetos de conversas filosóficas!

## 📚 Recursos Úteis

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Comunidade Supabase no Discord](https://discord.supabase.com)

## ✨ Créditos

Desenvolvido para a plataforma **Conversas Filosóficas - Sinapses do Vento**

---

💬 **Dúvidas?** Consulte o [SETUP_GUIDE.md](./SETUP_GUIDE.md) para instruções detalhadas!
