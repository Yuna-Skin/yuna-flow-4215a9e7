## Objetivo

Adicionar uma pessoa ao app definindo email + senha manualmente (sem ela ter comprado pela Ticto), e garantir que ela tenha acesso liberado ao conteúdo.

## Por que não precisa de código

O Supabase já oferece tudo nativamente:
- **Authentication → Users → "Add user"** cria a conta com email + senha que você definir.
- O trigger `handle_new_user` que já existe no banco cria automaticamente o `profile` e o `user_streak`.
- Só falta garantir o registro em `access_control` com `has_access = true`.

## Passo a passo (você executa)

### 1. Criar a usuária

1. Abrir **Authentication → Users** no painel do Supabase.
2. Clicar em **"Add user" → "Create new user"**.
3. Preencher:
   - **Email**: o email da pessoa
   - **Password**: a senha que você quer definir (mín. 6 caracteres)
   - **Auto Confirm User**: ✅ marcar (pra ela não precisar confirmar email)
4. Clicar em **Create user**.

Nesse momento o trigger `handle_new_user` roda e:
- Cria o `profile` dela
- Tenta achar uma `pending_purchase` com o mesmo email
  - Se achar (compra Ticto pendente) → libera acesso automático ✅ fim
  - Se não achar → cria `access_control` com `has_access = false` → precisa do passo 2

### 2. Liberar acesso (se ela não tem compra Ticto)

Vou rodar um `UPDATE` em `access_control` marcando `has_access = true` e `source = 'manual'` pra essa usuária. Você só me passa o email depois que criar a conta, e eu rodo a query.

### 3. Entregar pra ela

Você manda pra pessoa:
- URL: `https://app.yunaskin.com.br/auth`
- Email + senha que você criou

Ela entra normalmente pelo fluxo de login que já existe.

## O que NÃO muda

- Nenhum código do app é alterado.
- Nenhuma tabela nova, nenhuma rota nova.
- O fluxo Ticto continua funcionando normalmente pra todo mundo que comprou.

## Próximo passo

Quando você aprovar este plano, eu te aviso pra você criar a conta no painel, e depois disso me passa o email da pessoa pra eu rodar o `UPDATE` em `access_control` liberando o acesso.
