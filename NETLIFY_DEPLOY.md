# 🚀 Deploy no Netlify - Guia Completo

## ⚠️ IMPORTANTE: Configuração de Segurança

O arquivo `config.js` **NÃO** está no repositório por motivos de segurança. Ele será gerado automaticamente durante o build no Netlify usando variáveis de ambiente.

---

## 📋 Passo a Passo para Deploy

### 1️⃣ Criar Conta no Netlify

1. Acesse: https://app.netlify.com/
2. Faça login com sua conta GitHub

### 2️⃣ Importar Repositório

1. Clique em: **"Add new site"** → **"Import an existing project"**
2. Selecione: **"Deploy with GitHub"**
3. Autorize o Netlify a acessar seus repositórios
4. Selecione o repositório: **`Pavolker/blogfilosofia`**

### 3️⃣ Configurar Build Settings

Na página de configuração, use:

**Build command**: `npm run build`
**Publish directory**: `.` (ponto, significa raiz do projeto)
**Branch to deploy**: `main`

### 4️⃣ Configurar Variáveis de Ambiente

**MUITO IMPORTANTE!** Configure as seguintes variáveis de ambiente:

1. No Netlify, vá em: **Site settings** → **Environment variables** → **Add a variable**

2. Adicione as seguintes variáveis:

| Key | Value | Obrigatório |
|-----|-------|-------------|
| `SUPABASE_URL` | `https://bxvlfxawfwfqgsyipgyr.supabase.co` | ✅ Sim |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Sim |
| `PAULO_EMAIL` | `pvolker@mdh-hability.com` | ⚠️ Opcional |
| `ANGELICA_EMAIL` | `angelica@lacasacreativa.net` | ⚠️ Opcional |

**Nota**: Se não configurar os e-mails, serão usados os valores padrão do script.

#### Como Adicionar Variáveis:

```
1. Clique em "Add a variable"
2. Key: SUPABASE_URL
3. Values: Selecione "Same value for all deploy contexts"
4. Value: https://bxvlfxawfwfqgsyipgyr.supabase.co
5. Clique em "Create variable"

Repita para cada variável.
```

### 5️⃣ Deploy!

1. Clique em: **"Deploy site"**
2. Aguarde o build (leva cerca de 1-2 minutos)
3. Seu site estará no ar! 🎉

---

## 🔧 Como Funciona

### Durante o Build:

1. Netlify clona seu repositório
2. Executa `npm run build`
3. O script `generate-config.js` é executado
4. Um novo `config.js` é criado usando as variáveis de ambiente
5. O site é publicado com o `config.js` gerado

### Arquivo Gerado:

O `config.js` gerado terá esta estrutura:

```javascript
window.APP_CONFIG = {
  supabaseUrl: 'https://bxvlfxawfwfqgsyipgyr.supabase.co',
  supabaseAnonKey: 'sua-chave-do-netlify',
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
  // ... resto da configuração
};
```

---

## 🔒 Segurança

### ✅ O Que Está Seguro:

- ✅ `config.js` não está no GitHub
- ✅ Credenciais são injetadas apenas durante o build
- ✅ Variáveis de ambiente são privadas no Netlify
- ✅ Apenas você e colaboradores podem ver as variáveis

### ⚠️ Nota sobre a Chave Anon:

A chave `anon` do Supabase é **pública por design**. Ela é protegida por:
- Row Level Security (RLS) no Supabase
- Políticas de autenticação
- Restrições de domínio

Mesmo estando no código JavaScript público, ela não compromete a segurança se o RLS estiver configurado corretamente.

---

## 🌐 Domínio Personalizado (Opcional)

Após o deploy, você pode configurar um domínio personalizado:

1. Vá em: **Site settings** → **Domain management**
2. Clique em: **Add custom domain**
3. Siga as instruções para configurar DNS

---

## 🔄 Atualizações Futuras

Sempre que você fizer `git push` para o branch `main`, o Netlify:

1. Detecta a mudança automaticamente
2. Faz rebuild do site
3. Publica a nova versão

**Você não precisa fazer nada!** 🎉

---

## 🐛 Solução de Problemas

### Build falha com "config.js not found"

**Solução**: Verifique se:
1. As variáveis de ambiente estão configuradas
2. O build command está correto: `npm run build`
3. O arquivo `generate-config.js` existe no repositório

### Site carrega mas não conecta ao Supabase

**Solução**: Verifique se:
1. `SUPABASE_URL` está correto
2. `SUPABASE_ANON_KEY` está correto
3. Abra o DevTools (F12) e verifique o Console por erros

### Login de publicadores não funciona

**Solução**: Verifique se:
1. Os e-mails `PAULO_EMAIL` e `ANGELICA_EMAIL` estão corretos
2. Os usuários existem no Supabase Authentication
3. As senhas estão corretas

---

## 📞 Suporte

Se tiver problemas:

1. Verifique os **logs de build** no Netlify
2. Verifique o **Console do navegador** (F12)
3. Verifique as **variáveis de ambiente** estão todas configuradas

---

## 🎉 Seu Blog Está Pronto!

Depois do deploy bem-sucedido, você terá:

- ✅ URL pública do Netlify (ex: `https://seu-site.netlify.app`)
- ✅ HTTPS automático
- ✅ CDN global
- ✅ Deploy automático a cada push
- ✅ Credenciais seguras

**Parabéns! Seu blog filosófico está no ar!** 🚀📚
