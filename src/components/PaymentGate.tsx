import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyAccess } from "@/lib/access.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const CHECKOUT_URL = "https://yunaskin.com.br";
const SUPPORT_EMAIL = "contato@yunaskin.com.br";

export function PaymentGate({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const fetchAccess = useServerFn(getMyAccess);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["my-access", session?.user.id],
    queryFn: () => fetchAccess(),
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="mobile-shell flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data?.hasAccess) {
    return <>{children}</>;
  }

  const email = session?.user.email ?? "";

  return (
    <div className="mobile-shell flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <ShoppingBag className="h-7 w-7 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Pagamento não encontrado</h1>
        <p className="text-sm text-muted-foreground">
          Não localizamos uma compra ativa para o e-mail{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
        <p className="text-sm text-muted-foreground">
          Se você já comprou, confirme que usou o mesmo e-mail no checkout. A liberação é automática
          assim que recebemos a confirmação.
        </p>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-2">
        <Button asChild className="w-full">
          <a href={CHECKOUT_URL} target="_blank" rel="noreferrer">
            Quero comprar o acesso
          </a>
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          {isRefetching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Já paguei, verificar de novo"}
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Acesso%20Yuna%20Flow%20-%20${encodeURIComponent(email)}`}>
            <Mail className="mr-2 h-4 w-4" />
            Falar com suporte
          </a>
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={() => supabase.auth.signOut()}
        >
          Sair
        </Button>
      </div>
    </div>
  );
}
