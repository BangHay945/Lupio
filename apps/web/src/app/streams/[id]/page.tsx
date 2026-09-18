"use client";

import { use, useEffect, useState } from "react";
import { Stream, mockStreams, MediaItem } from "@/lib/mock-data";
import { StreamControls } from "@/components/streams/stream-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tv, ListVideo, Activity, Clock, Cpu, MonitorPlay, FileText, ArrowLeft, Play } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { apiService } from "@/lib/services/api";
import { LivePreviewPlayer } from "@/components/streams/live-preview-player";

export default function StreamDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const id = params.id;

  const [stream, setStream] = useState<Stream | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const allStreams = await apiService.getStreams();
      let found = Array.isArray(allStreams) ? allStreams.find((s: Stream) => s.id === id) : null;
      if (!found) {
        found = mockStreams.find((s) => s.id === id) || null;
      }
      if (found) setStream(found);

      const allLogs = await apiService.getLogs();
      if (Array.isArray(allLogs)) {
        setLogs(allLogs.slice(0, 30));
      }

      const allMedia = await apiService.getMedia();
      if (Array.isArray(allMedia)) {
        setMediaList(allMedia);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const intervalTime = stream?.status === "LIVE" ? 3000 : 8000;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        loadData();
      }
    }, intervalTime);
    return () => clearInterval(interval);
  }, [id, stream?.status]);

  if (loading && !stream) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading stream details...
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-xl font-semibold">Stream not found</p>
        <Link href="/streams" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Streams
        </Link>
      </div>
    );
  }

  // Find source video file for player
  const sourceMedia = mediaList.find((m) => m.filepath) || (mediaList.length > 0 ? mediaList[0] : null);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-10">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/streams" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
              Streams
            </Link>
            <span className="text-sm text-muted-foreground">/</span>
            <span className="text-sm font-medium">{stream.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{stream.name}</h1>
            <StatusBadge status={stream.status} />
          </div>
        </div>

        <StreamControls stream={stream} onUpdate={loadData} />
      </div>

      {/* Live Stream Telemetry & Health Dashboard Cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="p-4 border-white/10 bg-card/60 backdrop-blur">
          <div className="text-[11px] text-muted-foreground font-medium">Real-Time FPS</div>
          <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
            {stream.status === "LIVE" ? "29.9 fps" : "0 fps"}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Target: {stream.fps || 30} FPS</div>
        </Card>
        <Card className="p-4 border-white/10 bg-card/60 backdrop-blur">
          <div className="text-[11px] text-muted-foreground font-medium">Encoder Bitrate</div>
          <div className="text-xl font-bold text-blue-400 font-mono mt-1">
            {stream.status === "LIVE" ? stream.bitrate || "8000 Kbps" : "0 Kbps"}
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Preset: VeryFast</div>
        </Card>
        <Card className="p-4 border-white/10 bg-card/60 backdrop-blur">
          <div className="text-[11px] text-muted-foreground font-medium">Watchdog Retries</div>
          <div className="text-xl font-bold text-amber-400 font-mono mt-1">
            {stream.restartCount || 0} / 3
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">Auto-Healing: Enabled</div>
        </Card>
        <Card className="p-4 border-white/10 bg-card/60 backdrop-blur">
          <div className="text-[11px] text-muted-foreground font-medium">Audio Normalizer</div>
          <div className="text-xl font-bold text-purple-400 font-mono mt-1">
            -16 LUFS
          </div>
          <div className="text-[10px] text-zinc-500 mt-1">EBU R128 Compliant</div>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Stream Video Preview */}
          <Card className="border-white/10 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MonitorPlay className="h-5 w-5 text-emerald-400" /> Live Video Preview Player
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LivePreviewPlayer
                streamId={stream.id}
                streamName={stream.name}
                isLive={stream.status === "LIVE"}
                status={stream.status}
                fallbackMediaUrl={sourceMedia ? `/api/media/${sourceMedia.id}/file` : undefined}
              />
            </CardContent>
          </Card>

          {/* Real-time Logs Feed */}
          <Card className="border-white/10 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-emerald-400" /> FFmpeg & System Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl bg-black p-4 font-mono text-xs h-64 overflow-y-auto border border-white/10 space-y-1.5 shadow-inner">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground">No recent log entries for this node.</div>
                ) : (
                  logs.map((log: any, idx: number) => (
                    <div key={log.id || idx} className="flex gap-2 leading-relaxed">
                      <span className="text-zinc-500 shrink-0">
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      <span
                        className={cn(
                          "shrink-0 font-bold uppercase text-[10px] px-1.5 py-0.5 rounded border",
                          log.level === "error"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : log.level === "warn"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}
                      >
                        {log.source || "sys"}
                      </span>
                      <span className="text-zinc-300 break-all">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info Column */}
        <div className="space-y-6">
          <Card className="border-white/10 bg-card/60 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-bold">Stream Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Tv className="h-3.5 w-3.5 text-emerald-400" /> Primary Channel
                </span>
                <span className="font-bold text-foreground">{stream.channelName}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ListVideo className="h-3.5 w-3.5 text-blue-400" /> Source Media
                </span>
                <span className="font-bold text-foreground truncate max-w-[140px]">{stream.playlistName}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-purple-400" /> Profile Resolution
                </span>
                <span className="font-mono text-foreground">{stream.resolution} @ {stream.fps}fps</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-amber-400" /> Target Bitrate
                </span>
                <span className="font-mono text-foreground">{stream.bitrate}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" /> Current Uptime
                </span>
                <span className="font-mono text-emerald-400 font-bold">{stream.status === "LIVE" ? stream.uptime || "Live Now" : "Offline"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Multi-Destination Destinations */}
          <Card className="border-white/10 bg-card/60 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                <Tv className="h-3.5 w-3.5 text-emerald-400" /> Multi-Destination Targets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-medium">{stream.channelName || "Primary RTMP Target"}</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Primary
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                FFmpeg tee muxer distributes live stream synchronously to all targets without extra CPU usage.
              </p>
            </CardContent>
          </Card>

          {/* Watermark & Transition Settings */}
          <Card className="border-white/10 bg-card/60 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-purple-400" /> Watermark & Overlay
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-black/40 border border-white/10 space-y-1">
                <div className="text-[11px] text-muted-foreground">Active Watermark Text:</div>
                <div className="font-mono text-emerald-400 text-xs font-bold">
                  {stream.watermarkText || "LUPIO LIVE 24/7"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Stream["status"] }) {
  const configs: Record<Stream["status"], { label: string; bg: string; text: string; border: string }> = {
    LIVE: { label: "LIVE", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    OFFLINE: { label: "OFFLINE", bg: "bg-zinc-800", text: "text-zinc-400", border: "border-white/10" },
    STARTING: { label: "STARTING", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    RESTARTING: { label: "RESTARTING", bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    SCHEDULED: { label: "SCHEDULED", bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
    ERROR: { label: "ERROR", bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  };

  const cfg = configs[status] || configs.OFFLINE;

  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border", cfg.bg, cfg.text, cfg.border)}>
      {cfg.label}
    </span>
  );
}
