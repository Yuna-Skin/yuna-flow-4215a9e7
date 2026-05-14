# Plano LGPD do Yuna

## 1. Banco de dados (Supabase)

Nova tabela `user_consents` para registrar cada aceite (histórico, não substitui versões antigas):

| Campo | Tipo | Função |
|---|---|---|
| id | uuid | PK |
| user_id | uuid | dona do aceite |
| accepted_terms | boolean | aceite dos Termos |
| accepted_privacy | boolean | aceite da Política |
| terms_version | text | ex: "v1.0" |
| privacy_version | text | ex: "v1.0" |
| accepted_at | timestamptz | data/hora |
| ip_address | text | prova adicional |
| user_agent | text | prova adicional |

RLS: usuária só lê os próprios consentimentos; insert via server function (para capturar IP/user-agent reais — não dá pra confiar no cliente).

Constantes versionadas em `src/lib/legal-versions.ts`:
```ts
export const TERMS_VERSION = "v1.0";
export const PRIVACY_VERSION = "v1.0";
```
Quando você atualizar os textos, sobe a versão → app detecta que o último aceite está desatualizado → exibe modal de re-aceite.

## 2. Páginas legais (rotas públicas)

Três rotas novas, acessíveis sem login:
- `/termos-de-uso`
- `/politica-de-privacidade`
- `/politica-de-cookies`

Cada uma com layout limpo, mobile-first, com data da última atualização e número de versão visível no topo. Conteúdo virá dos rascunhos (ver seção 5).

## 3. Cadastro (`/auth`)

No modo "criar conta", adicionar **dois checkboxes desmarcados**:
- ☐ Li e aceito os [Termos de Uso](/termos-de-uso)
- ☐ Li e aceito a [Política de Privacidade](/politica-de-privacidade)

Botão "Criar conta" fica desabilitado até os dois estarem marcados. Após signUp bem-sucedido, chama server function `recordConsent` que salva em `user_consents` com IP/user-agent extraídos do request.

## 4. Usuárias antigas (modal bloqueante)

Componente `LegalGate` no layout `_authenticated.tsx`:
- Ao montar, busca último consentimento da usuária
- Se não existe OU `terms_version` / `privacy_version` < versão atual → exibe `Dialog` não-fechável
- Modal mostra resumo + links pras páginas + os mesmos dois checkboxes + botão "Aceitar e continuar"
- Enquanto não aceita, app inteiro fica bloqueado (overlay)
- Botão secundário "Sair" pra dar opção de logout

## 5. Rascunhos jurídicos + lista pro advogado

Vou gerar três arquivos `.md` em `/mnt/documents/`:
- `yuna-termos-de-uso-v1.md`
- `yuna-politica-de-privacidade-v1.md`
- `yuna-politica-de-cookies-v1.md`

Cobrindo: produto, elegibilidade 18+, conta, pagamento via Ticto, licença pessoal, propriedade intelectual, **isenção médica** (crítico), variação de resultados, cancelamento, foro Brasil, dados coletados (nome, email, progresso, avatar), finalidade, compartilhamento (Supabase, Ticto), direitos LGPD, segurança, contato do DPO.

Junto, um arquivo `yuna-checklist-advogado.md` com a lista exata de pontos pro advogado revisar/preencher (CNPJ, razão social, endereço, email do DPO, política de reembolso específica, jurisdição, etc.).

## 6. Ordem de implementação

1. Migration: tabela `user_consents` + RLS + policies
2. Server function `recordConsent` (captura IP/UA)
3. Constantes de versão + helper `getLatestConsent`
4. Páginas `/termos-de-uso`, `/politica-de-privacidade`, `/politica-de-cookies` com rascunhos
5. Checkboxes + validação no `/auth` (modo signup)
6. `LegalGate` modal no `_authenticated.tsx`
7. Gerar os três `.md` + checklist do advogado em `/mnt/documents/`

## Fora deste plano (decisões já tomadas)
- Sem banner de cookies por enquanto (você confirmou que ainda não tem analytics/pixels)
- Política de Cookies fica como página informativa simples
- Quando adicionar Google/Meta no futuro, voltamos pra colocar banner de consentimento
