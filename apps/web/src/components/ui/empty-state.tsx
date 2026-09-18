import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "empty-state-wrapper flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl w-full",
      className
    )}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-emerald-500 mb-4 shadow-xs">
        <Icon className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1.5 max-w-sm leading-relaxed">{description}</p>
      {action && (
        <Link
          href={action.href}
          className={cn(buttonVariants({ size: "sm" }), "mt-5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold h-9 px-5 rounded-full shadow-lg shadow-emerald-500/20 gap-2 text-xs transition-all hover:scale-[1.02]")}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
