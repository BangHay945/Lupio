"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Terminal, Download, Trash2, Filter } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiService } from "@/lib/services/api";
import { useLanguage } from "@/lib/i18n/language-context";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  source: string;
}

export default function LogsPage() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "error" | "warn">("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const realLogs = await apiService.getLogs();
      if (Array.isArray(realLogs)) {
        setLogs(realLogs);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, filter]);

  const filteredLogs = logs.filter(log => filter === "all" ? true : log.level === filter);

  const handleClear = async () => {
    await apiService.clearLogs();
    setLogs([]);
    if (typeof toast === "function") {
      (toast as any)({ title: "Logs Cleared", description: "System logs have been emptied.", type: "success" });
    }
  };

  const handleDownload = () => {
    if (typeof toast === "function") {
      (toast as any)({ title: "Downloading...", description: "system-logs.txt is downloading.", type: "info" });
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case "error": return "text-red-400";
      case "warn": return "text-yellow-400";
      default: return "text-emerald-400";
    }
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-9rem)] w-full">
      <div className="flex items-center justify-end gap-3 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-xs font-bold transition-colors border border-slate-300 dark:border-white/10 bg-transparent h-10 px-5 text-foreground hover:bg-black/5 dark:hover:bg-white/10">
            <Filter className="mr-2 h-3.5 w-3.5 text-emerald-400" />
            {filter === "all" ? t("logs.filterAll") : filter === "error" ? t("logs.filterError") : t("logs.filterWarn")}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 border-slate-200 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 rounded-2xl p-2 shadow-xl space-y-1">
            <DropdownMenuItem onClick={() => setFilter("all")} className="menu-pill-item cursor-pointer">{t("logs.filterAll")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("error")} className="menu-pill-item cursor-pointer">{t("logs.filterError")}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("warn")} className="menu-pill-item cursor-pointer">{t("logs.filterWarn")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" onClick={handleDownload} className="h-10 px-5 border-slate-300 dark:border-white/10 bg-transparent text-xs font-bold text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-all hover:scale-[1.02]">
          <Download className="mr-2 h-3.5 w-3.5 text-emerald-400" /> {t("logs.download")}
        </Button>
        <Button variant="destructive" onClick={handleClear} className="h-10 px-5 text-xs rounded-full font-bold transition-all hover:scale-[1.02]">
          <Trash2 className="mr-2 h-3.5 w-3.5" /> {t("logs.clear")}
        </Button>
      </div>

      <div className="flex-1 min-h-0 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-zinc-950 font-mono text-sm overflow-hidden flex flex-col shadow-inner">
        <div className="bg-slate-100/80 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 px-4 py-2.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5 mr-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400/80 dark:bg-red-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80 dark:bg-yellow-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80 dark:bg-emerald-500/80 inline-block" />
            </div>
            <Terminal className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            <span className="text-slate-600 dark:text-zinc-400 font-semibold text-xs tracking-wider">lupio-server ~ /var/log/syslog</span>
          </div>
          <span className="text-[11px] text-muted-foreground font-sans">
            {filteredLogs.length} {filteredLogs.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="text-muted-foreground italic text-xs py-4 text-center">No logs to display...</div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="flex items-start break-all hover:bg-black/5 dark:hover:bg-white/5 px-1.5 py-0.5 rounded transition-colors text-xs leading-relaxed">
                <span className="text-muted-foreground shrink-0 w-44 font-sans text-[11px]">
                  [{new Date(log.timestamp).toLocaleString()}]
                </span>
                <span className="text-slate-500 dark:text-zinc-400 shrink-0 w-24 font-bold text-[11px]">
                  [{log.source}]
                </span>
                <span className={cn("flex-1", getLogColor(log.level))}>
                  {log.message}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div>
    </div>
  );
}
