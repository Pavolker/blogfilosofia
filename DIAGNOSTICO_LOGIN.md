# 🔍 Diagnóstico de Problema de Login - Angelica

## ❌ Erro Reportado
**Mensagem**: "Publicador não encontrado. Atualize o config.js com os e-mails corretos."

## 📋 Configuração Atual (config.js)

```javascript
publisherAccounts: {
  PAULO: {
    email: 'pvolker@mdh-hability.com',
    displayName: 'Paulo',
  },
  ANGELICA: {
    email: 'angelica@lacasacreativa.net',
    displayName: 'Angelica',
  },
}
```

## 🔍 Possíveis Causas

### 1. Identificador Digitado Incorretamente
O sistema aceita qualquer variação, mas converte para MAIÚSCULAS:
- ✅ "ANGELICA" → funciona
- ✅ "angelica" → funciona
- ✅ "Angelica" → funciona
- ✅ "ANGÉLICA" → funciona (remove acentos)
- ✅ "angélica" → funciona (remove acentos)
- ❌ "Angelica Sátiro" → NÃO funciona (deve ser apenas ANGELICA)
- ❌ " ANGELICA " → pode ter problema com espaços (trim deveria resolver)

### 2. E-mail no Supabase Diferente do config.js
Se você alterou o e-mail no Supabase Authentication, deve atualizar também no config.js.

**Como verificar:**
1. Acesse Supabase Dashboard → Authentication → Users
2. Procure o usuário da Angelica
3. Verifique se o e-mail é **exatamente**: `angelica@lacasacreativa.net`
4. Se for diferente, atualize o config.js para corresponder

### 3. Problema de Cache do Navegador
O navegador pode estar usando uma versão antiga do config.js.

**Solução:**
1. Pressione `Ctrl+Shift+R` (Windows/Linux) ou `Cmd+Shift+R` (Mac) para recarregar
2. Ou limpe o cache do navegador

### 4. Erro de Sintaxe no config.js
Verifique se não há vírgulas faltando ou sobran do.

**Checklist:**
- ✅ Vírgula após `displayName: 'Angelica',`
- ✅ Vírgula após o fechamento `},` do objeto ANGELICA
- ✅ Sem vírgula após o último item do publisherAccounts

## 🔧 Como Corrigir

### Passo 1: Verificar o E-mail no Supabase
```
1. Abra: https://supabase.com/dashboard/project/bxvlfxawfwfqgsyipgyr
2. Vá em: Authentication → Users
3. Procure: angelica@lacasacreativa.net
4. Anote o e-mail EXATO que está lá
```

### Passo 2: Atualizar config.js (se necessário)
Se o e-mail no Supabase for diferente, edite o config.js:

```javascript
ANGELICA: {
  email: 'EMAIL_EXATO_DO_SUPABASE_AQUI',  // ← Coloque o e-mail correto
  displayName: 'Angelica',
},
```

### Passo 3: Verificar User Metadata no Supabase
O usuário da Angelica no Supabase deve ter metadata configurado:

1. No Supabase, clique no usuário da Angelica
2. Edite "User Metadata"
3. Adicione:
```json
{
  "author": "Angelica",
  "display_name": "Angelica"
}
```

### Passo 4: Testar o Login
1. Digite no campo "Identificação": **ANGELICA** (pode ser qualquer maiúscula/minúscula)
2. Digite a senha do usuário Supabase
3. Clique em "Acessar"

## 🧪 Teste Rápido

Abra o Console do navegador (F12) e cole:

```javascript
// Verificar se o config está carregado
console.log('Config:', window.APP_CONFIG?.publisherAccounts);

// Testar normalização
const normalizeIdentifier = (value) => {
    return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
};

console.log('ANGELICA normalizado:', normalizeIdentifier('ANGELICA'));
console.log('angelica normalizado:', normalizeIdentifier('angelica'));
console.log('Angélica normalizado:', normalizeIdentifier('Angélica'));

// Verificar se encontra o perfil
const key = normalizeIdentifier('ANGELICA');
console.log('Chave:', key);
console.log('Perfil encontrado:', window.APP_CONFIG?.publisherAccounts?.[key]);
```

Se o último console.log mostrar `undefined`, o problema está na configuração do config.js.

## ❓ Perguntas para Diagnóstico

1. **Qual exatamente você digitou no campo "Identificação"?**
   - ( ) ANGELICA
   - ( ) angelica
   - ( ) Angelica
   - ( ) Angélica Sátiro
   - ( ) Outro: _______________

2. **Qual alteração você fez no user da Angelica?**
   - ( ) Mudei o e-mail no Supabase
   - ( ) Mudei o e-mail no config.js
   - ( ) Mudei a senha no Supabase
   - ( ) Mudei o metadata no Supabase
   - ( ) Outro: _______________

3. **O e-mail no Supabase é exatamente** `angelica@lacasacreativa.net`?
   - ( ) Sim
   - ( ) Não, é: _______________

## 📞 Próximos Passos

Responda as perguntas acima para eu poder identificar o problema exato e corrigi-lo.
