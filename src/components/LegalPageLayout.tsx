import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  version: string;
  updatedAt: string;
  children: ReactNode;
}

export function LegalPageLayout({ title, version, updatedAt, children }: Props) {
  return (
    <div className="mobile-shell px-6 py-8 pb-20">
      <Link
        to="/auth"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <header className="mt-6">
        <h1 className="font-display text-3xl text-foreground">{title}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Versão {version} · Atualizado em {updatedAt}
        </p>
      </header>

      <article className="prose prose-sm mt-6 max-w-none text-foreground/90 [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-foreground [&_h3]:mt-5 [&_h3]:font-medium [&_h3]:text-base [&_p]:mt-3 [&_p]:leading-relaxed [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mt-1">
        {children}
      </article>
    </div>
  );
}
