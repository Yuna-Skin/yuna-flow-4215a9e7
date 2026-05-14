import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import {
  TERMS_VERSION,
  TERMS_UPDATED_AT,
  COMPANY_LEGAL_NAME,
  COMPANY_CNPJ,
  CONTACT_EMAIL,
  FORO,
} from "@/lib/legal-versions";

export const Route = createFileRoute("/termos-de-uso")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Yuna" },
      { name: "description", content: "Termos de Uso do aplicativo Yuna." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPageLayout title="Termos de Uso" version={TERMS_VERSION} updatedAt={TERMS_UPDATED_AT}>
      <p>
        Bem-vinda ao Yuna. Estes Termos de Uso regem o acesso e a utilização do
        aplicativo Yuna. Ao criar uma conta, você declara ter lido, compreendido
        e concordado integralmente com as condições abaixo.
      </p>

      <h2>1. Identificação</h2>
      <p>
        O Yuna é uma plataforma digital de autocuidado e wellness facial,
        operada por <strong>{COMPANY_LEGAL_NAME}</strong>, inscrita no CNPJ sob
        o nº <strong>{COMPANY_CNPJ}</strong>.
      </p>
      <p>Contato oficial: {CONTACT_EMAIL}</p>

      <h2>2. Sobre o Produto</h2>
      <p>O Yuna oferece conteúdos digitais relacionados a:</p>
      <ul>
        <li>exercícios faciais guiados</li>
        <li>drenagem facial estética</li>
        <li>massagens faciais</li>
        <li>rotinas de autocuidado</li>
        <li>wellness facial</li>
      </ul>
      <p>
        <strong>
          O Yuna não constitui serviço médico, dermatológico, fisioterapêutico
          ou terapêutico.
        </strong>{" "}
        Trata-se de plataforma educativa e de autocuidado estético.
      </p>

      <h2>3. Elegibilidade</h2>
      <p>
        O uso da plataforma é permitido apenas a pessoas maiores de 18 anos
        com plena capacidade civil.
      </p>

      <h2>4. Cadastro</h2>
      <p>
        A usuária compromete-se a fornecer dados verdadeiros, completos e
        atualizados, bem como manter a confidencialidade de suas credenciais
        de acesso. Toda atividade realizada através da conta é de
        responsabilidade da titular.
      </p>

      <h2>5. Licença de Uso</h2>
      <p>
        Concedemos à usuária uma licença <strong>pessoal, limitada,
        revogável e intransferível</strong> para acesso ao conteúdo da
        plataforma. É expressamente proibido:
      </p>
      <ul>
        <li>copiar, gravar ou reproduzir conteúdos</li>
        <li>redistribuir vídeos, áudios ou textos</li>
        <li>revender materiais do Yuna</li>
        <li>utilizar a marca ou identidade visual sem autorização escrita</li>
      </ul>

      <h2>6. Pagamento</h2>
      <p>
        O acesso ao conteúdo poderá ocorrer mediante pagamento processado
        por plataformas terceiras, como a Ticto. Após confirmação do
        pagamento, o acesso é liberado conforme o plano contratado.
      </p>

      <h2>7. Direito de Arrependimento</h2>
      <p>
        Conforme o art. 49 do Código de Defesa do Consumidor, a usuária
        poderá solicitar o cancelamento da compra em até <strong>7 dias
        corridos</strong> contados a partir da contratação, com restituição
        integral dos valores pagos.
      </p>

      <h2>8. Isenção Médica</h2>
      <p>
        O Yuna possui caráter <strong>exclusivamente educativo, informativo
        e de autocuidado estético</strong>. Não substitui consulta,
        diagnóstico ou orientação de profissionais de saúde habilitados.
      </p>
      <p>
        Em caso de dúvida sobre sua condição de saúde, consulte um
        profissional qualificado antes de iniciar qualquer prática.
      </p>

      <h2>9. Resultados</h2>
      <p>
        Resultados podem variar conforme fatores individuais como
        constância, biotipo, idade, hábitos e estilo de vida. O Yuna não
        garante resultados específicos.
      </p>

      <h2>10. Limitação de Responsabilidade</h2>
      <p>
        O Yuna não se responsabiliza por danos decorrentes de uso inadequado
        do conteúdo, falhas técnicas pontuais ou indisponibilidade
        temporária do aplicativo.
      </p>

      <h2>11. Alterações</h2>
      <p>
        Estes Termos poderão ser atualizados periodicamente. Quando isso
        ocorrer, a usuária será notificada no aplicativo e precisará aceitar
        a nova versão para continuar utilizando o serviço.
      </p>

      <h2>12. Foro</h2>
      <p>
        Estes Termos são regidos pela legislação brasileira. Fica eleito o
        foro da comarca de <strong>{FORO}</strong> para dirimir quaisquer
        controvérsias.
      </p>

      <h2>13. Contato</h2>
      <p>Para dúvidas e solicitações: {CONTACT_EMAIL}</p>
    </LegalPageLayout>
  );
}
