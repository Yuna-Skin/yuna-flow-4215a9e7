
# Migração do Yuna para padrão SSR-ready

## Contexto e decisão arquitetural

O app hoje busca dados via `useQuery` direto nos componentes, com skeletons enquanto carrega. O objetivo é migrar para o padrão recomendado pelo TanStack Start: **loaders + `ensureQueryData` + `useSuspenseQuery`**, que entrega navegação mais rápida, sem flash de skeleton em rotas já visitadas, e prepara a base para SSR real.

### Bloqueio importante: sessão em localStorage

O `AuthProvider` atual armazena a sessão Supabase em `localStorage` (padrão do `@supabase/supabase-js`). Isso significa que **o servidor não tem acesso à sessão do usuário** — então loaders de rotas protegidas que tentem chamar `requireSupabaseAuth` no SSR vão receber 401.

Por isso a migração é em duas fases:

- **Fase A (esta migração):** loaders rodam no cliente após hidratação. Não há SSR real para rotas autenticadas, mas ganhamos: cache compartilhado entre navegações, suspense em vez de skeletons manuais, prefetch no hover/touch, código mais limpo e padrão correto.
- **Fase B (futura, opcional):** migrar auth para cookies via `@supabase/ssr` para habilitar SSR real em rotas protegidas. Trabalho grande, fica para depois se métricas justificarem.

**Ganho prático da Fase A:** navegação interna instantânea (cache), código padronizado, preparado para Fase B sem reescrever tudo de novo.

---

## Princípios da migração

1. **Uma rota por vez.** Cada rota migrada é independente e reversível.
2. **Toda rota com loader recebe `errorComponent` + `notFoundComponent`** — obrigatório no TanStack.
3. **Server functions já existentes não mudam** — só passam a ser chamadas via `queryOptions`.
4. **Auth gate continua no componente do `_authenticated.tsx`** — não vamos mover pra `beforeLoad` agora porque sessão está em localStorage.
5. **Skeletons viram `pendingComponent`** — UX igual, código mais limpo.
6. **Quick wins primeiro:** limpeza de Radix órfãs antes de mexer em rotas.

---

## Fases de execução

### Fase 0 — Preparação (baixo risco)

