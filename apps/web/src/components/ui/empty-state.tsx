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
      "flex flex-col items-center justify-center py-16 px-6 text-center rounded-xl border border-dashed border-white/[0.10]",
      className
    )}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.05] text-muted-foreground mb-4">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-xs text-muted-foreground mt-1.5 max-w-xs leading-relaxed">{description}</p>
      {action && (
        <Link
          href={action.href}
          className={cn(buttonVariants({ size: "sm" }), "mt-5 bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25")}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
