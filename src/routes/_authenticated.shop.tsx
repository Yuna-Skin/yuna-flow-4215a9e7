import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { RouteError } from "@/components/RouteError";
import { RouteNotFound } from "@/components/RouteNotFound";

export const Route = createFileRoute("/_authenticated/shop")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  component: ShopPage,
});

function ShopPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <ShoppingBag className="h-10 w-10 text-primary" strokeWidth={1.5} />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight">Loja abre em breve!</h1>
    </div>
  );
}
