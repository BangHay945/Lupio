"use client";

import { useEffect, useState } from "react";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { ActiveStreams } from "@/components/dashboard/active-streams";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { SystemMetrics, Stream } from "@/lib/mock-data";
import { apiService } from "@/lib/services/api";

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [fetchedMetrics, fetchedStreams] = await Promise.all([
        apiService.getSystemMetrics(),
        apiService.getStreams(),
      ]);
      if (fetchedMetrics) setMetrics(fetchedMetrics);
      if (Array.isArray(fetchedStreams)) setStreams(fetchedStreams);
    } catch (e) {
      console.error("Dashboard fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Realtime Server Operational KPI Status Cards */}
      <KPICards metrics={metrics} />

      {/* Main Operational Control Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_260px] items-start">
        {loading ? (
          <div className="p-12 rounded-xl border border-white/10 bg-card/60 backdrop-blur text-center text-xs text-muted-foreground animate-pulse">
            Loading live operational streams...
          </div>
        ) : (
          <ActiveStreams streams={streams} />
        )}
        <QuickActions />
      </div>
    </div>
  );
}
