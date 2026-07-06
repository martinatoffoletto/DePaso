import type { ReactNode } from "react";
import { useMyOrg } from "@/features/org/useOrg";
import { CreateOrgCard } from "@/features/org/CreateOrgCard";
import { ErrorState } from "@/components/states";
import { Skeleton } from "@/components/ui/skeleton";
import type { MyOrganization } from "@/types";

/**
 * Resuelve la organización activa antes de renderizar una página de pyme.
 * - loading → skeleton
 * - sin org (403) → onboarding para crear organización
 * - error real → ErrorState con reintento
 * - ok → children(org)
 */
export function OrgGate({ children }: { children: (org: MyOrganization) => ReactNode }) {
  const { data: org, isLoading, isError, error, refetch } = useMyOrg();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <ErrorState error={error} onRetry={() => refetch()} />;
  if (!org) return <CreateOrgCard />;

  return <>{children(org)}</>;
}
