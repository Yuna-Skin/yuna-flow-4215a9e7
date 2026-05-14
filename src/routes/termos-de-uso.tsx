import { createFileRoute } from "@tanstack/react-router";
import { LegalPageLayout } from "@/components/LegalPageLayout";
import { TERMS_VERSION, TERMS_UPDATED_AT } from "@/lib/legal-versions";

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
        Bem-vinda ao Yuna. Estes Termos regem o uso do aplicativo e do conteúdo
        digital oferecidos pelo Yuna. Ao criar uma conta, você concorda com tudo
        que está descrito abaixo.
      </p>

      <h2>1. Sobre o Yuna</h2>
      <p>
        O Yuna é um aplicativo digital de práticas guiadas de yoga facial coreano,
        respiração e autocuidado. O conteúdo é entregue em formato de vídeo, áudio
        e texto, organizado em uma jornada de prática.
      </p>

      <h2>2. Elegibilidade</h2>
      <p>
        Para usar o Yuna, você precisa ter no mínimo 18 anos e capacidade civil
        plena. Ao criar uma conta, você declara que essas condições são verdadeiras.
      </p>

      <h2>3. Conta e responsabilidade</h2>
      <p>
        Você é responsável por manter login e senha em sigilo. Toda atividade
        feita através da sua conta é de sua responsabilidade.
      </p>

      <h2>4. Pagamento e acesso</h2>
      <p>
        O acesso ao conteúdo é vendido digitalmente. O pagamento é processado por
        plataforma terceirizada (a definir, ex.: Ticto). Após confirmação, o acesso
        é liberado conforme o plano contratado.
      </p>

      <h2>5. Licença de uso</h2>
      <p>
        Concedemos a você uma licença pessoal, intransferível e não exclusiva para
        acessar o conteúdo. É proibido copiar, redistribuir, revender, gravar ou
        compartilhar qualquer material do Yuna.
      </p>

      <h2>6. Propriedade intelectual</h2>
      <p>
        Todo o conteúdo, marca, identidade visual, vídeos, áudios e textos do Yuna
        são protegidos por direitos autorais e pertencem ao Yuna ou aos seus
        licenciadores.
      </p>

      <h2>7. Isenção médica</h2>
      <p>
        <strong>O Yuna não constitui tratamento médico, dermatológico, estético
        clínico ou fisioterapêutico.</strong> O conteúdo tem fins educativos e de
        autocuidado. Em caso de dúvida sobre sua saúde, consulte um profissional
        habilitado antes de iniciar a prática.
      </p>

      <h2>8. Resultados</h2>
      <p>
        Resultados variam de pessoa para pessoa e dependem de fatores individuais
        como constância, biotipo, idade e estilo de vida. Não garantimos resultados
        específicos.
      </p>

      <h2>9. Cancelamento e suporte</h2>
      <p>
        Solicitações de cancelamento e reembolso seguem a política da plataforma de
        pagamento e a legislação brasileira aplicável (CDC, art. 49 — direito de
        arrependimento em até 7 dias para compras online).
      </p>

      <h2>10. Limitação de responsabilidade</h2>
      <p>
        O Yuna não se responsabiliza por danos decorrentes do uso inadequado do
        conteúdo, falhas técnicas pontuais ou indisponibilidade temporária do app.
      </p>

      <h2>11. Alterações</h2>
      <p>
        Podemos atualizar estes Termos. Quando isso acontecer, você será notificada
        no app e precisará aceitar a nova versão para continuar usando.
      </p>

      <h2>12. Foro</h2>
      <p>
        Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da
        comarca da sede do Yuna para dirimir quaisquer disputas.
      </p>

      <h2>13. Contato</h2>
      <p>Para dúvidas: contato@yuna.app (a confirmar).</p>
    </LegalPageLayout>
  );
}
