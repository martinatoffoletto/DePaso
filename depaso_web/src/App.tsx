import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/stores/auth";
import { AppShell } from "@/components/AppShell";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { FleetPage } from "@/features/fleet/FleetPage";
import { ShipmentsPage } from "@/features/shipments/ShipmentsPage";
import { FinancePage } from "@/features/finance/FinancePage";
import { AdminPage } from "@/features/admin/AdminPage";
import { AltasPage } from "@/features/admin/AltasPage";
import { CarriersPage } from "@/features/admin/CarriersPage";

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <div className="size-8 animate-spin rounded-full border-2 border-line border-t-forest" />
    </div>
  );
}

/** Sólo deja pasar a usuarios admin; el resto vuelve al dashboard. */
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.user_type !== "admin") return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  const { status, user } = useAuth();

  if (status === "loading") return <FullScreenSpinner />;

  if (status !== "authenticated") {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // El admin no tiene organización propia: su home es el panel de monitoreo,
  // no el dashboard de pyme (que quedaría atascado en el onboarding de org).
  const homePath = user?.user_type === "admin" ? "/admin" : "/dashboard";

  return (
    <Routes>
      <Route path="/login" element={<Navigate to={homePath} replace />} />
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/flota" element={<FleetPage />} />
        <Route path="/envios" element={<ShipmentsPage />} />
        <Route path="/finanzas" element={<FinancePage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/transportistas"
          element={
            <AdminRoute>
              <CarriersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/altas"
          element={
            <AdminRoute>
              <AltasPage />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to={homePath} replace />} />
    </Routes>
  );
}
