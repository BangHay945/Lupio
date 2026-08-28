import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-white/[0.06]",
        className
      )}
      {...props}
    />
  );
}

/** Pre-built skeleton for a data table row */
function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-white/[0.05]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4" style={{ width: `${60 + Math.random() * 30}%` }} />
        </td>
      ))}
    </tr>
  );
}

/** Pre-built skeleton for a stat/KPI card */
function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-1 w-full" />
    </div>
  );
}

/** Pre-built skeleton for a media grid item */
function MediaCardSkeleton() {
  return (
    <div className="rounded-xl border border-white/[0.07] overflow-hidden">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export { Skeleton, TableRowSkeleton, StatCardSkeleton, MediaCardSkeleton };
