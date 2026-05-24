import { createFileRoute } from '@tanstack/react-router';
import { timingSafeEqual } from 'node:crypto';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

// Eventos da Ticto que liberam acesso
const GRANT_EVENTS = new Set([
  'purchase_approved',
  'purchase_complete',
  'subscription_renewed',
  'subscription_created',
]);

// Eventos da Ticto que revogam acesso
const REVOKE_EVENTS = new Set([
  'purchase_refunded',
  'refund',
  'chargeback',
  'subscription_canceled',
  'subscription_cancelled',
]);

function pick<T = string>(obj: any, paths: string[]): T | undefined {
  for (const p of paths) {
    const parts = p.split('.');
    let v: any = obj;
    for (const k of parts) v = v?.[k];
    if (v !== undefined && v !== null && v !== '') return v as T;
  }
  return undefined;
}

async function processEvent(payload: any) {
  const eventType = String(
    pick(payload, ['event', 'event_type', 'status', 'type']) ?? 'unknown'
  ).toLowerCase();

  const eventId = String(
    pick(payload, [
      'event_id',
      'id',
      'transaction.hash',
      'order.hash',
      'hash',
      'order_id',
      'transaction_id',
    ]) ?? `${eventType}-${Date.now()}-${Math.random()}`
  );

  const orderId = String(
    pick(payload, [
      'order.hash',
      'transaction.hash',
      'order_id',
      'transaction_id',
      'hash',
      'id',
    ]) ?? eventId
  );

  const email = (
    pick<string>(payload, [
      'customer.email',
      'buyer.email',
      'client.email',
      'email',
      'user.email',
    ]) ?? ''
  ).toLowerCase().trim();

  const productId = pick<string>(payload, [
    'product.id',
    'product_id',
    'item.id',
    'offer.id',
    'offer_id',
  ]);

  // Idempotência
  const { data: existing } = await supabaseAdmin
    .from('ticto_webhook_events')
    .select('id, processed_at')
    .eq('ticto_event_id', eventId)
    .maybeSingle();

  if (existing?.processed_at) {
    return { ok: true, duplicate: true };
  }

  // Insere/atualiza registro do evento
  const { data: eventRow } = await supabaseAdmin
    .from('ticto_webhook_events')
    .upsert(
      { ticto_event_id: eventId, event_type: eventType, payload },
      { onConflict: 'ticto_event_id' }
    )
    .select('id')
    .single();

  try {
    if (!email) {
      throw new Error('email not found in payload');
    }

    const isGrant = GRANT_EVENTS.has(eventType);
    const isRevoke = REVOKE_EVENTS.has(eventType);

    if (!isGrant && !isRevoke) {
      // Apenas registra o evento; nada a fazer
      await supabaseAdmin
        .from('ticto_webhook_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', eventRow!.id);
      return { ok: true, ignored: true, eventType };
    }

    // Tenta achar user pelo email
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const user = userList?.users.find(
      (u) => (u.email ?? '').toLowerCase() === email
    );

    if (isGrant) {
      if (user) {
        await supabaseAdmin.from('access_control').upsert(
          {
            user_id: user.id,
            has_access: true,
            source: 'ticto',
            ticto_order_id: orderId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      } else {
        await supabaseAdmin.from('pending_purchases').upsert(
          {
            email,
            status: 'active',
            ticto_order_id: orderId,
            product_id: productId ?? null,
            payload,
          },
          { onConflict: 'ticto_order_id' }
        );
      }
    } else if (isRevoke) {
      if (user) {
        await supabaseAdmin
          .from('access_control')
          .update({
            has_access: false,
            source: 'ticto',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
      }
      await supabaseAdmin
        .from('pending_purchases')
        .update({ status: 'refunded' })
        .eq('ticto_order_id', orderId);
    }

    await supabaseAdmin
      .from('ticto_webhook_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', eventRow!.id);

    return { ok: true, eventType, email, orderId };
  } catch (err: any) {
    await supabaseAdmin
      .from('ticto_webhook_events')
      .update({ error: String(err?.message ?? err) })
      .eq('id', eventRow!.id);
    throw err;
  }
}

export const Route = createFileRoute('/api/public/ticto-webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedToken = process.env.TICTO_WEBHOOK_TOKEN;
        if (!expectedToken) {
          return new Response('Server not configured', { status: 500 });
        }

        const bodyText = await request.text();

        // Token pode vir em header (x-ticto-token / authorization), querystring (?token=)
        // ou no próprio body (campo "token"). Aceitamos qualquer um.
        const url = new URL(request.url);
        const headerToken =
          request.headers.get('x-ticto-token') ??
          request.headers.get('x-webhook-token') ??
          request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
          null;
        const queryToken = url.searchParams.get('token');

        let parsed: any = null;
        try {
          parsed = JSON.parse(bodyText);
        } catch {
          return new Response('Invalid JSON', { status: 400 });
        }

        const bodyToken = parsed?.token ?? parsed?.hottok ?? null;
        const providedToken = headerToken ?? queryToken ?? bodyToken;

        const providedBuf = Buffer.from(String(providedToken ?? ''), 'utf8');
        const expectedBuf = Buffer.from(expectedToken, 'utf8');
        const isValid =
          providedBuf.length === expectedBuf.length &&
          timingSafeEqual(providedBuf, expectedBuf);
        if (!isValid) {
          return new Response('Unauthorized', { status: 401 });
        }

        try {
          const result = await processEvent(parsed);
          return Response.json(result);
        } catch (err: any) {
          console.error('[ticto-webhook] processing error:', err);
          // Retorna 200 mesmo em erro processado (já registrado em ticto_webhook_events).
          // Se quiser que a Ticto reenvie, mudar para 500.
          return Response.json(
            { ok: false, error: String(err?.message ?? err) },
            { status: 200 }
          );
        }
      },
    },
  },
});
