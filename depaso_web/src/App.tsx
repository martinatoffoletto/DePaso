import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/stores/auth";
import { AppShell } from "@/components/AppShell";
import { LoginPage } from "@/features/auth/LoginPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { FleetPage } from "@/features/fleet/FleetPage";
import { ShipmentsPage } from "@/features/shipments/ShipmentsPage";
import { FinancePage } from "@/features/finance/FinancePage";
import { AdminPage } from "@/features/admin/AdminPage";

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
  const { status } = useAuth();

  if (status === "loading") return <FullScreenSpinner />;

  if (status !== "authenticated") {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
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
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
