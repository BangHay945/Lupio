import { buttonVariants } from "@/components/ui/button";
import { Plus, FolderUp, CalendarClock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const actions = [
  {
    href: "/streams/new",
    icon: Plus,
    label: "New Stream",
    description: "Start a broadcast",
    iconBg: "bg-emerald-500/15 text-emerald-400",
    border: "hover:border-emerald-500/25 hover:bg-emerald-500/[0.04]",
  },
  {
    href: "/media",
    icon: FolderUp,
    label: "Upload Media",
    description: "Add to library",
    iconBg: "bg-sky-500/15 text-sky-400",
    border: "hover:border-sky-500/25 hover:bg-sky-500/[0.04]",
  },
  {
    href: "/schedule",
    icon: CalendarClock,
    label: "Schedule",
    description: "Plan a stream",
    iconBg: "bg-violet-500/15 text-violet-400",
    border: "hover:border-violet-500/25 hover:bg-violet-500/[0.04]",
  },
];

export function QuickActions() {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        Quick Actions
      </span>
      <div className="flex flex-col gap-2">
        {actions.map(({ href, icon: Icon, label, description, iconBg, border }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-3 rounded-xl border border-white/10 bg-card p-3.5 transition-all",
              border
            )}
          >
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", iconBg)}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground leading-none">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
