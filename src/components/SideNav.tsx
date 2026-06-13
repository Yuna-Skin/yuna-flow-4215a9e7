import { Link, useLocation } from "@tanstack/react-router";
import { Home, Sparkles, ShoppingBag, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const items: NavItem[] = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/plus", label: "Plus", icon: Sparkles },
  { to: "/shop", label: "Loja", icon: ShoppingBag },
  { to: "/profile", label: "Perfil", icon: User },
];

/**
 * Sidebar para iPad/desktop. Renderiza só em ≥768px via `hidden md:flex`.
 * Em mobile NÃO aparece — toda a estrutura continua sendo o BottomNav.
 */
export function SideNav() {
  const { pathname } = useLocation();
  return (
    <aside className="hidden md:flex md:flex-col md:gap-2 md:border-r md:border-black/[0.06] md:bg-white/40 md:backdrop-blur-xl md:px-5 md:py-7 dark:md:bg-white/[0.02] dark:md:border-white/[0.06]">
      <div className="px-2 pb-6">
        <Logo size={28} className="text-foreground" />
      </div>

      <nav className="flex-1">
        <ul className="flex flex-col gap-1">
          {items.map((it) => {
            const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
            const Icon = it.icon;
            return (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
                    active
                      ? "bg-foreground/[0.06] text-foreground shadow-sm dark:bg-white/[0.08]"
                      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground dark:hover:bg-white/[0.04]",
                  )}
                >
                  <Icon
                    className={cn("h-[18px] w-[18px] shrink-0", active && "stroke-[2.2] text-primary")}
                    strokeWidth={1.75}
                  />
                  <span className="tracking-wide">{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Link
        to="/settings"
        className={cn(
          "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all",
          pathname.startsWith("/settings")
            ? "bg-foreground/[0.06] text-foreground dark:bg-white/[0.08]"
            : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground dark:hover:bg-white/[0.04]",
        )}
      >
        <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
        <span className="tracking-wide">Configurações</span>
      </Link>
    </aside>
  );
}
