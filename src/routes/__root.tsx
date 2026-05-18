import { Outlet, Link, createRootRouteWithContext, HeadContent, Scripts } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-display text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1" },
      { title: "Yuna Skin — Autocuidado facial guiado" },
      { name: "description", content: "Protocolo de autocuidado facial guiado. Construa o hábito da sua prática diária." },
      { name: "theme-color", content: "#FFFFFF" },
      { property: "og:title", content: "Yuna Skin — Autocuidado facial guiado" },
      { name: "twitter:title", content: "Yuna Skin — Autocuidado facial guiado" },
      { property: "og:description", content: "Protocolo de autocuidado facial guiado. Construa o hábito da sua prática diária." },
      { name: "twitter:description", content: "Protocolo de autocuidado facial guiado. Construa o hábito da sua prática diária." },
      { name: "twitter:card", content: "summary" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/rA1Yc7OxupPvSqxzpWfBIYHOOgo2/social-images/social-1779078993274-Uma_mulher_elegante_realizando_exercícios_202605131621.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/rA1Yc7OxupPvSqxzpWfBIYHOOgo2/social-images/social-1779078993274-Uma_mulher_elegante_realizando_exercícios_202605131621.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: "https://res.cloudinary.com/dqsuj0pjy/image/upload/f_auto,q_auto,w_64,h_64,c_fit/v1779080514/FastBurn_3_z6feak.png" },
      { rel: "apple-touch-icon", href: "https://res.cloudinary.com/dqsuj0pjy/image/upload/f_auto,q_auto,w_180,h_180,c_fit/v1779080514/FastBurn_3_z6feak.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preconnect", href: "https://res.cloudinary.com", crossOrigin: "anonymous" },
      { rel: "dns-prefetch", href: "https://res.cloudinary.com" },
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
        fetchPriority: "high",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

