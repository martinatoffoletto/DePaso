import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  tone?: "forest" | "emerald" | "amber" | "violet" | "sky" | "neutral";
  loading?: boolean;
}

const TONE_BG: Record<NonNullable<StatCardProps["tone"]>, string> = {
  forest: "bg-mint text-forest-deep",
  emerald: "bg-mint text-emerald-deep",
  amber: "bg-amber-bg text-amber",
  violet: "bg-violet-bg text-violet",
  sky: "bg-sky/15 text-sky",
  neutral: "bg-cream-deep text-ink-soft",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "neutral",
  loading,
}: StatCardProps) {
  return (
    <Card className="flex items-start justify-between gap-3 p-5">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium text-ink-mute">{label}</p>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="tnum text-2xl font-semibold leading-tight text-ink">{value}</p>
        )}
        {hint && !loading && <p className="text-xs text-ink-mute">{hint}</p>}
      </div>
      {Icon && (
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            TONE_BG[tone],
          )}
        >
          <Icon className="size-5" />
        </div>
      )}
    </Card>
  );
}
