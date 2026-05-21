# Dark Mode "Wine Luxo" — aplicabilidade

## Veredito: 100% aplicável, e é a melhor escolha pro app

A paleta vinho/rosa/pêssego que você usou na hero da landing é **a evolução natural** do light mode atual do app (que já é pêssego + rosa em fundo creme). Não é um dark genérico cinza — é o mesmo DNA da marca, escurecido. Mantém a alma "wellness feminino premium" sem virar um app frio de produtividade.

A base técnica também ajuda: o `src/styles.css` já tem o bloco `.dark` definido com todos os tokens semânticos, e os componentes usam tokens (`bg-background`, `text-foreground`, etc.). Só precisamos **trocar os valores do `.dark`** pela paleta da hero e ajustar alguns utilitários "crus".

## O que entra do design system da landing

**Cores**
- Background base: `#1a0710 → #2a0a18 → #0c0306` (vinho profundo)
- Glow rosa nos cantos: `rgba(244, 114, 162, 0.35)` e `rgba(120, 20, 50, 0.6)`
- Acentos: rosa `#F47299` / `#FFB3C8` + pêssego `#FF8A3D` (mantém o primary atual)
- CTA dark: gradiente `#FF4D7E → #C71E5C` (substitui o `bg-cta-dark` preto)
- Texto gradiente: `text-gradient-pink` pra títulos/destaques

**Tipografia**
- Manter Inter no app (não trocar pra Instrument Serif — a landing é venda, o app é uso diário; serif vira ruído em telas densas)
- Opcional: Instrument Serif só em headlines grandes (ex: nome do dia, hero do Plus)

**Visual**
- `glass-dark`: `rgba(255,255,255,0.04)` + border `rgba(255,255,255,0.08)` + blur — substitui o `.glass` branco no dark
- Aura/glow radial atrás de elementos heroicos (cards do Plus, foto do dia)
- Border sutil claro em vez de sombras pretas (sombra preta some no dark)

## Plano de execução (2 entregas)

### Entrega 1 — Infra + tokens (1h)

1. **Theme provider** (`src/lib/theme.tsx`)
   - Context com `theme: 'light' | 'dark' | 'system'`
   - Persistência em `localStorage` (`yuna-theme`)
   - Aplica/remove classe `dark` no `<html>`
   - Respeita `prefers-color-scheme` quando `system`
   - Atualiza meta `theme-color` dinamicamente (`#FCDFC9` claro / `#1a0710` escuro)
   - Wrap em `__root.tsx` dentro do `AuthProvider`

2. **Reescrever o bloco `.dark` em `src/styles.css`** com a paleta vinho:
   - `--background`: `oklch` equivalente a `#1a0710`
   - `--surface`, `--card`, `--popover`: tons de `#2a0a18`
   - `--surface-muted`: vinho um pouco mais claro
   - `--foreground`: `#F5E8EC` (rosa muito claro, não branco puro)
   - `--muted-foreground`: rosa dessaturado
   - `--primary`: manter pêssego `#FF8A3D` (boa legibilidade em vinho)
   - `--secondary`: rosa `#F47299`
   - `--accent`: vinho médio
   - `--border`: `rgba(255,255,255,0.08)`
   - `--ring`: rosa `#F47299`

3. **Adicionar utilitários dark-aware no `styles.css`**:
   - `.mobile-shell` ganha variante dark com o gradiente `bg-hero-wine`
   - `.bg-screen` idem
   - `.glass`, `.glass-nav` ganham fallback dark (`rgba(255,255,255,0.04)` + border clara)
   - Trazer `.glass-dark`, `.text-gradient-pink`, `.bg-cta-pink` da landing

4. **Toggle em `/settings`** (já existe a rota)
   - Card "Aparência" com 3 opções: Claro / Escuro / Sistema
   - Ícones Sun/Moon/Monitor

### Entrega 2 — QA tela a tela (1h)

Passar por: home, day/$dayId, plus, shop, profile, community, settings, auth, recuperar-senha, legais, admin/moderation.

Ajustes esperados:
- `BottomNav`: `border-black/[0.06]` → token; sombra preta → glow rosa sutil
- `Card`: já usa tokens, só validar contraste
- Componentes com `text-white`, `bg-black/X` hardcoded → trocar por tokens
- Thumbs do Cloudinary: validar se ficam ok em fundo vinho (provavelmente sim, já são fotos com fundo claro contrastante)
- `AudioModulePlayer`: validar player no dark
- `LegalGate` overlay: validar legibilidade

## Riscos / decisões pendentes

1. **Fotos**: as miniaturas de dias/módulos foram pensadas pra fundo claro. No vinho elas viram "ilhas brancas" — pode ficar elegante (efeito "polaroid sobre veludo") ou destoar. Decidir no QA: se destoar, aplicamos um leve overlay ou borda rosa pra integrar.
2. **Default**: o app abre em qual modo na primeira visita? Sugiro `system` (respeita o OS do usuário).
3. **Plus/Shop**: essas telas têm mais "venda" e podem usar `text-gradient-pink` + `bg-cta-pink` direto, ficando mais próximas da landing. Vale o reforço visual.

## Resumo

Dificuldade real: **baixa** (~2h total). A escolha estética é forte porque reaproveita um sistema já validado na landing — o usuário vê coerência entre a página de vendas e o app. É upgrade de identidade, não só "modo escuro".