## Fluxo de recuperação de senha por código (OTP)

Substituir o atual link mágico do Supabase por um fluxo com **código de 6 dígitos enviado por e-mail**, em 3 passos numa única página `/recuperar-senha` (mais simples no PWA, sem depender de abrir link em outro navegador).

### Passo a passo (UX)

```
[1. E-mail]  →  [2. Código de 6 dígitos]  →  [3. Nova senha + confirmação]  →  Redireciona pro app logado
```

1. **E-mail de compra**
   - Campo de e-mail + botão "Enviar código"
   - Chama `supabase.auth.resetPasswordForEmail(email)` — o Supabase envia um e-mail contendo um token OTP de 6 dígitos
   - Mensagem genérica de sucesso ("Se este e-mail existir, enviaremos um código") para não vazar quais e-mails estão cadastrados

2. **Verificação do código**
   - 6 inputs / campo único de 6 dígitos
   - Chama `supabase.auth.verifyOtp({ email, token: codigo, type: 'recovery' })`
   - Se válido, cria uma sessão de recuperação automaticamente e avança
   - Link "Reenviar código" com cooldown de 60s

3. **Nova senha**
   - Campos: nova senha (8+ caracteres, 1 número) + confirmar senha
   - Chama `supabase.auth.updateUser({ password })`
   - Toast de sucesso e `navigate({ to: "/" })` (usuário já está logado)

### Mudanças técnicas

- **Substituir** `src/routes/reset-password.tsx` (fluxo de link mágico criado antes) por `src/routes/recuperar-senha.tsx` com os 3 passos controlados por estado (`step: "email" | "code" | "password"`).
- **Atualizar** `src/routes/auth.tsx`: o link "Esqueceu a senha?" passa a apontar para `/recuperar-senha` em vez de chamar `resetPasswordForEmail` inline.
- **Customizar template de e-mail de recovery do Supabase** para incluir o código `{{ .Token }}` em destaque (em vez do `{{ .ConfirmationURL }}` padrão). Isso pode ser feito de 2 formas:
  - **Opção A (rápida):** editar o template "Reset Password" no painel Supabase → Authentication → Email Templates, trocando para algo como:
    ```
    Seu código de recuperação Yuna Skin: {{ .Token }}
    Ele expira em 1 hora.
    ```
  - **Opção B (branding completo):** scaffoldar templates auth do Lovable (`auth-email-hook`) com layout Yuna Skin (logo, cor `#FCDFC9`, fontes). Requer domínio de e-mail configurado.

### Considerações de segurança

- Mensagem genérica no passo 1 (não confirma se e-mail existe)
- Rate limiting: o Supabase já limita `resetPasswordForEmail` por padrão; tratamos o erro `over_email_send_rate_limit` com mensagem amigável
- Código expira em ~1h (config padrão Supabase)
- Validação client + server da senha (mínimo 8 chars + 1 número)
- Após sucesso, log de auditoria `password_reset` via `logAuditEvent`

### Decisões que preciso confirmar

1. **Template de e-mail:** Opção A (editar no painel Supabase, rápido) ou Opção B (scaffold branded completo)?
2. **Texto da página inicial:** mantenho "Recuperar senha" ou prefere "Já comprei, quero acessar" (mais alinhado com o contexto de quem comprou e ainda não entrou)?
3. **Para usuários que **nunca** fizeram login** (compraram mas não acessaram): este fluxo funciona igual? Sim, desde que o e-mail da compra já tenha sido cadastrado no Supabase Auth no momento da venda. Se o cadastro é feito só na primeira entrada, precisamos definir esse outro fluxo também.
