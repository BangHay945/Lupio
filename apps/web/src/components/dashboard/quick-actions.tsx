"use client";

import { buttonVariants } from "@/components/ui/button";
import { Plus, FolderUp, CalendarClock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n/language-context";

export function QuickActions() {
  const { t } = useLanguage();

  const actions = [
    {
      href: "/streams/new",
      icon: Plus,
      label: t("dash.newStream"),
      description: t("dash.startBroadcast"),
      iconBg: "bg-emerald-500/15 text-emerald-400",
      border: "hover:border-emerald-500/25 hover:bg-emerald-500/[0.04]",
    },
    {
      href: "/media",
      icon: FolderUp,
      label: t("dash.uploadMedia"),
      description: t("dash.addToLibrary"),
      iconBg: "bg-sky-500/15 text-sky-400",
      border: "hover:border-sky-500/25 hover:bg-sky-500/[0.04]",
    },
    {
      href: "/streams?tab=schedule",
      icon: CalendarClock,
      label: t("dash.schedule"),
      description: t("dash.planStream"),
      iconBg: "bg-violet-500/15 text-violet-400",
      border: "hover:border-violet-500/25 hover:bg-violet-500/[0.04]",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {t("dash.quickActions")}
      </span>
      <div className="flex flex-col gap-2">
        {actions.map(({ href, icon: Icon, label, description, iconBg, border }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "group flex items-center gap-3.5 rounded-2xl border border-white/10 bg-card p-4 transition-all",
              border
            )}
          >
            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", iconBg)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-none">{label}</p>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
