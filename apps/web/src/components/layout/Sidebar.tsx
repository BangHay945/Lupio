"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart2, Radio, FileVideo, ListVideo,
  Calendar, Tv, FileText, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/services/api";

const nav = [
  { label: "Dashboard", name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Analytics", name: "Analytics", href: "/analytics", icon: BarChart2 },
  { label: "Streams", name: "Streams", href: "/streams", icon: Radio },
  { label: "Media", name: "Media", href: "/media", icon: FileVideo },
  { label: "Playlists", name: "Playlists", href: "/playlists", icon: ListVideo },
  { label: "Schedule", name: "Schedule", href: "/schedule", icon: Calendar },
  { label: "Channels", name: "Channels", href: "/channels", icon: Tv },
  { label: "Logs", name: "Logs", href: "/logs", icon: FileText },
];

export function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname();
  const [liveCount, setLiveCount] = useState<number>(0);

  const loadMetrics = async () => {
    try {
      const streams = await apiService.getStreams();
      if (Array.isArray(streams)) {
        const live = streams.filter(s => s.status === "LIVE" || s.status === "STARTING" || s.status === "RESTARTING").length;
        setLiveCount(live);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-t-2xl rounded-b-none bg-card transition-all duration-200 shrink-0 border-0",
        collapsed ? "w-[48px]" : "w-56"
      )}
    >
      {/* Top Header */}
      <div className="flex h-11 shrink-0 items-center gap-2.5 px-1.5 bg-transparent">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="4 3 14 12 4 21 4 3" fill="currentColor" stroke="none" />
            <path d="M14 7a7 7 0 0 1 0 10" />
            <path d="M18 4a11 11 0 0 1 0 16" />
          </svg>
        </div>
        {!collapsed && (
          <span className="text-xs font-bold tracking-tight text-foreground truncate">
            Lupio
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-1.5 py-3 space-y-1 overflow-y-auto">
        {nav.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-200 border border-transparent overflow-hidden h-9",
                active
                  ? "sidebar-active bg-emerald-500/15 text-emerald-400 border-emerald-500/20 shadow-xs"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    active ? "text-emerald-400" : "text-zinc-400 group-hover:text-emerald-400"
                  )}
                />
              </div>
              {!collapsed && <span className="truncate pr-3 font-semibold text-xs">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — Settings & Clean Status Pill */}
      <div className="px-1.5 mb-3 pt-2.5 space-y-1">
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "group relative flex items-center rounded-xl text-xs font-semibold transition-all duration-200 border border-transparent overflow-hidden h-9",
            pathname.startsWith("/settings")
              ? "sidebar-active bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
              : "text-zinc-400 hover:bg-white/5 hover:text-white"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center">
            <Settings className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              pathname.startsWith("/settings") ? "text-emerald-400" : "text-zinc-400 group-hover:text-emerald-400"
            )} />
          </div>
          {!collapsed && <span className="truncate pr-3 font-semibold text-xs">Settings</span>}
        </Link>

        {/* Server status pill */}
        {!collapsed && (
          <div className="sidebar-status-pill flex items-center gap-2 rounded-xl bg-black/40 px-3 py-2 text-xs border border-white/10">
            <span
              className={cn(
                "h-2 w-2 rounded-full transition-all shrink-0",
                liveCount > 0 ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" : "bg-zinc-500"
              )}
            />
            <span className="text-[11px] font-medium text-foreground truncate">
              {liveCount} stream{liveCount !== 1 ? "s" : ""} live
            </span>
            <span className={cn("ml-auto text-[10px] font-bold shrink-0", liveCount > 0 ? "text-emerald-400" : "text-zinc-500")}>
              {liveCount > 0 ? "OK" : "IDLE"}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
