## Integração Ticto via Webhook

### Visão geral
Endpoint público no app recebe eventos da Ticto, valida assinatura, e libera/revoga acesso em `access_control` por email. Compras sem cadastro ficam pendentes e são liberadas automaticamente quando o usuário se cadastra com o mesmo email.

### Mudanças no banco

**Nova tabela `pending_purchases`** — guarda compras de emails que ainda não têm conta:
- `email` (texto, indexado)
- `status` (`active` | `refunded` | `chargeback` | `canceled`)
- `ticto_order_id` (único, evita duplicar)
- `product_id`, `payload` (jsonb com o evento bruto pra auditoria)
- RLS: só admin lê/escreve

**Nova tabela `ticto_webhook_events`** — log de todo evento recebido (idempotência + debug):
- `ticto_event_id` (único), `event_type`, `payload`, `processed_at`, `error`
- RLS: só admin

**Ajuste em `access_control`**:
- Adicionar coluna `ticto_order_id` (texto, nullable) — referência pra revogar quando vier refund/chargeback
- Manter `source` (já existe) — usar `'ticto'` quando vier de compra

**Ajuste em `handle_new_user` trigger**:
- Quando um novo user se cadastra, checar `pending_purchases` por email e, se houver registro `active`, criar entrada em `access_control` com `has_access=true, source='ticto'` em vez do default

### Endpoint do webhook

`src/routes/api/public/ticto-webhook.ts` (server route, POST):

1. Lê body como texto cru
2. Valida assinatura usando `TICTO_WEBHOOK_TOKEN` (HMAC ou token simples, depende do que a Ticto manda — confirmar no painel)
3. Parseia payload com Zod
4. Idempotência: se `ticto_event_id` já existe em `ticto_webhook_events`, retorna 200 sem reprocessar
5. Roteia por `event_type`:
   - `purchase_approved` / `subscription_renewed` → libera acesso
   - `purchase_refunded` / `chargeback` / `subscription_canceled` → revoga acesso
6. Pra liberar: busca user por email em `auth.users`; se existe, upsert em `access_control`; se não, upsert em `pending_purchases`
7. Pra revogar: update em `access_control` (`has_access=false`) por `ticto_order_id`; também marca `pending_purchases` se aplicável
8. Registra em `ticto_webhook_events` com `processed_at` (ou `error` se falhou)
9. Sempre retorna 200 rápido (a Ticto reenvia se receber erro)

### Secret necessário

`TICTO_WEBHOOK_TOKEN` — o token de segurança que a Ticto manda nos headers. Você pega no painel da Ticto ao configurar o webhook. Vou pedir via tool de secret quando chegar a hora.

### URL pra colar na Ticto

```
https://yuna-flow.lovable.app/api/public/ticto-webhook
```
(URL estável, sobrevive a renames)

### Admin / observabilidade (opcional, fase 2)

- Página `/admin/purchases` lista últimos eventos de `ticto_webhook_events` e `pending_purchases` (pra você ver se algo falhou)
- Botão "reprocessar" num evento com erro

### Ordem de execução

1. Migration: criar `pending_purchases`, `ticto_webhook_events`, adicionar `ticto_order_id` em `access_control`, atualizar trigger `handle_new_user`
2. Criar o endpoint `src/routes/api/public/ticto-webhook.ts` com validação Zod + assinatura + roteamento de eventos
3. Pedir o secret `TICTO_WEBHOOK_TOKEN`
4. Te passar a URL pra colar no painel da Ticto + instrução de mandar um evento de teste
5. (Fase 2, se quiser) página de admin

### Pontos que preciso confirmar com você antes/durante

- **Nome exato dos eventos da Ticto** que você quer tratar (purchase_approved, refund, chargeback, subscription_canceled?). Posso assumir os mais comuns e você ajusta depois.
- **Como a Ticto assina o webhook** — alguns gateways mandam HMAC no header `x-signature`, outros mandam um token fixo no body. Vou precisar dar uma olhada no formato real do payload deles. Se você tiver o link da doc da Ticto sobre webhook, melhor ainda.
- **Tem mais de um produto?** Se sim, faz sentido guardar qual produto foi comprado e diferenciar acesso (ex: produto X → acesso ao programa Y). Por ora vou assumir "acesso geral on/off" como hoje.