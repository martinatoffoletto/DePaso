import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink shadow-sm shadow-black/[0.02] transition-colors placeholder:text-ink-faint focus-visible:border-forest-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/25 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
