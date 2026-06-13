# Versão iPad — camada aditiva sobre o mobile

## Princípio inviolável

**Nada que renderiza abaixo de 768px muda.** Todo CSS, todo componente novo e toda classe Tailwind nova vivem atrás de `md:` (≥768px) ou `useIsMobile() === false`. Se alguma regressão aparecer no mobile, é bug e voltamos atrás — não é "trade-off aceitável".

## O que vai ser construído

### 1. Shell adaptativo (`src/styles.css`)
- `.mobile-shell` continua exatamente como está (max-width 430px, gradientes, sombras) abaixo de 768px.
- Adicionar bloco `@media (min-width: 768px)` que, **só nesse range**, remove o `max-width`, ajusta `app-shell` pra layout `grid-cols-[260px_1fr]` (sidebar + conteúdo) e amplia `app-shell-main` pra ocupar a área da direita com padding generoso e `max-width` interno de ~960px pra leitura confortável.
- Funciona em retrato (768px) e paisagem (1024px+) do iPad com o mesmo grid; em paisagem o conteúdo só respira mais.

### 2. Nova `SideNav` (`src/components/SideNav.tsx`)
- Sidebar fixa à esquerda com logo Yuna no topo, 4 itens (Início, Plus, Loja, Perfil) com mesmos ícones do `BottomNav`, item ativo destacado.
- Estética alinhada ao app: glass, bordas suaves, tipografia display, gradientes da paleta atual (`bg-screen`, peach/pink).
- Footer da sidebar: avatar do usuário + atalho pra Settings.

### 3. Renderização condicional (`src/routes/_authenticated.tsx`)
- Usar `useIsMobile()` (já existe) pra escolher: `<BottomNav />` se mobile, `<SideNav />` se ≥768px.
- O `BottomNav` simplesmente **não monta** em iPad — zero risco de afetar mobile.
- Estrutura do `AuthenticatedLayout` ganha um wrapper que vira grid em `md:`.

### 4. Grids responsivos nas telas principais
Adicionar classes `md:` (aditivas) em:
- **Home** (`_authenticated.index.tsx`): cards de progresso/dia em 2 colunas em iPad.
- **Plus** (`_authenticated.plus.tsx`): módulos lado a lado.
- **Shop** (`_authenticated.shop.tsx`): grid de produtos 2–3 colunas.
- **Perfil** (`_authenticated.profile.tsx`): bio/stats à esquerda, lista de atividades à direita.
- **Day** (`_authenticated.day.$dayId.tsx`): player + transcrição/instruções lado a lado.
- **Community, Settings, Moderation**: 2 colunas onde fizer sentido (lista + detalhe).

Em todos os casos: o markup mobile permanece padrão; classes `md:grid md:grid-cols-2 md:gap-6` etc. ativam só acima de 768px.

### 5. PWA manifest (`public/manifest.webmanifest`)
- Manter ícones existentes.
- Adicionar bloco `screenshots` com `form_factor: "wide"` (iPad) e `"narrow"` (mobile) pra o iPadOS mostrar preview correto na instalação. Screenshots são opcionais, sem isso o app ainda instala normal — adicionamos como polish.

### 6. Orientação
- Remover a fixação `orientation: "portrait"` do manifest **somente** quando viewport ≥768px? Não dá pra fazer isso por CSS — manifest é estático. Decisão: **trocar `"orientation": "portrait"` por `"orientation": "any"`** no manifest. Isso libera paisagem no iPad. No mobile, a rotação continua existindo no SO mas o layout mobile já é responsivo dentro de 430px, então retrato ou paisagem o conteúdo continua centralizado e legível (mesmo comportamento de hoje quando o usuário gira o celular).

## O que NÃO vai mudar

- Nenhum componente existente é deletado ou reescrito.
- Nenhuma classe Tailwind existente é removida.
- Nenhum estilo de `.mobile-shell`, `.app-shell`, `.app-shell-main`, `glass`, `bg-screen`, `BottomNav`, gates (`LegalGate`, `PaymentGate`), auth, rotas, queries, server functions.
- Nenhum breakpoint abaixo de `md:` (768px) é tocado.

## Como vou validar antes de entregar

1. Preview em mobile (375×812): screenshot e confirmar que está **pixel-idêntico** ao atual em Home, Plus, Shop, Perfil, Day.
2. Preview em iPad retrato (820×1180): sidebar à esquerda, conteúdo respirando, grids de 2 colunas.
3. Preview em iPad paisagem (1180×820): mesmo layout, mais largura útil.
4. Conferir BottomNav **não aparece** em iPad e SideNav **não aparece** em mobile.

## Detalhes técnicos

- `useIsMobile()` já existe em `src/hooks/use-mobile.tsx` com breakpoint 768px — reaproveitar (no SSR retorna `false` no primeiro render; isso é aceitável porque o layout mobile-shell já funciona como fallback visual).
- Para evitar flash de sidebar em mobile durante hidratação, complementar a renderização condicional JS com CSS: `SideNav` recebe `hidden md:flex` e `BottomNav` recebe `md:hidden`. Assim mesmo antes do JS hidratar, a mídia query decide corretamente. O `useIsMobile()` vira só uma otimização de árvore React, não a fonte de verdade visual.
- Não vou usar o `shadcn/ui sidebar` component (pesado, traz Provider próprio que conflitaria com o layout `app-shell` atual). Vou escrever uma `SideNav` enxuta com o mesmo padrão visual do `BottomNav`.

## Arquivos tocados

Novos:
- `src/components/SideNav.tsx`

Editados (somente adições `md:` ou bloco `@media min-width: 768px`):
- `src/styles.css`
- `src/routes/_authenticated.tsx`
- `src/routes/_authenticated.index.tsx`
- `src/routes/_authenticated.plus.tsx`
- `src/routes/_authenticated.shop.tsx`
- `src/routes/_authenticated.profile.tsx`
- `src/routes/_authenticated.day.$dayId.tsx`
- `src/routes/_authenticated.community.tsx`
- `src/routes/_authenticated.settings.tsx`
- `public/manifest.webmanifest` (orientação + screenshots opcionais)

Sem migrations, sem mudanças de schema, sem mexer em auth/gates/server functions.
