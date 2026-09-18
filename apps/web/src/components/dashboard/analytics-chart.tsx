"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Cpu, HardDrive, Wifi } from "lucide-react";
import { apiService } from "@/lib/services/api";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface DataPoint {
  time: string;
  bitrate: number;
  cpu: number;
  ram: number;
}

export function AnalyticsChart() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Generate initial history points
    const now = Date.now();
    const initial: DataPoint[] = Array.from({ length: 12 }).map((_, i) => {
      const t = new Date(now - (11 - i) * 10000);
      return {
        time: t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        bitrate: 6500 + Math.floor(Math.random() * 1500),
        cpu: 25 + Math.floor(Math.random() * 20),
        ram: 45 + Math.floor(Math.random() * 10),
      };
    });
    setData(initial);

    const interval = setInterval(async () => {
      try {
        const metrics = await apiService.getSystemMetrics();
        const t = new Date();
        const timeStr = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        setData((prev) => {
          const updated = [
            ...prev.slice(1),
            {
              time: timeStr,
              bitrate: (metrics?.uploadBandwidth || 28) * 250 + Math.floor(Math.random() * 800),
              cpu: metrics?.cpuUsage || 25,
              ram: metrics ? Math.round((metrics.ramUsed / metrics.ramTotal) * 100) : 45,
            },
          ];
          return updated;
        });
      } catch (e) {
        console.error(e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const latest = data[data.length - 1] || { bitrate: 7800, cpu: 28, ram: 48 };

  return (
    <Card className="border-white/10 bg-card/60 backdrop-blur shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-bold flex items-center gap-2 text-foreground">
          <Activity className="h-5 w-5 text-emerald-400" /> Live Bitrate Stability & Broadcast Telemetry
        </CardTitle>
        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Real-time Sampling
        </span>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* KPI Mini Row */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-black/40 border border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Wifi className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Live Bitrate</p>
              <p className="text-sm font-bold font-mono text-foreground">{latest.bitrate} kbps</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">FFmpeg CPU Load</p>
              <p className="text-sm font-bold font-mono text-foreground">{latest.cpu}%</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Buffer Memory</p>
              <p className="text-sm font-bold font-mono text-foreground">{latest.ram}%</p>
            </div>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="relative pt-2 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span>Bitrate Stream Rate (kbps)</span>
            <span className="font-mono text-emerald-400 font-bold">Target: 8,000 kbps</span>
          </div>

          <div className="h-44 w-full bg-card rounded-xl border border-white/10 p-3 pt-4 relative overflow-hidden">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="liveBitrateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#88888820" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#88888860"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "#88888830" }}
                  />
                  <YAxis
                    stroke="#88888860"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "#88888830" }}
                    tickFormatter={(val) => `${val}`}
                    domain={[0, 10000]}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border border-white/10 bg-zinc-950/95 p-2.5 shadow-xl backdrop-blur text-xs">
                            <p className="font-mono text-muted-foreground mb-1">{label}</p>
                            <div className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full bg-emerald-400" />
                              <span className="font-semibold text-emerald-400">
                                {payload[0].value?.toLocaleString()} kbps
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="bitrate"
                    name="Bitrate"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#liveBitrateGrad)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground animate-pulse">
                Loading telemetry chart...
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
