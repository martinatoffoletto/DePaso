import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-ink-mute">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
