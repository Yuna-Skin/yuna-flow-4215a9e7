import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { getLatestConsent, recordConsent } from "@/lib/consent.functions";
import { TERMS_VERSION, PRIVACY_VERSION } from "@/lib/legal-versions";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function LegalGate({ children }: { children: React.ReactNode }) {
  const fetchLatest = useServerFn(getLatestConsent);
  const submitConsent = useServerFn(recordConsent);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["latest-consent"],
    queryFn: () => fetchLatest(),
    staleTime: 5 * 60 * 1000,
  });

  const mutation = useMutation({
    mutationFn: () =>
      submitConsent({
        data: {
          accepted_terms: true,
          accepted_privacy: true,
          terms_version: TERMS_VERSION,
          privacy_version: PRIVACY_VERSION,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["latest-consent"] });
      toast.success("Obrigado por aceitar 🌸");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao salvar"),
  });

  if (isLoading) return <>{children}</>;

  const isCurrent =
    data &&
    data.terms_version === TERMS_VERSION &&
    data.privacy_version === PRIVACY_VERSION;

  if (isCurrent) return <>{children}</>;

  const isUpdate = !!data;

  return (
    <>
      {children}
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
        <div className="w-full max-w-md rounded-t-3xl bg-background p-6 shadow-xl sm:rounded-3xl">
          <h2 className="font-display text-2xl text-foreground">
            {isUpdate ? "Atualizamos nossos termos" : "Antes de continuar"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {isUpdate
              ? "Precisamos do seu novo aceite para você continuar usando o Yuna."
              : "Para usar o Yuna, precisamos do seu aceite aos nossos Termos e Política."}
          </p>

          <div className="mt-5 space-y-3">
            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                checked={terms}
                onCheckedChange={(v) => setTerms(v === true)}
                className="mt-0.5"
              />
              <span>
                Li e aceito os{" "}
                <Link
                  to="/termos-de-uso"
                  target="_blank"
                  className="font-medium text-primary underline"
                >
                  Termos de Uso
                </Link>
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <Checkbox
                checked={privacy}
                onCheckedChange={(v) => setPrivacy(v === true)}
                className="mt-0.5"
              />
              <span>
                Li e aceito a{" "}
                <Link
                  to="/politica-de-privacidade"
                  target="_blank"
                  className="font-medium text-primary underline"
                >
                  Política de Privacidade
                </Link>
              </span>
            </label>
          </div>

          <Button
            disabled={!terms || !privacy || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="mt-6 w-full"
            size="lg"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Aceitar e continuar"
            )}
          </Button>

          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
            className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground"
          >
            Sair
          </button>
        </div>
      </div>
    </>
  );
}
