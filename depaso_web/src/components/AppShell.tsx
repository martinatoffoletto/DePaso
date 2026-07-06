import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  Package,
  ShieldCheck,
  Truck,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/stores/auth";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/flota", label: "Flota", icon: Truck },
  { to: "/envios", label: "Envíos", icon: Package },
  { to: "/finanzas", label: "Finanzas", icon: Wallet },
  { to: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
];

function initials(first: string, last: string): string {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export function AppShell() {
  const { user, logout } = useAuth();
  const items = NAV.filter((i) => !i.adminOnly || user?.user_type === "admin");

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-forest text-cream">
            <Truck className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">DePaso</p>
            <p className="text-xs text-ink-mute">Panel de gestión</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-forest text-cream"
                    : "text-ink-soft hover:bg-cream-deep hover:text-ink",
                )
              }
            >
              <Icon className="size-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line px-3 py-3">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-red-bg hover:text-red"
          >
            <LogOut className="size-4.5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-surface/80 px-6 py-3 backdrop-blur">
          {/* Nav horizontal en mobile */}
          <nav className="flex gap-1 overflow-x-auto md:hidden">
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-medium",
                    isActive ? "bg-forest text-cream" : "text-ink-soft",
                  )
                }
              >
                <Icon className="size-4" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden md:block" />

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-ink">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs capitalize text-ink-mute">{user?.user_type}</p>
            </div>
            <div className="flex size-9 items-center justify-center rounded-full bg-mint text-sm font-semibold text-forest-deep">
              {user ? initials(user.first_name, user.last_name) : "?"}
            </div>
            <button
              onClick={logout}
              className="rounded-lg p-2 text-ink-mute transition-colors hover:bg-red-bg hover:text-red md:hidden"
              aria-label="Cerrar sesión"
            >
              <LogOut className="size-4.5" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
