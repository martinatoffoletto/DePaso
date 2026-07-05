import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-cream-deep text-ink-soft",
        forest: "bg-mint text-forest-deep",
        emerald: "bg-mint text-emerald-deep",
        amber: "bg-amber-bg text-amber",
        red: "bg-red-bg text-red",
        violet: "bg-violet-bg text-violet",
        sky: "bg-sky/15 text-sky",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