**0.1. Limpar dependências Radix órfãs** (plano #5)
- Verificar com `rg` quais Radix UI components são realmente usados
- Remover do `package.json` os não usados (~20 pacotes)
- Bundle menor, instalação mais rápida

**0.2. Criar diretório `src/lib/queries/`**
- Vai concentrar todos os `queryOptions` reutilizáveis
- Padrão: `home.queries.ts`, `day.queries.ts`, `community.queries.ts`, etc.

**0.3. Criar helpers padrão**
- `src/components/RouteError.tsx` — `errorComponent` reusável padronizado
- `src/components/RouteNotFound.tsx` — `notFoundComponent` reusável
- `src/components/RoutePending.tsx` — `pendingComponent` (skeleton genérico)

---

### Fase 1 — Migrar a Home (`_authenticated.index.tsx`)

Rota mais visível, ganho mais visível. Serve de modelo para as outras.

**Server functions novas a criar** (em `src/lib/home.functions.ts`):
- `getWeeksWithDays()` — retorna semanas + dias (hoje é query Supabase no client)
- `getMyProfile()` — nome + avatar do usuário
- `getMyProgress()` — set de `day_id` completados

Por que mover pro servidor: cliente roda menos JS no boot, RLS validada server-side, prepara terreno pra cache de borda no futuro.

**Arquivo `src/lib/queries/home.queries.ts`:**
- `weeksQueryOptions()`
- `profileQueryOptions(userId)`
- `progressQueryOptions(userId)`

**Mudanças em `_authenticated.index.tsx`:**
1. Adicionar `loader` chamando `ensureQueryData` para as 3 queries (em paralelo)
2. Adicionar `pendingComponent` (skeleton atual)
3. Adicionar `errorComponent` e `notFoundComponent`
4. Trocar `useQuery` por `useSuspenseQuery`
5. Remover bloco `if (loading) return <Skeleton/>` (vira pendingComponent)
6. `audioQ` continua como `useQuery` (depende de `currentDay?.id`, derivado do estado)
7. Adicionar `head().links` com `preload` da thumbnail (LCP)

**Validação após migração:**
- [ ] Home abre sem flash de tela em branco
- [ ] Trocar de aba e voltar não dispara loading
- [ ] Logout → login → home mostra dados corretos do novo usuário
- [ ] Completar um dia → voltar pra home mostra progresso atualizado
- [ ] Áudio toca e expira/renova corretamente
- [ ] Modo erro: simular erro no Supabase, ver `errorComponent` aparecer

---

### Fase 2 — Migrar Dia (`_authenticated.day.$dayId.tsx`)

Segunda rota mais visitada. Tem signed URL de vídeo + áudio, então cuidado com expiração.

**Server functions:**
- `getDayDetail({ dayId })` — dia + exercícios + movimentos com vídeos
- `getPlayableDayAudioUrl` já existe, reaproveitar

**queries:**
- `dayDetailQueryOptions(dayId)`
- `dayAudioQueryOptions(dayId, audioUrl)`

**Mudanças:**
1. Loader com `ensureQueryData` para `dayDetailQueryOptions(params.dayId)`
2. `loaderDeps: ({ params }) => ({ dayId: params.dayId })` se necessário
3. `pendingComponent` + `errorComponent` + `notFoundComponent`
4. Trocar `useQuery` por `useSuspenseQuery`
5. Manter retry de signed URL via `onError` (já implementado)

**Validação:**
- [ ] Abrir dia direto pela URL funciona
- [ ] Voltar pra home e clicar em outro dia não trava
- [ ] Vídeo carrega e re-tenta se signed URL expira
- [ ] Marcar dia como completo invalida cache de home corretamente

---

### Fase 3 — Migrar rotas secundárias (paralelizável)

Pode fazer em qualquer ordem, cada uma é independente:

**3.1. `_authenticated.profile.tsx`**
- Loader: dados do perfil + estatísticas
- Mutations já existentes (atualizar nome/avatar) precisam invalidar query

**3.2. `_authenticated.community.tsx`**
- Loader: lista de posts aprovados
- Likes/comentários continuam como mutations com invalidação otimista

**3.3. `_authenticated.plus.tsx`**
- Loader: conteúdo plus disponível

**3.4. `_authenticated.admin.moderation.tsx`**
- Loader: posts pendentes
- Já precisa de `beforeLoad` checando role admin (pode existir)

**3.5. `_authenticated.settings.privacy.tsx`**
- Loader: consentimentos atuais
- Auditoria continua como mutation

**3.6. `_authenticated.settings.tsx` e `_authenticated.shop.tsx`**
- Rotas simples, podem só ganhar `errorComponent`/`notFoundComponent`

---

### Fase 4 — Rotas públicas (políticas, auth)

**4.1. `auth.tsx`, `politica-de-cookies.tsx`, `politica-de-privacidade.tsx`, `termos-de-uso.tsx`**
- São estáticas, **podem ter SSR real** (sem auth bloqueando)
- Loader devolve versão atual do documento legal
- `head()` com og:title, og:description individuais (SEO ready)
- Erro de SSR aqui é seguro (já mostra erro normal)

---

### Fase 5 — Limpeza final

**5.1. Verificar `defaultPreloadStaleTime`**
- Já está em 30_000 no `router.tsx` — manter ou ajustar para 0 se queremos Query controlar tudo
- Recomendação: deixar em 30_000 (atual) para hover-preloads ficarem instantâneos

**5.2. Remover `useQuery` órfãos**
- Buscar e confirmar que rotas migradas não têm mais `useQuery` para dados de loader

**5.3. Documentar padrão**
- Adicionar nota em `mem://` com o padrão de queries do projeto

---

## Detalhes técnicos importantes

### Padrão de queryOptions

```ts
// src/lib/queries/home.queries.ts
import { queryOptions } from "@tanstack/react-query";
import { getWeeksWithDays, getMyProfile, getMyProgress } from "@/lib/home.functions";

export const weeksQueryOptions = () =>
  queryOptions({
    queryKey: ["weeks-with-days"],
    queryFn: () => getWeeksWithDays(),
    staleTime: 10 * 60_000,
  });

export const profileQueryOptions = (userId: string | undefined) =>
  queryOptions({
    queryKey: ["profile", userId],
    queryFn: () => getMyProfile(),
    enabled: !!userId,
  });
```

### Padrão de loader

```ts
export const Route = createFileRoute("/_authenticated/")({
  loader: ({ context }) => {
    // Fire-and-forget paralelo — não bloqueia render
    context.queryClient.ensureQueryData(weeksQueryOptions());
    context.queryClient.ensureQueryData(profileQueryOptions(userId));
    context.queryClient.ensureQueryData(progressQueryOptions(userId));
  },
  pendingComponent: HomeSkeleton,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  component: HomePage,
});
```

**Problema:** `userId` não está disponível no loader (loader não tem hook de auth). Soluções:

1. **Recomendada:** Loader chama só `weeksQueryOptions()` (não depende de user). Profile e progress permanecem com `useSuspenseQuery` no componente, que dispara após hidratação quando `userId` estiver disponível via `useAuth()`. Para esses, manter `useQuery` com `enabled: !!userId` é OK também — não é o foco do ganho.

2. **Alternativa:** Mover sessão pro router context via `beforeLoad` em `_authenticated.tsx`. Requer leitura assíncrona de `supabase.auth.getSession()` no `beforeLoad`. Mais elegante mas adiciona complexidade.

**Decisão para esta fase:** opção 1. Dados que não dependem de user (lista de semanas, dias, conteúdo plus, etc.) vão via loader. Dados user-scoped continuam via `useQuery` com `enabled`. Quando movermos pra Fase B (cookies), tudo migra junto.

### Auth race condition

Mantemos o padrão atual: `_authenticated.tsx` checa sessão no componente, mostra spinner enquanto `loading`, redireciona pra `/auth` se sem sessão. Não vamos forçar `beforeLoad` agora.

### Server functions e RLS

Todas as novas server functions usam `requireSupabaseAuth` middleware (já implementado). RLS valida acesso. Para dados públicos (lista de semanas), podemos avaliar usar `supabaseAdmin` se houver ganho, mas por ora manter user-scoped.

---

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| `useSuspenseQuery` lança promise no render — pode quebrar componentes sem Suspense boundary | TanStack Router já fornece Suspense via `pendingComponent` |
| Loader roda em SSR sem session → 401 | Para esta fase, loader só chama queries que não dependem de user |
| Serialização: server fn retorna `Set` (progressQ) | Trocar para `string[]` no retorno, converter para `Set` no componente |
| `errorComponent` esquecido = tela branca | Helper compartilhado `RouteError` aplicado em todas |
| Cache desatualizado após mutation | Manter `queryClient.invalidateQueries` nas mutations existentes |
| Bug só aparece em produção | Testar cada fase em preview antes de seguir |

---

## Ordem sugerida de execução

1. **Fase 0** completa (preparação) — 1 sessão
2. **Fase 1** (Home) — 1 sessão, validar tudo antes de seguir
3. **Fase 2** (Dia) — 1 sessão, validar
4. **Fase 3** em lotes de 2 rotas — 2-3 sessões
5. **Fase 4** (rotas públicas com SSR real) — 1 sessão
6. **Fase 5** (limpeza) — 1 sessão

**Total:** ~7-8 sessões pequenas, cada uma reversível.

---

## Início proposto

Começamos pela **Fase 0** completa (limpeza Radix + helpers compartilhados). É baixo risco, prepara terreno, e te dou um relatório do que removi antes de tocar em qualquer rota.

Depois passamos pra **Fase 1 (Home)** que é onde o padrão fica definido. Se ficar bom, replicamos pras outras.

Confirma se posso começar pela Fase 0?
