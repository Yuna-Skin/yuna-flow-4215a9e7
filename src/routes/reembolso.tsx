import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import {
  TERMS_VERSION,
  TERMS_UPDATED_AT,
  COMPANY_LEGAL_NAME,
  COMPANY_CNPJ,
  CONTACT_EMAIL,
} from "@/lib/legal-versions";
import { RouteError } from "@/components/RouteError";
import { RouteNotFound } from "@/components/RouteNotFound";

export const Route = createFileRoute("/reembolso")({
  head: () => ({
    meta: [
      { title: "Política de Reembolso — Yuna Skin" },
      {
        name: "description",
        content:
          "Política de reembolso do Yuna Skin — direito de arrependimento de 7 dias conforme o Código de Defesa do Consumidor.",
      },
      { property: "og:title", content: "Política de Reembolso — Yuna Skin" },
      {
        property: "og:description",
        content:
          "Direito de arrependimento de 7 dias com reembolso integral, conforme CDC.",
      },
      { property: "og:url", content: "https://yuna-flow.lovable.app/reembolso" },
    ],
    links: [{ rel: "canonical", href: "https://yuna-flow.lovable.app/reembolso" }],
  }),
  component: RefundPage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function RefundPage() {
  return (
    <LegalPageLayout
      title="Política de Reembolso"
      version={TERMS_VERSION}
      updatedAt={TERMS_UPDATED_AT}
    >
      <p>
        Esta Política de Reembolso descreve as condições para solicitação de
        cancelamento e devolução de valores pagos pela assinatura ou acesso
        ao aplicativo Yuna Skin, operado por{" "}
        <strong>{COMPANY_LEGAL_NAME}</strong>, CNPJ{" "}
        <strong>{COMPANY_CNPJ}</strong>.
      </p>

      <h2>1. Direito de Arrependimento (7 dias)</h2>
      <p>
        Conforme o <strong>art. 49 do Código de Defesa do Consumidor</strong>{" "}
        (Lei nº 8.078/1990), a usuária tem o direito de desistir da compra em
        até <strong>7 (sete) dias corridos</strong>, contados a partir da
        data de confirmação do pagamento, sem necessidade de justificativa.
      </p>
      <p>
        Dentro desse prazo, o reembolso será <strong>integral</strong> e
        processado pelo mesmo meio de pagamento utilizado na compra.
      </p>

      <h2>2. Como solicitar o reembolso</h2>
      <p>
        Para exercer o direito de arrependimento, envie um e-mail para{" "}
        <strong>{CONTACT_EMAIL}</strong> com os seguintes dados:
      </p>
      <ul>
        <li>Nome completo cadastrado</li>
        <li>E-mail da conta no Yuna Skin</li>
        <li>Data e meio de pagamento utilizado</li>
        <li>Motivo do pedido (opcional)</li>
      </ul>

      <h2>3. Prazo de processamento</h2>
      <p>
        Solicitações enviadas dentro do prazo legal serão analisadas e
        confirmadas em até <strong>5 (cinco) dias úteis</strong>. O estorno
        no cartão de crédito ou conta bancária pode levar até{" "}
        <strong>2 (duas) faturas</strong> para ser concluído, conforme
        políticas da operadora de pagamento.
      </p>

      <h2>4. Após o prazo de 7 dias</h2>
      <p>
        Solicitações realizadas após o prazo legal de arrependimento não
        terão direito a reembolso, salvo nas hipóteses de:
      </p>
      <ul>
        <li>Falha técnica comprovada que impeça o uso do aplicativo</li>
        <li>Cobrança em duplicidade</li>
        <li>Outras situações analisadas individualmente pelo suporte</li>
      </ul>

      <h2>5. Cancelamento de assinatura recorrente</h2>
      <p>
        Caso o plano contratado seja de assinatura recorrente, a usuária
        pode cancelar a renovação automática a qualquer momento entrando em
        contato com {CONTACT_EMAIL}. O cancelamento impede cobranças
        futuras, mas não gera reembolso proporcional do período já pago,
        salvo dentro do prazo legal de 7 dias.
      </p>

      <h2>6. Acesso após o reembolso</h2>
      <p>
        Após confirmação do reembolso, o acesso ao conteúdo pago será
        encerrado automaticamente.
      </p>

      <h2>7. Contato</h2>
      <p>
        Para qualquer dúvida sobre esta política ou para solicitar reembolso:{" "}
        <strong>{CONTACT_EMAIL}</strong>
      </p>
    </LegalPageLayout>
  );
}
