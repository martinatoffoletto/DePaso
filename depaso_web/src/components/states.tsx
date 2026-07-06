import type { ReactNode } from "react";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Bloque centrado para estados vacíos / de error dentro de una card o página. */
function Centered({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Centered>
      <div className="flex size-12 items-center justify-center rounded-full bg-cream-deep text-ink-mute">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-ink-mute">{description}</p>
        )}
      </div>
      {action}
    </Centered>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  return (
    <Centered>
      <div className="flex size-12 items-center justify-center rounded-full bg-red-bg text-red">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">No se pudo cargar</p>
        <p className="mx-auto max-w-sm text-sm text-ink-mute">
          {apiErrorMessage(error)}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="size-4" /> Reintentar
        </Button>
      )}
    </Centered>
  );
}

/** Skeleton de filas para tablas mientras carga la query. */
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Aviso para endpoints todavía no disponibles en el backend (no inventar datos). */
export function NotAvailableNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber/40 bg-amber-bg/50 px-4 py-3 text-sm text-ink-soft">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber" />
      <p>{children}</p>
    </div>
  );
}
