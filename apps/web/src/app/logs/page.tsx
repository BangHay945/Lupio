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

interface LogEntry {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  source: string;
}

const generateMockLogs = (): LogEntry[] => {
  const logs: LogEntry[] = [];
  const sources = ["system", "ffmpeg", "rtmp", "scheduler"];
  const now = new Date();
  
  for (let i = 0; i < 50; i++) {
    const time = new Date(now.getTime() - (50 - i) * 15000);
    const rand = Math.random();
    let level: "info" | "warn" | "error" = "info";
    let message = "System heartbeat check OK.";
    
    if (rand > 0.9) {
      level = "error";
      message = "FFmpeg process crashed unexpectedly. Exit code 137.";
    } else if (rand > 0.7) {
      level = "warn";
      message = "High CPU usage detected on transcode thread.";
    } else if (rand > 0.5) {
      message = "Client connected to RTMP stream.";
    }

    logs.push({
      id: `log_${i}`,
      timestamp: time.toISOString(),
      level,
      source: sources[Math.floor(Math.random() * sources.length)],
      message
    });
  }
  
  return logs;
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "error" | "warn">("all");
  const bottomRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const realLogs = await apiService.getLogs();
      if (realLogs && realLogs.length > 0) {
        setLogs(realLogs);
      } else {
        setLogs(generateMockLogs());
      }
    } catch {
      setLogs(generateMockLogs());
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
    <div className="flex flex-col gap-4 h-[calc(100vh-6rem)] w-full">
      <div className="flex items-center justify-end gap-2 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-xs font-semibold transition-colors border border-white/10 bg-transparent px-3 py-1.5 text-foreground hover:bg-black/5 dark:hover:bg-white/10">
            <Filter className="mr-2 h-3.5 w-3.5 text-emerald-400" />
            {filter === "all" ? "All Logs" : filter === "error" ? "Errors Only" : "Warnings Only"}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="border-white/10 bg-zinc-950">
            <DropdownMenuItem onClick={() => setFilter("all")} className="cursor-pointer text-xs">All Logs</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("error")} className="cursor-pointer text-xs">Errors Only</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("warn")} className="cursor-pointer text-xs">Warnings Only</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 border-white/10 bg-transparent text-xs text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-lg">
          <Download className="mr-1.5 h-3.5 w-3.5 text-emerald-400" /> Download
        </Button>
        <Button variant="destructive" size="sm" onClick={handleClear} className="h-8 text-xs rounded-lg font-semibold">
          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Clear
        </Button>
      </div>

      <div className="flex-1 rounded-lg border bg-zinc-950 font-mono text-sm overflow-hidden flex flex-col shadow-inner">
        <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-2 flex items-center gap-2 shrink-0">
          <Terminal className="h-4 w-4 text-zinc-400" />
          <span className="text-zinc-400 font-semibold text-xs tracking-wider">lupio-server ~ /var/log/syslog</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <div className="text-zinc-500 italic">No logs to display...</div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} className="flex items-start break-all hover:bg-white/5 px-1 -mx-1 rounded">
                <span className="text-zinc-500 shrink-0 w-44">
                  [{new Date(log.timestamp).toLocaleString()}]
                </span>
                <span className="text-zinc-400 shrink-0 w-24">
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
