
# Fase B — Migração de auth para cookies com `@supabase/ssr`

> **STATUS: CONCLUÍDA.** B.0–B.5 aplicadas. B.6 parcial: `auth-attacher.ts` removido; bearer fallback mantido em `auth-middleware.ts` e `start.ts` como safety net (cookies podem ser bloqueados em iframes/third-party em alguns browsers). Cookie config final: `sameSite: 'none', secure: true` (necessário pra iframe Lovable). `beforeLoad` usa `getSession()` (tolera storage bloqueado).

## Objetivo

Mover a sessão Supabase de `localStorage` (acessível só no cliente) para **cookies httpOnly** lidos pelo servidor. Isso destrava:

- **SSR real** nas rotas `_authenticated/*` (HTML renderizado já com dados do usuário).
- Remoção dos guards `if (typeof window === "undefined") return;` nos loaders.
- Remoção do hack `attachSupabaseAuth` em `src/start.ts` (cookies vão automaticamente em toda request).
- LCP melhor na Home e Dia (sem flash, sem espera de hidratação).
- Base sólida pra cache de borda no futuro (Cloudflare).

## Princípios de execução

1. **Sub-fases pequenas e independentes.** Cada uma é um commit isolado, validável em preview, e reversível sem desfazer as anteriores.
2. **Paralelismo controlado.** Clients novos coexistem com os antigos até a migração estar validada — nunca trocamos tudo de uma vez.
3. **Critério de aceite escrito antes de cada sub-fase.** Se não passa, reverte.
4. **Rota piloto antes do resto.** Validamos o padrão numa rota de baixo tráfego (`/profile`) antes de mexer em Home/Dia.
5. **Sessões existentes não são quebradas.** Usuários logados hoje (via localStorage) precisam migrar pra cookie sem ser deslogados — ou, se inevitável, com mensagem clara.

---

## Sub-fase B.0 — Diagnóstico e instalação (spike, sem mudança funcional)

**Objetivo:** instalar `@supabase/ssr`, mapear tudo que toca auth, garantir build verde.

**Ações:**
1. `bun add @supabase/ssr` (mantém `@supabase/supabase-js` — `@supabase/ssr` depende dele).
2. Inventariar arquivos que tocam auth, com nota do que cada um faz:
   - `src/integrations/supabase/client.ts` — browser client (localStorage)
   - `src/integrations/supabase/client.server.ts` — admin (service role)
   - `src/integrations/supabase/auth-middleware.ts` — server fn middleware (lê bearer header)
   - `src/integrations/supabase/auth-attacher.ts` — anexa bearer em server fns
   - `src/lib/auth.tsx` — AuthProvider (React context)
   - `src/start.ts` — registra `attachSupabaseAuth`
   - `src/routes/_authenticated.tsx` — `beforeLoad` que chama `getSession()`
   - Todos os loaders das rotas `_authenticated/*` com guard `typeof window`
3. Validar: `bun run build` passa, app continua funcionando idêntico.

**Critério de aceite:**
- [ ] Build sem erros
- [ ] Login/logout/refresh funcionam igual
- [ ] Nada em uso real do `@supabase/ssr` ainda (só instalado)

**Rollback:** `bun remove @supabase/ssr`.

---

## Sub-fase B.1 — Browser client com cookies (sem tocar no servidor)

**Objetivo:** trocar persistência do AuthProvider de localStorage pra **cookies** via `createBrowserClient` do `@supabase/ssr`. O servidor ainda não lê cookie nenhum — só preparamos o cliente.

**Decisões arquiteturais:**
- Usar `createBrowserClient` (não `createClient`). API idêntica, persistência diferente.
- Cookie config: `sameSite: 'lax'`, `secure: true` em prod, `path: '/'`, sem `domain` explícito (deixa o browser inferir — funciona com subdomínio do preview).
- Cookie **não pode ser httpOnly** no browser (o JS precisa ler/escrever). HttpOnly só faz sentido se o cookie for setado pelo servidor — que é o passo B.2.
- Substituir `src/integrations/supabase/client.ts` (mantém o mesmo export `supabase`, mesma API consumida pelos componentes).

**Ações:**
1. Reescrever `src/integrations/supabase/client.ts` usando `createBrowserClient<Database>` com cookie storage.
2. Adicionar migration de sessão: ao boot, se existir sessão em `localStorage` (chave antiga `sb-<ref>-auth-token`), ler e re-setar via `supabase.auth.setSession()` (que agora persiste em cookie), depois limpar localStorage. Sem isso, todo usuário logado hoje é deslogado.
3. Validar em preview:
   - Usuário novo: login → cookie aparece em DevTools → reload → continua logado
   - Usuário antigo (simulado): seed localStorage com token válido → reload → migra pra cookie e fica logado
   - Logout limpa cookie

