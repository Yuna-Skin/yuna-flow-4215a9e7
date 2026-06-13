import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Home, Sparkles, ShoppingBag, User, Settings, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };
const items: NavItem[] = [
  { to: "/", label: "Início", icon: Home, exact: true },
  { to: "/plus", label: "Plus", icon: Sparkles },
  { to: "/shop", label: "Loja", icon: ShoppingBag },
  { to: "/profile", label: "Perfil", icon: User },
];

const STORAGE_KEY = "yuna:sidebar-collapsed";

/**
 * Sidebar para iPad/desktop. Renderiza só em ≥768px via `hidden md:flex`.
 * Em mobile NÃO aparece — toda a estrutura continua sendo o BottomNav.
 */
export function SideNav({
  collapsed: controlledCollapsed,
  onToggle,
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const { pathname } = useLocation();
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  });

  const collapsed = controlledCollapsed ?? internalCollapsed;
  const toggle = onToggle ?? (() => {
    setInternalCollapsed((c) => {
      const next = !c;
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) === "1";
    if (stored !== internalCollapsed) setInternalCollapsed(stored);
  }, []);

  return (
    <aside
      className={cn(
        "hidden md:flex md:flex-col md:gap-2 md:border-r md:border-black/[0.06] md:bg-white/40 md:backdrop-blur-xl dark:md:bg-white/[0.02] dark:md:border-white/[0.06] transition-all duration-300",
        collapsed ? "md:px-3 md:py-5 md:w-[72px]" : "md:px-5 md:py-7 md:w-[260px]"
      )}
    >
      <div className={cn("flex items-center pb-6", collapsed ? "justify-center px-0" : "justify-between px-2")}>
        {!collapsed && <Logo size={28} className="text-foreground" />}
        <button
          onClick={toggle}
          className={cn(
            "rounded-xl p-2 text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground",
            collapsed && "mx-auto"
          )}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <PanelLeft className="h-5 w-5" />
          ) : (
            <PanelLeftClose className="h-5 w-5" />
          )}
        </button>
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
                    "group flex items-center rounded-2xl py-3 text-sm font-medium transition-all",
                    collapsed ? "justify-center px-2" : "gap-3 px-3",
                    active
                      ? "bg-foreground/[0.06] text-foreground shadow-sm dark:bg-white/[0.08]"
                      : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground dark:hover:bg-white/[0.04]",
                  )}
                  title={collapsed ? it.label : undefined}
                >
                  <Icon
                    className={cn("h-[18px] w-[18px] shrink-0", active && "stroke-[2.2] text-primary")}
                    strokeWidth={1.75}
                  />
                  {!collapsed && <span className="tracking-wide">{it.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Link
        to="/settings"
        className={cn(
          "flex items-center rounded-2xl py-3 text-sm font-medium transition-all",
          collapsed ? "justify-center px-2" : "gap-3 px-3",
          pathname.startsWith("/settings")
            ? "bg-foreground/[0.06] text-foreground dark:bg-white/[0.08]"
            : "text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground dark:hover:bg-white/[0.04]",
        )}
        title={collapsed ? "Configurações" : undefined}
      >
        <Settings className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
        {!collapsed && <span className="tracking-wide">Configurações</span>}
      </Link>
    </aside>
  );
}
