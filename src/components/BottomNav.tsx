import { Link, useLocation } from "@tanstack/react-router";
import { Home, Sparkles, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const items: NavItem[] = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/plus", label: "Plus", icon: Sparkles },
  { to: "/shop", label: "Loja", icon: ShoppingBag },
  { to: "/profile", label: "Perfil", icon: User },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <nav className={cn("pointer-events-auto w-full rounded-[28px] border border-black/[0.06] glass-nav shadow-[0_12px_36px_rgba(0,0,0,0.12)] backdrop-blur-xl") }>
        <ul className="flex min-h-[72px] items-stretch justify-around px-3 py-2">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <li key={it.to} className="flex-1">
                <Link
                  to={it.to}
                  className={cn(
                    "flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[10px] font-medium transition-colors",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn("h-5 w-5 shrink-0", active && "stroke-[2.2]")}
                    strokeWidth={1.75}
                  />
                  <span className="tracking-wide">{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
