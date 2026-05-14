import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { PRIVACY_VERSION, PRIVACY_UPDATED_AT } from "@/lib/legal-versions";

export const Route = createFileRoute("/politica-de-privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Yuna" },
      { name: "description", content: "Como o Yuna trata seus dados pessoais." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Política de Privacidade"
      version={PRIVACY_VERSION}
      updatedAt={PRIVACY_UPDATED_AT}
    >
      <p>
        Esta Política descreve como o Yuna coleta, usa, armazena e compartilha seus
        dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei
        nº 13.709/2018 — LGPD).
      </p>

      <h2>1. Dados que coletamos</h2>
      <ul>
        <li>Nome e e-mail (no cadastro)</li>
        <li>Senha (armazenada de forma criptografada)</li>
        <li>Foto de avatar (opcional)</li>
        <li>Progresso de prática (dias concluídos)</li>
        <li>Registros de aceite dos Termos e desta Política</li>
        <li>Dados técnicos: IP, navegador e horário do aceite</li>
      </ul>

      <h2>2. Para que usamos</h2>
      <ul>
        <li>Criar e manter sua conta</li>
        <li>Entregar o conteúdo contratado</li>
        <li>Acompanhar seu progresso na jornada</li>
        <li>Melhorar a experiência do app</li>
        <li>Cumprir obrigações legais</li>
      </ul>

      <h2>3. Base legal</h2>
      <p>
        Tratamos seus dados com base em: execução de contrato (art. 7º, V da LGPD),
        consentimento (art. 7º, I) e cumprimento de obrigação legal (art. 7º, II).
      </p>

      <h2>4. Compartilhamento</h2>
      <p>Seus dados podem ser compartilhados com:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — infraestrutura de banco de dados, autenticação
          e armazenamento de arquivos
        </li>
        <li>
          <strong>Plataforma de pagamento</strong> (a definir, ex.: Ticto) — para
          processar a compra
        </li>
        <li>
          <strong>Autoridades públicas</strong>, quando exigido por lei
        </li>
      </ul>
      <p>Não vendemos seus dados.</p>

      <h2>5. Armazenamento</h2>
      <p>
        Seus dados são armazenados em servidores do Supabase. Mantemos seus dados
        enquanto sua conta estiver ativa e pelo prazo legal aplicável após
        encerramento.
      </p>

      <h2>6. Seus direitos (LGPD)</h2>
      <p>Você pode, a qualquer momento, solicitar:</p>
      <ul>
        <li>Acesso aos seus dados</li>
        <li>Correção de dados incompletos ou desatualizados</li>
        <li>Exclusão dos dados (anonimização ou eliminação)</li>
        <li>Portabilidade</li>
        <li>Revogação do consentimento</li>
        <li>Informação sobre compartilhamentos realizados</li>
      </ul>
      <p>Para exercer esses direitos, entre em contato pelo e-mail abaixo.</p>

      <h2>7. Segurança</h2>
      <p>
        Adotamos medidas técnicas e organizacionais para proteger seus dados,
        incluindo criptografia em trânsito (HTTPS), criptografia de senhas e
        controle de acesso baseado em políticas (RLS).
      </p>

      <h2>8. Cookies</h2>
      <p>
        Atualmente o Yuna utiliza apenas cookies essenciais para manter sua sessão
        autenticada. Mais detalhes na nossa Política de Cookies.
      </p>

      <h2>9. Crianças e adolescentes</h2>
      <p>
        O Yuna não é destinado a menores de 18 anos. Não coletamos intencionalmente
        dados de menores.
      </p>

      <h2>10. Alterações</h2>
      <p>
        Podemos atualizar esta Política. Você será notificada no app e precisará
        aceitar a nova versão para continuar.
      </p>

      <h2>11. Encarregado (DPO) e contato</h2>
      <p>
        Para qualquer questão relacionada a dados pessoais: privacidade@yuna.app
        (a confirmar).
      </p>
    </LegalPageLayout>
  );
}
