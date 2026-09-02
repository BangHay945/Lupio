"use client";

import { useState } from "react";
import { Stream } from "@/lib/mock-data";
import { Play, Square, RotateCcw, ArrowRight, Clock, Layers, AlertTriangle, Radio, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

interface ActiveStreamsProps {
  streams: Stream[];
  onRefresh?: () => void;
}

const statusConfig: Record<Stream["status"], {
  label: string;
  rowBg: string;
  leftBar: string;
  badge: string;
  dot: string;
}> = {
  LIVE:       { label: "LIVE",       rowBg: "hover:bg-emerald-500/[0.04]",  leftBar: "bg-emerald-500",  badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500 animate-pulse" },
  OFFLINE:    { label: "OFFLINE",    rowBg: "hover:bg-black/5 dark:hover:bg-white/[0.02]", leftBar: "bg-slate-300 dark:bg-white/10", badge: "bg-slate-200/80 text-slate-600 border-slate-300 dark:bg-white/5 dark:text-white/30 dark:border-white/10", dot: "bg-slate-400 dark:bg-white/30" },
  STARTING:   { label: "STARTING",   rowBg: "hover:bg-amber-500/[0.04]",    leftBar: "bg-amber-500",    badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",       dot: "bg-amber-500 animate-pulse" },
  RESTARTING: { label: "RESTART",    rowBg: "hover:bg-amber-500/[0.04]",    leftBar: "bg-amber-500",    badge: "bg-amber-500/15 text-amber-400 border-amber-500/20",       dot: "bg-amber-500 animate-pulse" },
  SCHEDULED:  { label: "SCHEDULED",  rowBg: "hover:bg-blue-500/[0.04]",     leftBar: "bg-blue-500",     badge: "bg-blue-500/15 text-blue-400 border-blue-500/20",          dot: "bg-blue-400" },
  ERROR:      { label: "ERROR",      rowBg: "hover:bg-red-500/[0.04]",      leftBar: "bg-red-500",      badge: "bg-red-500/15 text-red-400 border-red-500/20",             dot: "bg-red-500 animate-pulse" },
};

export function ActiveStreams({ streams, onRefresh }: ActiveStreamsProps) {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const live = streams.filter(s => s.status === "LIVE" || s.status === "STARTING" || s.status === "RESTARTING");

  const handleAction = async (streamId: string, action: "start" | "stop" | "restart") => {
    if (loadingKey) return;
    setLoadingKey(`${streamId}-${action}`);
    try {
      await fetch(`/api/streams/${streamId}/${action}`, { method: "POST" });
      setTimeout(() => {
        onRefresh?.();
        setLoadingKey(null);
      }, 1500);
    } catch {
      setLoadingKey(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Radio className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Streams
        </span>
        <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
          {live.length} live
        </span>
        <Link href="/streams" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "text-xs text-muted-foreground h-6 ml-auto")}>
          View All <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </div>

      {/* Stream rows */}
      <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
        {streams.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No streams configured. Create a stream to start broadcasting.
          </div>
        ) : (
          streams.map((stream, i) => {
            const cfg = statusConfig[stream.status];
            const isLast = i === streams.length - 1;
            const isStarting  = loadingKey === `${stream.id}-start`;
            const isStopping  = loadingKey === `${stream.id}-stop`;
            const isRestarting = loadingKey === `${stream.id}-restart`;
            const anyLoading  = isStarting || isStopping || isRestarting;

            return (
              <div
                key={stream.id}
                className={cn(
                  "group relative flex items-center gap-4 px-4 py-3.5 transition-colors",
                  cfg.rowBg,
                  !isLast && "border-b border-white/[0.05]"
                )}
              >
                {/* Left color bar */}
                <div className={cn("absolute left-0 top-0 bottom-0 w-0.5", cfg.leftBar)} />

                {/* Status dot */}
                <div className={cn("h-2 w-2 rounded-full shrink-0 ml-2", cfg.dot)} />

                {/* Main info */}
                <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] items-center gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link
                        href={`/streams/${stream.id}`}
                        className="text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
                      >
                        {stream.name}
                      </Link>
                      {stream.status === "ERROR" && (
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <Layers className="h-3 w-3 shrink-0" />
                      <span className="truncate">{stream.playlistName}</span>
                      <span className="text-white/15">·</span>
                      <span>{stream.resolution}</span>
                      <span className="text-white/15">·</span>
                      <span>{stream.bitrate}</span>
                      {stream.uptime !== "0m" && (
                        <>
                          <span className="text-white/15">·</span>
                          <Clock className="h-3 w-3 shrink-0" />
                          <span>{stream.uptime}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-[11px] font-bold tracking-wider px-2 py-0.5 rounded-full border", cfg.badge)}>
                      {cfg.label}
                    </span>

                    {/* Action buttons — visible on row hover */}
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {stream.status === "OFFLINE" || stream.status === "ERROR" ? (
                        <button
                          onClick={() => handleAction(stream.id, "start")}
                          disabled={anyLoading}
                          title="Start Stream"
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isStarting
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Play className="h-3.5 w-3.5" />
                          }
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAction(stream.id, "restart")}
                            disabled={anyLoading}
                            title="Restart Stream"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/60 hover:bg-white/15 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isRestarting
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <RotateCcw className="h-3.5 w-3.5" />
                            }
                          </button>
                          <button
                            onClick={() => handleAction(stream.id, "stop")}
                            disabled={anyLoading}
                            title="Stop Stream"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isStopping
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Square className="h-3.5 w-3.5" />
                            }
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
