import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Truck } from "lucide-react";
import { useAuth } from "@/stores/auth";
import { apiErrorMessage } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "No se pudo iniciar sesión"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden flex-col justify-between bg-forest p-12 text-cream lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-lime text-forest-deep">
            <Truck className="size-6" />
          </div>
          <span className="text-lg font-semibold">DePaso</span>
        </div>
        <div className="space-y-4">
          <h1 className="max-w-md text-3xl font-semibold leading-tight">
            Logística colaborativa de última milla
          </h1>
          <p className="max-w-md text-cream/70">
            Gestioná tu flota, programá tus envíos y seguí el impacto ambiental
            de cada entrega desde un solo panel.
          </p>
        </div>
        <p className="text-sm text-cream/50">Panel de gestión · Pymes y administración</p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5 lg:hidden">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-forest text-cream">
                <Truck className="size-5" />
              </div>
              <span className="text-lg font-semibold text-ink">DePaso</span>
            </div>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-ink">Iniciar sesión</h2>
            <p className="text-sm text-ink-mute">
              Ingresá con tu cuenta para acceder al panel.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red/40 bg-red-bg/50 px-3 py-2 text-sm text-red">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Ingresando…" : "Ingresar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
