import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { COOKIES_UPDATED_AT } from "@/lib/legal-versions";

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
        Esta Política explica o que são cookies e como o Yuna os utiliza.
      </p>

      <h2>1. O que são cookies</h2>
      <p>
        Cookies são pequenos arquivos armazenados no seu dispositivo quando você
        acessa um site ou aplicativo. Eles ajudam o serviço a lembrar de
        informações, como o seu login.
      </p>

      <h2>2. Cookies que usamos</h2>
      <p>Atualmente o Yuna utiliza apenas cookies <strong>estritamente necessários</strong>:</p>
      <ul>
        <li>
          <strong>Sessão de autenticação</strong> — mantém você logada enquanto
          navega no app
        </li>
        <li>
          <strong>Preferências locais</strong> — guardam pequenas preferências de
          uso no seu dispositivo
        </li>
      </ul>
      <p>
        Não utilizamos, neste momento, cookies de marketing, pixels de redes
        sociais ou ferramentas de analytics de terceiros.
      </p>

      <h2>3. Mudanças futuras</h2>
      <p>
        Caso passemos a utilizar cookies de analytics ou marketing (Google, Meta,
        etc.), atualizaremos esta Política e exibiremos um banner solicitando seu
        consentimento explícito antes de qualquer carregamento.
      </p>

      <h2>4. Como controlar</h2>
      <p>
        Você pode bloquear ou apagar cookies a qualquer momento nas configurações
        do seu navegador. Sem os cookies essenciais, porém, funcionalidades como
        login podem deixar de funcionar.
      </p>

      <h2>5. Contato</h2>
      <p>privacidade@yuna.app (a confirmar).</p>
    </LegalPageLayout>
  );
}
