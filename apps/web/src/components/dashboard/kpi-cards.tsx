"use client";

import { SystemMetrics } from "@/lib/mock-data";
import { Radio, Cpu, Zap, HardDrive, Network } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardsProps {
  metrics: SystemMetrics | null;
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-1 w-full rounded-full bg-white/10 mt-3 overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function KPICards({ metrics }: KPICardsProps) {
  if (!metrics) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="col-span-2 sm:col-span-2 rounded-xl border border-white/10 bg-card/40 p-5 h-[110px] animate-pulse flex flex-col justify-between">
          <div className="h-3 w-20 bg-white/10 rounded" />
          <div className="h-8 w-32 bg-white/10 rounded" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-card/40 p-5 h-[110px] animate-pulse flex flex-col justify-between">
            <div className="h-3 w-12 bg-white/10 rounded" />
            <div className="h-7 w-20 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cpuColor = metrics.cpuUsage > 80 ? "bg-red-500" : metrics.cpuUsage > 60 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {/* Live Streams — spans 2 cols on all breakpoints */}
      <div className="col-span-2 sm:col-span-2 relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-card p-6">
        <div className="absolute right-2 top-2 h-20 w-20 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400/80">Live Now</span>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <Radio className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-5xl font-bold tracking-tighter text-emerald-400 leading-none">{metrics.activeStreams}</span>
          <span className="text-lg text-emerald-500/50 font-normal mb-0.5">/ {metrics.activeStreams + metrics.offlineStreams} streams</span>
        </div>
        <p className="text-xs text-emerald-400/50 mt-2">{metrics.offlineStreams} offline · System healthy</p>
      </div>

      {/* CPU */}
      <div className="rounded-2xl border border-white/10 bg-card p-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">CPU</span>
          <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <p className="text-3xl font-bold tracking-tighter mt-2">{metrics.cpuUsage}<span className="text-sm font-normal text-muted-foreground">%</span></p>
        <MiniBar value={metrics.cpuUsage} max={100} color={cpuColor} />
      </div>

      {/* RAM */}
      <div className="rounded-2xl border border-white/10 bg-card p-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">RAM</span>
          <Zap className="h-3.5 w-3.5 text-violet-400" />
        </div>
        <p className="text-3xl font-bold tracking-tighter mt-2">{metrics.ramUsed}<span className="text-sm font-normal text-muted-foreground">/{metrics.ramTotal}G</span></p>
        <MiniBar value={metrics.ramUsed} max={metrics.ramTotal} color="bg-violet-500" />
      </div>

      {/* Storage */}
      <div className="rounded-2xl border border-white/10 bg-card p-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Storage</span>
          <HardDrive className="h-3.5 w-3.5 text-sky-400" />
        </div>
        <p className="text-3xl font-bold tracking-tighter mt-2">{metrics.storageUsed}<span className="text-sm font-normal text-muted-foreground">/{metrics.storageTotal}G</span></p>
        <MiniBar value={metrics.storageUsed} max={metrics.storageTotal} color="bg-sky-500" />
      </div>
    </div>
  );
}
