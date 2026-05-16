import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import {
  PRIVACY_VERSION,
  PRIVACY_UPDATED_AT,
  COMPANY_LEGAL_NAME,
  COMPANY_CNPJ,
  PRIVACY_EMAIL,
} from "@/lib/legal-versions";
import { RouteError } from "@/components/RouteError";
import { RouteNotFound } from "@/components/RouteNotFound";

export const Route = createFileRoute("/politica-de-privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Yuna Skin" },
      { name: "description", content: "Como o Yuna Skin trata seus dados pessoais conforme a LGPD." },
      { property: "og:title", content: "Política de Privacidade — Yuna Skin" },
      { property: "og:description", content: "Como o Yuna Skin trata seus dados pessoais conforme a LGPD." },
      { property: "og:url", content: "https://yuna-flow.lovable.app/politica-de-privacidade" },
    ],
    links: [{ rel: "canonical", href: "https://yuna-flow.lovable.app/politica-de-privacidade" }],
  }),
  component: PrivacyPage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Política de Privacidade"
      version={PRIVACY_VERSION}
      updatedAt={PRIVACY_UPDATED_AT}
    >
      <p>
        Esta Política descreve como o Yuna Skin, operado por{" "}
        <strong>{COMPANY_LEGAL_NAME}</strong> (CNPJ {COMPANY_CNPJ}), coleta,
        utiliza, armazena e compartilha dados pessoais, em conformidade com a
        Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
      </p>

      <h2>1. Dados Coletados</h2>
      <h3>Dados cadastrais</h3>
      <ul>
        <li>nome</li>
        <li>e-mail</li>
        <li>senha (armazenada de forma criptografada)</li>
      </ul>

      <h3>Dados técnicos</h3>
      <ul>
        <li>endereço IP</li>
        <li>user-agent (navegador/dispositivo)</li>
        <li>cookies essenciais</li>
        <li>logs de acesso</li>
      </ul>

      <h3>Dados de uso</h3>
      <ul>
        <li>progresso na jornada</li>
        <li>interações com o conteúdo</li>
        <li>preferências da usuária</li>
        <li>foto de avatar (opcional)</li>
      </ul>

      <h2>2. Finalidade</h2>
      <p>Os dados são utilizados para:</p>
      <ul>
        <li>autenticação e manutenção da conta</li>
        <li>entrega do serviço contratado</li>
        <li>segurança e prevenção a fraudes</li>
        <li>melhoria contínua da experiência</li>
        <li>atendimento e suporte</li>
        <li>cumprimento de obrigações legais</li>
      </ul>

      <h2>3. Bases Legais</h2>
      <p>O tratamento de dados ocorre com base em:</p>
      <ul>
        <li>execução de contrato (art. 7º, V da LGPD)</li>
        <li>legítimo interesse (art. 7º, IX)</li>
        <li>consentimento da titular (art. 7º, I)</li>
        <li>cumprimento de obrigação legal (art. 7º, II)</li>
      </ul>

      <h2>4. Compartilhamento</h2>
      <p>Os dados poderão ser compartilhados, na medida necessária, com:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — infraestrutura de banco de dados,
          autenticação e armazenamento
        </li>
        <li>
          <strong>Serviços de hospedagem</strong> — entrega da aplicação
        </li>
        <li>
          <strong>Gateways de pagamento</strong> (ex.: Ticto) — processamento
          financeiro
        </li>
        <li>
          <strong>Ferramentas de analytics</strong> — quando ativadas, mediante
          consentimento
        </li>
        <li>
          <strong>Autoridades públicas</strong> — quando exigido por lei
        </li>
      </ul>
      <p>O Yuna Skin não vende dados pessoais.</p>

      <h2>5. Segurança</h2>
      <p>O Yuna Skin adota as seguintes medidas:</p>
      <ul>
        <li>criptografia em trânsito (HTTPS)</li>
        <li>criptografia de senhas</li>
        <li>controle de acesso por políticas (RLS)</li>
        <li>autenticação segura</li>
        <li>logs de auditoria com acesso restrito</li>
      </ul>

      <h2>6. Direitos da Usuária</h2>
      <p>Nos termos da LGPD, a usuária poderá solicitar a qualquer momento:</p>
      <ul>
        <li>acesso aos seus dados</li>
        <li>correção de dados incompletos ou desatualizados</li>
        <li>exclusão (anonimização ou eliminação)</li>
        <li>portabilidade</li>
        <li>revogação do consentimento</li>
        <li>informação sobre compartilhamentos realizados</li>
      </ul>
      <p>
        Contato do Encarregado: <strong>{PRIVACY_EMAIL}</strong>
      </p>

      <h2>7. Exclusão de Conta</h2>
      <p>
        A usuária poderá solicitar a exclusão da conta a qualquer momento
        diretamente pelo aplicativo, em <em>Perfil → Configurações →
        Privacidade → Excluir conta</em>.
      </p>
      <p>
        Após a exclusão, alguns dados poderão ser preservados pelo prazo
        legal aplicável, especificamente:
      </p>
      <ul>
        <li>logs jurídicos e de auditoria</li>
        <li>comprovantes financeiros</li>
        <li>registros antifraude</li>
        <li>dados exigidos por lei ou ordem judicial</li>
      </ul>

      <h2>8. Crianças e Adolescentes</h2>
      <p>
        O Yuna Skin não é destinado a menores de 18 anos e não coleta
        intencionalmente dados de menores.
      </p>

      <h2>9. Atualizações</h2>
      <p>
        Esta Política poderá ser atualizada periodicamente. Quando isso
        ocorrer, a usuária será notificada no aplicativo e precisará aceitar
        a nova versão para continuar.
      </p>

      <h2>10. Encarregado (DPO) e Contato</h2>
      <p>
        Para qualquer questão relacionada a dados pessoais, entre em contato
        pelo e-mail: <strong>{PRIVACY_EMAIL}</strong>
      </p>
    </LegalPageLayout>
  );
}
