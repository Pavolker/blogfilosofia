# Guia de Configuração do Supabase - Conversas Filosóficas

Este guia irá ajudá-lo a configurar a integração do seu blog com o Supabase passo a passo.

## Passo 1: Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login (ou crie uma conta gratuita)
2. Clique em **"New Project"**
3. Preencha os dados:
   - **Name**: `Blog Filosofia` (ou o nome que preferir)
   - **Database Password**: Crie uma senha forte e **anote em local seguro**
   - **Region**: Escolha a região mais próxima (ex: `South America (São Paulo)`)
4. Clique em **"Create new project"** e aguarde 2-3 minutos até a criação completar

## Passo 2: Executar o Schema SQL

Após o projeto ser criado:

1. No painel lateral do Supabase, clique em **"SQL Editor"**
2. Clique em **"New Query"**
3. **Copie todo o conteúdo** do arquivo `supabase.sql` deste projeto
4. Cole o conteúdo na janela do SQL Editor no Supabase
5. Clique em **"Run"** (ou pressione `Ctrl/Cmd + Enter`)
6. Você deve ver a mensagem **"Success. No rows returned"**

### O que foi criado?

Este SQL criou automaticamente:
- ✅ Tabela `posts` (publicações do blog)
- ✅ Tabela `feedback` (comentários e perguntas dos leitores)
- ✅ Tabela `likes` (curtidas das publicações)
- ✅ View `post_like_totals` (contadores de curtidas)
- ✅ Políticas de segurança (Row Level Security)
- ✅ 3 posts iniciais de exemplo para testar

## Passo 3: Obter Suas Credenciais do Supabase

1. No painel do Supabase, clique no ícone de **engrenagem ⚙️** (Settings) no menu lateral inferior
2. Clique em **"API"** no menu de configurações
3. Você verá estas informações importantes:

### a) Project URL
```
https://abcdefghijklmnop.supabase.co
```
📋 **Copie este endereço completo** (incluindo o `https://`)

### b) API Keys - anon/public
Role a página para baixo até encontrar **"Project API keys"**

Você verá duas chaves:
- `anon` `public` ← **COPIE ESTA** (é uma string longa que começa com `eyJ...`)
- `service_role` ← **NÃO USE ESTA NO FRONTEND**

⚠️ **MUITO IMPORTANTE**:
- A chave `anon public` é segura para usar no navegador
- A chave `service_role` tem acesso total ao banco de dados
- **NUNCA** exponha a `service_role` key no código do cliente!

## Passo 4: Configurar Supabase Auth

Para que o app consiga gravar posts/feedback/likes remotamente:

1. No painel do Supabase, vá em **Authentication → Providers** e ative **Email** (Password auth).
2. Ainda em **Authentication → Providers**, ative **Anonymous Sign-ins** — isso permite que leitores recebam um token temporário e possam curtir/comentar.
3. Em **Authentication → Users**, clique em **Add user** para cada publicador e informe:
   - Email (ex.: `paulo@example.com`)
   - Senha provisória (o app solicitará essa senha)
   - User metadata com o campo `author` igual ao nome do autor (ex.: `{"author": "Paulo"}`)
4. Anote os e-mails usados — eles serão mapeados em `config.js`.

> Dica: você pode personalizar o `displayName` exibido no painel definindo `display_name` ou `author` no metadata.

## Passo 5: Configurar o config.js

1. Abra o arquivo **`config.js`** na raiz do projeto
2. Localize estas duas linhas:

```javascript
supabaseUrl: '',
supabaseAnonKey: '',
```

3. Cole suas credenciais que você copiou no Passo 3:

```javascript
supabaseUrl: 'https://abcdefghijklmnop.supabase.co',  // Cole sua Project URL aqui
supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SUA_CHAVE_COMPLETA_AQUI',  // Cole sua anon key aqui
```

4. Logo abaixo, ajuste o objeto `publisherAccounts` com os e-mails criados no Passo 4:

```javascript
publisherAccounts: {
  PAULO: { email: 'paulo@example.com', displayName: 'Paulo' },
  ANGELICA: { email: 'angelica@example.com', displayName: 'Angélica Sátiro' },
},
```

5. **Salve o arquivo** (`Ctrl/Cmd + S`)

## Passo 6: Testar a Integração

### Teste no Navegador

1. Abra o arquivo **`index.html`** em um navegador moderno (Chrome, Firefox, Edge, Safari)
2. Pressione **`F12`** (ou `Cmd/Ctrl + Shift + I`) para abrir o DevTools
3. Clique na aba **"Console"**
4. Verifique se **não há erros vermelhos**
5. Você deve ver as 3 publicações iniciais na timeline
6. Teste:
   - ❤️ Curtir uma publicação
   - 💬 Adicionar um comentário
   - ❓ Fazer uma pergunta

### Verificar no Supabase

1. Volte ao painel do Supabase
2. Clique em **"Table Editor"** no menu lateral
3. Selecione a tabela **`posts`**
   - ✅ Você deve ver 3 posts iniciais
4. Selecione a tabela **`feedback`**
   - ✅ Você deve ver seu comentário/pergunta aparecer aqui