**Critério de aceite:**
- [ ] Cookie `sb-<ref>-auth-token` visível em DevTools após login
- [ ] localStorage não contém mais token Supabase
- [ ] `onAuthStateChange` continua disparando (AuthProvider funciona)
- [ ] Usuários antigos não são deslogados (script de migração validado)

**Rollback:** reverter `client.ts` pra versão anterior. Cookie fica órfão mas inofensivo.

---

## Sub-fase B.2 — Server client + middleware que lê cookie

**Objetivo:** criar o client de servidor que lê sessão do cookie da request HTTP. Sem usar ainda em loader nenhum — só infraestrutura.

**Decisões arquiteturais:**
- Novo arquivo `src/integrations/supabase/server-client.ts` exportando `createSupabaseServerClient(request, response)` usando `createServerClient` do `@supabase/ssr`.
- Cookie adapter usa `getCookie`/`setCookie`/`deleteCookie` do `@tanstack/react-start/server`.
- Refatorar `auth-middleware.ts` (`requireSupabaseAuth`) pra:
  - **Primeiro** tentar ler cookie (caminho novo, SSR real)
  - **Fallback** pro bearer header (caminho antigo, mantém compatibilidade durante migração)
  - Isso permite migrar uma rota por vez sem quebrar as outras.

**Ações:**
1. Criar `src/integrations/supabase/server-client.ts`.
2. Atualizar `auth-middleware.ts` com lógica cookie-first + bearer-fallback.
3. Smoke test: chamar uma server fn protegida existente (`getMyProfile`) — deve continuar funcionando via bearer (rotas ainda não foram migradas).

**Critério de aceite:**
- [ ] Build verde
- [ ] Todas as server fns existentes continuam respondendo 200
- [ ] Log do middleware mostra qual caminho foi usado (cookie ou bearer) — útil pra debug nas próximas fases

**Rollback:** reverter `auth-middleware.ts` e remover `server-client.ts`.

---

## Sub-fase B.3 — Rota piloto: `/profile`

**Objetivo:** primeira rota com SSR real. Escolhida por ser baixo tráfego, dados simples, sem áudio/vídeo signed URL.

**Ações:**
1. Em `src/routes/_authenticated.profile.tsx`:
   - Remover o guard `if (typeof window === "undefined") return;` do loader
   - Loader chama `ensureQueryData` normalmente
2. Em `src/routes/_authenticated.tsx`:
   - Mover validação de sessão pro `beforeLoad` lendo cookie via server fn (`getServerSession()`)
   - Se sem sessão, `throw redirect({ to: "/auth" })`
   - Manter fallback de loading no componente pra UX consistente
3. Validar em preview com 3 cenários:
   - Acesso direto a `/profile` deslogado → redireciona pra `/auth`
   - Acesso direto a `/profile` logado → HTML chega com dados (view source mostra nome do usuário)
   - Login → navegação pra `/profile` → sem flash

**Critério de aceite:**
- [ ] View source de `/profile` (curl com cookie) mostra dados do usuário no HTML
- [ ] Sem flash de skeleton em primeira carga
- [ ] Logout no `/profile` redireciona corretamente
- [ ] Outras rotas (`/`, `/community`, etc.) continuam funcionando via fallback bearer

**Rollback:** reverter os 2 arquivos. Demais rotas não são afetadas.

---

## Sub-fase B.4 — Migrar Home e Dia (alto valor de LCP)

**Objetivo:** ganho perceptível de performance nas rotas mais visitadas.

**Ações:**
1. `_authenticated.index.tsx`: remover guard, validar SSR
2. `_authenticated.day.$dayId.tsx`: idem, atenção especial à signed URL de vídeo/áudio que tem expiração — manter retry on error
3. Medir LCP antes/depois com Lighthouse em preview

**Critério de aceite:**
- [ ] LCP da Home reduz (esperado: 30-50%)
- [ ] Dia abre sem flash, vídeo carrega
- [ ] Marcar dia completo continua invalidando cache corretamente

**Rollback:** reverter rotas individualmente.

---

## Sub-fase B.5 — Migrar rotas autenticadas restantes

**Ações em paralelo (cada uma um commit):**
- `_authenticated.community.tsx`
- `_authenticated.plus.tsx`
- `_authenticated.admin.moderation.tsx`
- `_authenticated.settings.privacy.tsx`
- `_authenticated.settings.tsx`
- `_authenticated.shop.tsx`

Cada uma: remover guard `typeof window`, validar SSR em preview.

**Critério de aceite por rota:**
- [ ] HTML SSR contém dados
- [ ] Mutations continuam funcionando (RLS ok)
- [ ] Admin moderation: `beforeLoad` confere role admin server-side

---

## Sub-fase B.6 — Limpeza final

