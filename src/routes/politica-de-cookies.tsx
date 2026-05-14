import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { COOKIES_UPDATED_AT, PRIVACY_EMAIL } from "@/lib/legal-versions";

export const Route = createFileRoute("/politica-de-cookies")({
  head: () => ({
    meta: [
      { title: "Política de Cookies — Yuna" },
      { name: "description", content: "Como o Yuna utiliza cookies." },
    ],
  }),
  component: CookiesPage,
});

function CookiesPage() {
  return (
    <LegalPageLayout title="Política de Cookies" version="v1.0" updatedAt={COOKIES_UPDATED_AT}>
      <p>
        Esta Política explica o que são cookies e como o Yuna os utiliza para
        garantir o funcionamento, a segurança e a melhor experiência possível.
      </p>

      <h2>1. O que são cookies</h2>
      <p>
        Cookies são pequenos arquivos armazenados no dispositivo da usuária
        para melhorar funcionalidades, desempenho e segurança da plataforma.
      </p>

      <h2>2. Cookies Essenciais</h2>
      <p>Necessários para:</p>
      <ul>
        <li>login e autenticação</li>
        <li>segurança da sessão</li>
        <li>funcionamento básico da plataforma</li>
      </ul>
      <p>
        Sem esses cookies, funcionalidades como o login deixam de funcionar.
      </p>

      <h2>3. Cookies Analíticos</h2>
      <p>Poderão ser utilizados, mediante consentimento, para:</p>
      <ul>
        <li>métricas de uso</li>
        <li>analytics agregados</li>
        <li>melhoria contínua da experiência</li>
      </ul>

      <h2>4. Cookies de Marketing</h2>
      <p>Poderão ser utilizados futuramente para:</p>
      <ul>
        <li>remarketing</li>
        <li>campanhas publicitárias</li>
        <li>personalização de anúncios</li>
      </ul>

      <h2>5. Cookies de Terceiros</h2>
      <p>O Yuna poderá utilizar serviços como:</p>
      <ul>
        <li>Google Analytics</li>
        <li>Meta Pixel</li>
        <li>plataformas de hospedagem e pagamento</li>
      </ul>
      <p>
        Quando esses serviços forem ativados, exibiremos um banner de
        consentimento granular antes de qualquer carregamento.
      </p>

      <h2>6. Gerenciamento</h2>
      <p>
        A usuária poderá aceitar, rejeitar ou remover cookies a qualquer
        momento nas configurações do navegador. A remoção de cookies
        essenciais poderá impactar o funcionamento do app.
      </p>

      <h2>7. Atualizações</h2>
      <p>
        Esta Política poderá ser atualizada periodicamente para refletir
        mudanças tecnológicas ou regulatórias.
      </p>

      <h2>8. Contato</h2>
      <p>Dúvidas sobre cookies ou privacidade: {PRIVACY_EMAIL}</p>
    </LegalPageLayout>
  );
}