5. Selecione a tabela **`likes`**
   - ✅ Você deve ver seu registro de curtida

## Passo 7: Login de Publicador

1. Clique em **"Administração"**.
2. Informe a **identificação** (ex.: `PAULO`). O app usa esse identificador para localizar o e-mail configurado em `config.js → publisherAccounts`.
3. Digite a **senha** do usuário Supabase correspondente (criada no Passo 4).
4. Após o login, o painel mostrará o status "Supabase conectado como ...". Qualquer post ou réplica enviada será gravada diretamente no banco remoto.

> Sempre use senhas fortes e, se necessário, redefina-as direto no painel do Supabase (Authentication → Users).

## Configurações Opcionais

### Ocultar Publicações Específicas (apenas na UI)

No arquivo `config.js`, você pode ocultar posts por ID ou título:

```javascript
hiddenPostIds: ['paulo-sintonia', 'angelica-criatividade'],
// ou
hiddenPostTitles: ['Sintonia entre mente e intuição'],
```

### Curtidas Sincronizadas

Com o Supabase Auth habilitado (Passo 4), cada visitante recebe uma sessão anônima e as curtidas passam a ser gravadas na tabela `likes`. Se o Supabase estiver offline, o app volta automaticamente para o modo localStorage.

## Solução de Problemas Comuns

### ❌ Erro: "Invalid Supabase URL format"

**Causa**: URL incorreta ou mal formatada

**Solução**:
- Verifique se copiou a URL completa incluindo `https://`
- Remova espaços antes ou depois da URL
- Verifique se está no formato: `https://seu-id.supabase.co`

### ❌ Erro: "Invalid API key" ou "Failed to create Supabase client"

**Causa**: Chave de API incorreta

**Solução**:
- Certifique-se de copiar a chave `anon` (não a `service_role`)
- Verifique se copiou a chave **completa** (ela é bem longa!)
- Remova espaços antes/depois da chave
- A chave correta começa com `eyJ` e tem várias centenas de caracteres

### ❌ Posts não aparecem na timeline

**Causas possíveis**:

1. O SQL não foi executado corretamente
   - Vá em **Table Editor** > **posts**
   - Verifique se existem 3 posts na tabela

2. Credenciais incorretas no config.js
   - Abra o Console do navegador (F12)
   - Procure por mensagens de erro vermelhas

3. Arquivo config.js não carregou
   - Verifique se o arquivo existe na mesma pasta que index.html
   - Veja se não há erros de sintaxe no config.js

### ❌ Não consigo inserir comentários/feedback

**Causa**: Policy de segurança não criada

**Solução**:
1. No Supabase, vá em **Authentication** > **Policies**
2. Selecione a tabela **`feedback`**
3. Verifique se existe a policy: **`authenticated_insert_feedback`**
4. Se não existir, execute novamente o SQL do Passo 2
5. Confirme que **Anonymous Sign-ins** está habilitado em Authentication → Providers

### ❌ Ao curtir aparece erro no console

**Causa**: Curtidas compartilhadas habilitadas sem serviço backend

**Solução**:
- No `config.js`, certifique-se de que está:
```javascript
enableSharedLikes: false,  // deve estar false se não tem backend
```

## Backup e Segurança

### Fazer Backup dos Dados

1. Clique em **"Administração"** no topo
2. Faça login como publicador
3. Role até **"Backup e Restauração"**
4. Clique em **"Baixar backup (.json)"**
5. Salve o arquivo em local seguro

### Restaurar de Backup

1. Na mesma seção de Backup
2. Clique em **"Restaurar de backup"**
3. Selecione o arquivo .json do backup
4. Os dados serão restaurados

### Segurança do config.js

O arquivo `config.js` está no `.gitignore`, então:
- ✅ Suas credenciais **NÃO** serão enviadas para o Git
- ✅ Use `config.example.js` como referência para outros desenvolvedores
- ⚠️ Nunca publique suas credenciais em repositórios públicos

## Próximos Passos

Após configurar com sucesso:

1. ✅ Teste todas as funcionalidades (curtir, comentar, publicar)
2. ✅ Altere as senhas dos publicadores em `script.js` (linha 47-52)
3. ✅ Personalize os autores e suas fotos em `AUTHOR_PHOTOS` (linha 26-31)
4. ✅ Configure backup automático (faça backups regulares!)
5. ✅ Considere configurar um domínio customizado
6. ✅ Explore o painel do Supabase para ver logs e métricas

## Recursos Úteis

- 📚 [Documentação do Supabase](https://supabase.com/docs)
- 🔧 [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- 🔒 [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- 💬 [Supabase Discord Community](https://discord.supabase.com)

## Precisa de Ajuda?

Se encontrar problemas:

1. Verifique o Console do navegador (F12) para mensagens de erro
2. Verifique os logs no Supabase: **Logs & Analytics** > **Logs**
3. Revise cada passo deste guia cuidadosamente
4. Certifique-se de que todas as credenciais estão corretas

---

✨ **Parabéns!** Sua plataforma de conversas filosóficas está pronta para uso!