**Objetivo:** remover andaimes da migração.

**Ações:**
1. Remover fallback bearer do `auth-middleware.ts` (só cookie agora)
2. Remover `auth-attacher.ts` e referência em `src/start.ts`
3. Remover script de migração localStorage → cookie do `client.ts` (após ~30 dias em produção, todos os usuários ativos já migraram)
4. Atualizar `mem://index.md` removendo a nota sobre guard `typeof window`
5. Atualizar `.lovable/plan.md` marcando Fase B como concluída

**Critério de aceite:**
- [ ] Nenhum `if (typeof window === "undefined")` em loaders
- [ ] Nenhum `functionMiddleware: [attachSupabaseAuth]` em `start.ts`
- [ ] Build verde, todas as rotas funcionando

---

## Detalhes técnicos críticos

### Cookie size

JWT do Supabase tem ~1-2KB. `refresh_token` adiciona ~200B. Total cabe nos 4KB de limite de cookie único. Se ultrapassar (raro), `@supabase/ssr` faz chunking automático (`sb-<ref>-auth-token.0`, `.1`).

### Cache do Cloudflare

Páginas autenticadas **não podem** ser cacheadas pelo edge. Adicionar no response header das rotas `_authenticated`:
```
Cache-Control: private, no-store
```
Configurar em `__root.tsx` ou via response middleware.

### Race condition login → primeiro request

Padrão conhecido. Solução: após login bem-sucedido, fazer **server-side redirect** (não client-side `navigate`). O redirect carrega o cookie setado na response do login, garantindo que o próximo request já tem sessão server-side.

### Realtime / onAuthStateChange

`createBrowserClient` mantém compatibilidade total. `onAuthStateChange` continua funcionando, subscriptions Supabase Realtime continuam funcionando.

### Preview vs Produção

- Preview: `*.lovable.app` — cookie funciona normal (mesmo domínio)
- Produção: `yuna-flow.lovable.app` — idem
- Custom domain (futuro): cookie precisa ser setado com `domain` correto. Adicionar lógica condicional se/quando custom domain for adicionado.

### Testes manuais por sub-fase (checklist obrigatório)

Cada sub-fase precisa passar nestes cenários antes de seguir:

1. **Login novo** (email + senha) → funciona, redireciona, dados aparecem
2. **Reload da página logado** → continua logado, dados aparecem
3. **Logout** → cookie limpo, redireciona pra `/auth`
4. **Tab múltipla**: login em uma tab → outra tab detecta via `onAuthStateChange`
5. **Token expirado**: simular expiração → refresh automático funciona
6. **Sem rede**: erro tratado graciosamente
7. **Usuário não autorizado em rota admin**: redirecionado/bloqueado

---

## Riscos e mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Usuários logados deslogados na B.1 | Média | Alto | Script de migração localStorage→cookie validado em preview com sessão seed |
| Cookie não setado em SSR primeira carga | Média | Médio | Server redirect após login, não client navigate |
| Cloudflare cacheando HTML autenticado | Baixa | Crítico | `Cache-Control: private, no-store` em rotas auth |
| `@supabase/ssr` quebra no Workers runtime | Baixa | Alto | Validar na B.0 com smoke test antes de continuar |
| Race no `beforeLoad` server-side | Média | Médio | Usar `getUser()` (valida token) não `getSession()` (só lê) |
| Admin moderation pulando check de role | Baixa | Crítico | `beforeLoad` server-side com `has_role()`, RLS como backstop |

---

## Cronograma sugerido

| Sub-fase | Tempo estimado | Reversibilidade |
|---|---|---|
| B.0 Spike | 15 min | Trivial |
| B.1 Browser cookie | 45 min | Fácil |
| B.2 Server client | 30 min | Fácil |
| B.3 Piloto /profile | 30 min | Fácil |
| B.4 Home + Dia | 45 min | Por rota |
| B.5 Resto | 60 min | Por rota |
| B.6 Limpeza | 20 min | Trivial |

**Total:** ~4h de trabalho dividido em 7 commits independentes.

---

## Pontos de decisão pra você antes de começar

1. **Estratégia pra usuários existentes:** migração silenciosa (recomendado) ou forçar relogin com aviso?
2. **Cache-Control:** `private, no-store` em todas as rotas auth (recomendado) ou só nas críticas?
3. **Logs de migração:** quer telemetria de quantos usuários migraram via script (B.1)?

---

## Início proposto

Começo pela **B.0** (spike: instalar pacote + inventário). Reporto build status. Você confirma e seguimos B.1.

Em cada sub-fase eu:
1. Aplico mudanças
2. Rodo o checklist de critério de aceite
3. Reporto status (verde ou problemas encontrados)
4. Espero seu OK pra próxima

Confirma esse plano? Quer ajustar alguma decisão antes de começar?
