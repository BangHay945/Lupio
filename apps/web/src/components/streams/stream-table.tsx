"use client";

import { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Stream, ScheduleRule, Playlist } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { 
  Search, Settings, Play, Square, RotateCcw, MoreHorizontal, Radio, 
  Trash2, Plus, Pencil, LayoutGrid, List, ListFilter, Clock, Calendar, 
  RotateCw, ShieldCheck, Film, CheckCircle2 
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { CreateStreamDialog } from "@/components/streams/create-stream-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CustomSelect } from "@/components/ui/select";
import { apiService } from "@/lib/services/api";
import { useLanguage } from "@/lib/i18n/language-context";

interface StreamTableProps {
  streams: Stream[];
}

export function StreamTable({ streams }: StreamTableProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "schedule" ? "schedule" : "streams";

  const [mainTab, setMainTab] = useState<"streams" | "schedule">(initialTab);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [localStreams, setLocalStreams] = useState<Stream[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);

  // Time Rule Modal State
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleStartTime, setRuleStartTime] = useState("08:00");
  const [ruleEndTime, setRuleEndTime] = useState("18:00");
  const [ruleAction, setRuleAction] = useState<"switch" | "start" | "stop">("switch");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [savingRule, setSavingRule] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "stop" | "restart" | "delete" | null;
    streamId: string | null;
    streamName: string;
  }>({ open: false, type: null, streamId: null, streamName: "" });

  const loadData = async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      const [stData, plData, ruleData] = await Promise.all([
        apiService.getStreams(),
        apiService.getPlaylists(),
        apiService.getScheduleRules(),
      ]);
      if (Array.isArray(stData)) setLocalStreams(stData);
      if (Array.isArray(plData)) {
        setPlaylists(plData);
        if (plData.length > 0 && !selectedPlaylistId) setSelectedPlaylistId(plData[0].id);
      }
      if (Array.isArray(ruleData)) setScheduleRules(ruleData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const hasLive = localStreams.some(s => s.status === "LIVE" || s.status === "STARTING" || s.status === "RESTARTING");
    const intervalTime = hasLive ? 3000 : 8000;
    const interval = setInterval(loadData, intervalTime);
    return () => clearInterval(interval);
  }, [localStreams.map(s => s.status).join(",")]);

  const filteredStreams = localStreams.filter(stream =>
    stream.name.toLowerCase().includes(search.toLowerCase()) ||
    stream.channelName.toLowerCase().includes(search.toLowerCase())
  );

  const openConfirm = (type: "stop" | "restart" | "delete", stream: Stream) => {
    setConfirmDialog({ open: true, type, streamId: stream.id, streamName: stream.name });
  };

  const handleConfirm = async () => {
    const { type, streamId, streamName } = confirmDialog;
    if (!streamId || !type) return;

    if (type === "stop") {
      await apiService.controlStream(streamId, "stop");
      setLocalStreams(prev => prev.map(s => s.id === streamId ? { ...s, status: "OFFLINE" as const } : s));
      (toast as any)({ title: "Stream Stopped", description: `"${streamName}" has been stopped.`, type: "info" });
    } else if (type === "restart") {
      await apiService.controlStream(streamId, "restart");
      setLocalStreams(prev => prev.map(s => s.id === streamId ? { ...s, status: "STARTING" as const } : s));
      (toast as any)({ title: "Stream Restarting", description: `"${streamName}" is restarting…`, type: "info" });
    } else if (type === "delete") {
      await apiService.deleteStream(streamId);
      setLocalStreams(prev => prev.filter(s => s.id !== streamId));
      (toast as any)({ title: "Stream Deleted", description: `"${streamName}" has been removed.`, type: "error" });
    }
  };

  const handleAction = async (type: "stop" | "restart" | "delete", streamId: string, streamName: string) => {
    if (type === "stop") {
      await apiService.controlStream(streamId, "stop");
      setLocalStreams(prev => prev.map(s => s.id === streamId ? { ...s, status: "OFFLINE" as const } : s));
      (toast as any)({ title: "Stream Stopped", description: `"${streamName}" has been stopped.`, type: "info" });
    } else if (type === "restart") {
      await apiService.controlStream(streamId, "restart");
      setLocalStreams(prev => prev.map(s => s.id === streamId ? { ...s, status: "STARTING" as const } : s));
      (toast as any)({ title: "Stream Restarting", description: `"${streamName}" is restarting…`, type: "info" });
    } else if (type === "delete") {
      await apiService.deleteStream(streamId);
      setLocalStreams(prev => prev.filter(s => s.id !== streamId));
      (toast as any)({ title: "Stream Deleted", description: `"${streamName}" has been removed.`, type: "error" });
    }
  };

  const handleCreateRule = async () => {
    if (ruleAction !== "stop" && !selectedPlaylistId) {
      (toast as any)({ title: "Validation Error", description: "Please select a target playlist.", type: "error" });
      return;
    }

    setSavingRule(true);
    try {
      const pl = playlists.find((p) => p.id === selectedPlaylistId);
      const actionName = ruleAction === "stop" ? "🛑 Scheduled Stop" : ruleAction === "start" ? `▶️ Start: ${pl?.name}` : (pl?.name || "Target Playlist");
      const newRule = await apiService.saveScheduleRule({
        streamName: "All Streams",
        startTime: ruleStartTime,
        endTime: ruleEndTime,
        playlistId: ruleAction === "stop" ? "none" : selectedPlaylistId,
        playlistName: actionName,
        active: true,
        action: ruleAction,
      });

      setScheduleRules((prev) => [...prev, newRule]);
      (toast as any)({
        title: "Schedule Rule Saved! ⏰",
        description: `Action "${ruleAction.toUpperCase()}" scheduled for ${ruleStartTime}-${ruleEndTime}.`,
        type: "success",
      });
      setRuleModalOpen(false);
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await apiService.deleteScheduleRule(id);
      setScheduleRules((prev) => prev.filter((r) => r.id !== id));
      (toast as any)({ title: "Rule Deleted", description: "Schedule rule removed.", type: "info" });
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    }
  };

  const confirmConfig: Record<"stop" | "restart" | "delete", { title: string; description: string; label: string; variant: "destructive" | "default" }> = {
    stop: {
      title: "Stop Stream",
      description: `Are you sure you want to stop "${confirmDialog.streamName}"? The stream will go offline immediately.`,
      label: "Stop Stream",
      variant: "destructive",
    },
    restart: {
      title: "Restart Stream",
      description: `Restart "${confirmDialog.streamName}"? The stream will briefly go offline and reconnect.`,
      label: "Restart",
      variant: "default",
    },
    delete: {
      title: "Delete Stream",
      description: `Permanently delete "${confirmDialog.streamName}"? This action cannot be undone.`,
      label: "Delete",
      variant: "destructive",
    },
  };

  const cfg = confirmDialog.type ? confirmConfig[confirmDialog.type] : null;

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Top Main Mode Tab Switcher — Streams vs 24/7 Schedule */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="pill-tab-switcher flex items-center p-1.5 rounded-full border border-slate-300 dark:border-white/10 bg-transparent text-xs">
          <button
            onClick={() => setMainTab("streams")}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-colors duration-150 text-xs border",
              mainTab === "streams" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-xs" : "border-transparent text-muted-foreground hover:text-white"
            )}
          >
            <Radio className="h-4 w-4" /> {t("table.tabStreams")} ({localStreams.length})
          </button>
          <button
            onClick={() => setMainTab("schedule")}
            className={cn(
              "flex items-center gap-2 px-5 py-2 rounded-full font-semibold transition-colors duration-150 text-xs border",
              mainTab === "schedule" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-xs" : "border-transparent text-muted-foreground hover:text-white"
            )}
          >
            <Clock className="h-4 w-4" /> {t("table.tabSchedule")} ({scheduleRules.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          {mainTab === "schedule" && (
            <Button
              onClick={() => setRuleModalOpen(true)}
              variant="outline"
              className="font-bold gap-2 text-xs border-white/15 bg-white/5 hover:bg-white/10 rounded-full h-10 px-5"
            >
              <Clock className="h-4 w-4 text-emerald-400" /> {t("table.btnAddRule")}
            </Button>
          )}
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold gap-2 rounded-full h-10 px-5 shadow-lg shadow-emerald-500/10 text-xs"
          >
            <Plus className="h-4 w-4 fill-black" /> {t("table.btnNewStream")}
          </Button>
        </div>
      </div>

      {/* TAB 1: ALL STREAMS VIEW */}
      {mainTab === "streams" && (
        <div className="space-y-4">
          {/* Sub-controls: Search + Table/Grid View Switcher */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative w-64">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("table.searchPlaceholder")}
                className="pl-9 pr-4 bg-card/60 border-white/10 rounded-full h-10.5 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="pill-tab-switcher flex items-center p-1.5 rounded-full border border-slate-300 dark:border-white/10 bg-transparent text-xs">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "flex items-center gap-2 px-4.5 py-2 rounded-full font-semibold transition-all text-xs",
                  viewMode === "table" ? "bg-emerald-500/20 text-emerald-400 shadow-xs" : "text-muted-foreground hover:text-white"
                )}
              >
                <List className="h-3.5 w-3.5" /> {viewMode === "table" ? (t("table.actions") === "Aksi" ? "Tampilan Tabel" : "Table View") : (t("table.actions") === "Aksi" ? "Tabel" : "Table")}
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "flex items-center gap-2 px-4.5 py-2 rounded-full font-semibold transition-all text-xs",
                  viewMode === "grid" ? "bg-emerald-500/20 text-emerald-400 shadow-xs" : "text-muted-foreground hover:text-white"
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> {viewMode === "grid" ? (t("table.actions") === "Aksi" ? "Tampilan Grid" : "Grid View") : (t("table.actions") === "Aksi" ? "Grid" : "Grid")}
              </button>
            </div>
          </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-xs text-muted-foreground animate-pulse rounded-xl border border-white/10 bg-card">
          Loading active streams...
        </div>
      ) : filteredStreams.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
          {search ? (
            <EmptyState
              icon={Search}
              title="No streams found"
              description={`No streams match "${search}". Try a different search term.`}
              className="border-none rounded-none"
            />
          ) : (
            <EmptyState
              icon={Radio}
              title="No streams yet"
              description="You haven't created any streams. Start by creating your first 24/7 live broadcast."
              action={{ label: "+ Create Stream", href: "/streams/new" }}
              className="border-none rounded-none"
            />
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW LAYOUT */
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredStreams.map((stream) => (
            <div
              key={stream.id}
              className="rounded-2xl border border-white/10 bg-card p-5 flex flex-col justify-between gap-4 shadow-sm hover:border-white/20 transition-all group"
            >
              {/* Card Header — Name, Channel, Status & 3-Dots Action Menu */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/streams/${stream.id}`}
                    className="text-base font-bold text-foreground hover:text-emerald-400 transition-colors truncate block"
                  >
                    {stream.name}
                  </Link>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {stream.channelName}
                  </p>
                </div>

                {/* Status Badge & 3-Dots Action Button */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusBadge status={stream.status} />

                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-transparent text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Stream Actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-white/10 bg-zinc-950 p-2 w-48 rounded-2xl shadow-2xl">
                      <div className="flex flex-col gap-1.5">
                        <DropdownMenuItem
                          onClick={() => router.push(`/streams/${stream.id}`)}
                          className="menu-pill-item cursor-pointer"
                        >
                          <Settings className="mr-2 h-4 w-4 text-emerald-400 shrink-0" /> {t("table.editStream")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="menu-pill-item cursor-pointer"
                          onClick={() => {
                            setEditingStream(stream);
                            setIsCreateOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4 text-emerald-400 shrink-0" /> {t("action.edit")}
                        </DropdownMenuItem>
                        {stream.status === "OFFLINE" || stream.status === "ERROR" ? (
                          <DropdownMenuItem
                            className="menu-pill-item text-emerald-400 focus:text-emerald-400 cursor-pointer"
                            onClick={async () => {
                              await apiService.controlStream(stream.id, "start");
                              setLocalStreams(prev => prev.map(s => s.id === stream.id ? { ...s, status: "STARTING" as const } : s));
                              (toast as any)({ title: "Stream Starting", description: `"${stream.name}" is starting…`, type: "success" });
                            }}
                          >
                            <Play className="mr-2 h-4 w-4 shrink-0" /> {t("action.start")}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="menu-pill-item text-amber-400 cursor-pointer"
                            onClick={() => openConfirm("restart", stream)}
                          >
                            <RotateCcw className="mr-2 h-4 w-4 shrink-0" /> {t("action.restart")}
                          </DropdownMenuItem>
                        )}
                        {stream.status !== "OFFLINE" && (
                          <DropdownMenuItem
                            className="menu-pill-item text-red-400 focus:text-red-400 cursor-pointer"
                            onClick={() => openConfirm("stop", stream)}
                          >
                            <Square className="mr-2 h-4 w-4 shrink-0" /> {t("action.stop")}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="menu-pill-item text-red-400 focus:text-red-400 hover:bg-red-500/10 cursor-pointer"
                          onClick={() => openConfirm("delete", stream)}
                        >
                          <Trash2 className="mr-2 h-4 w-4 shrink-0" /> {t("action.delete")}
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Card Meta Details */}
              <div className="space-y-1 text-xs text-muted-foreground bg-black/5 dark:bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span>Playlist:</span>
                  <span className="font-semibold text-foreground truncate max-w-[140px]">{stream.playlistName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Preset:</span>
                  <span className="font-semibold text-foreground">{stream.resolution}</span>
                </div>
              </div>

              {/* Action Button */}
              {stream.status === "OFFLINE" || stream.status === "ERROR" ? (
                <Button
                  onClick={async () => {
                    await apiService.controlStream(stream.id, "start");
                    setLocalStreams(prev => prev.map(s => s.id === stream.id ? { ...s, status: "STARTING" as const } : s));
                    (toast as any)({ title: "Stream Starting", description: `"${stream.name}" is starting…`, type: "success" });
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold gap-2 rounded-full h-10 text-xs shadow-md shadow-emerald-500/10"
                >
                  <Play className="h-3.5 w-3.5 fill-black" /> Start Stream Now
                </Button>
              ) : (
                <Button
                  onClick={() => router.push(`/streams/${stream.id}`)}
                  variant="outline"
                  className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold gap-2 rounded-full h-10 text-xs"
                >
                  <Settings className="h-3.5 w-3.5" /> Manage Live Stream
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW LAYOUT */
        <div className="rounded-2xl border border-white/10 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.07] hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("table.title")}</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("dash.channels")}</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("table.status")}</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Output</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Uptime</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStreams.map((stream) => (
                <TableRow key={stream.id} className="border-white/[0.05] hover:bg-white/[0.03]">
                  <TableCell className="font-medium">
                    <Link href={`/streams/${stream.id}`} className="hover:text-primary transition-colors">
                      {stream.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{stream.channelName}</TableCell>
                  <TableCell><StatusBadge status={stream.status} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{stream.resolution} @ {stream.fps}fps</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{stream.uptime}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8.5 w-8.5 rounded-full border border-white/[0.07] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-white/10 bg-zinc-950 p-2 w-48 rounded-2xl shadow-2xl">
                        <div className="flex flex-col gap-1.5">
                          <DropdownMenuItem
                            onClick={() => router.push(`/streams/${stream.id}`)}
                            className="menu-pill-item cursor-pointer"
                          >
                            <Settings className="mr-2 h-4 w-4 text-emerald-400 shrink-0" /> {t("table.editStream")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="menu-pill-item cursor-pointer"
                            onClick={() => {
                              setEditingStream(stream);
                              setIsCreateOpen(true);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4 text-emerald-400 shrink-0" /> {t("action.edit")}
                          </DropdownMenuItem>
                          {stream.status === "OFFLINE" || stream.status === "ERROR" ? (
                            <DropdownMenuItem
                              className="menu-pill-item text-emerald-400 focus:text-emerald-400 cursor-pointer"
                              onClick={async () => {
                                await apiService.controlStream(stream.id, "start");
                                setLocalStreams(prev => prev.map(s => s.id === stream.id ? { ...s, status: "STARTING" as const } : s));
                                (toast as any)({ title: "Stream Starting", description: `"${stream.name}" is starting…`, type: "success" });
                              }}
                            >
                              <Play className="mr-2 h-4 w-4 shrink-0" /> {t("action.start")}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="menu-pill-item text-amber-400 cursor-pointer"
                              onClick={() => openConfirm("restart", stream)}
                            >
                              <RotateCcw className="mr-2 h-4 w-4 shrink-0" /> {t("action.restart")}
                            </DropdownMenuItem>
                          )}
                          {stream.status !== "OFFLINE" && (
                            <DropdownMenuItem
                              className="menu-pill-item text-red-400 focus:text-red-400 cursor-pointer"
                              onClick={() => openConfirm("stop", stream)}
                            >
                              <Square className="mr-2 h-4 w-4 shrink-0" /> {t("action.stop")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="menu-pill-item text-red-400 focus:text-red-400 hover:bg-red-500/10 cursor-pointer"
                            onClick={() => openConfirm("delete", stream)}
                          >
                            <Trash2 className="mr-2 h-4 w-4 shrink-0" /> {t("action.delete")}
                          </DropdownMenuItem>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )}

  {/* TAB 2: 24/7 SCHEDULE & TIMELINE PLANNER VIEW */}
  {mainTab === "schedule" && (
    <div className="space-y-6">
      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-white/10 bg-card/60 backdrop-blur flex items-center gap-3.5">
          <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black">{localStreams.length}</div>
            <div className="text-xs text-muted-foreground font-semibold">Configured Streams</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-card/60 backdrop-blur flex items-center gap-3.5">
          <div className="p-3 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RotateCw className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black">{scheduleRules.length} Active</div>
            <div className="text-xs text-muted-foreground font-semibold">Auto-Switcher Rules</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-card/60 backdrop-blur flex items-center gap-3.5">
          <div className="p-3 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black">100%</div>
            <div className="text-xs text-muted-foreground font-semibold">Watchdog Auto-Healing</div>
          </div>
        </div>
      </div>

      {/* Smart Time-Based Playlist Auto-Switcher Rules Section */}
      <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">Smart Time-Based Playlist Auto-Switcher Rules</h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
              Live Engine Active
            </span>
          </div>
          <button
            onClick={() => setRuleModalOpen(true)}
            className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> New Time Rule
          </button>
        </div>

        {scheduleRules.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground">
            No time rules configured. Click &quot;+ New Time Rule&quot; to automate playlist switching by hour.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
            {scheduleRules.map((rule) => (
              <div key={rule.id} className="p-4 rounded-2xl border border-white/10 bg-black/40 flex items-center justify-between">
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground truncate">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                      {rule.startTime} – {rule.endTime}
                    </span>
                    <span className="truncate">{rule.playlistName}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Applies to: <span className="text-white/80 font-semibold">{rule.streamName || "All Streams"}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  title="Delete Rule"
                  className="text-muted-foreground hover:text-red-400 p-1.5 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 24-Hour Visual Timeline */}
      <div className="p-6 rounded-2xl border border-white/10 bg-card/60 backdrop-blur space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">24-Hour Broadcast Timeline Visualizer</h3>
          </div>
          <span className="text-xs text-muted-foreground font-mono">00:00 — 23:59 (WIB)</span>
        </div>

        {/* Timeline hour marks */}
        <div className="space-y-2">
          <div className="grid grid-cols-12 gap-1 text-[10px] text-muted-foreground text-center font-mono font-semibold">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i}>{String(i * 2).padStart(2, "0")}:00</div>
            ))}
          </div>

          <div className="h-10 w-full bg-black/50 rounded-xl border border-white/10 overflow-hidden flex relative p-1 gap-1">
            {scheduleRules.length === 0 ? (
              <div className="w-full h-full bg-emerald-500/20 rounded-lg flex items-center justify-center text-xs font-semibold text-emerald-400">
                Default 24/7 Continuous Loop Active
              </div>
            ) : (
              scheduleRules.map((rule, idx) => (
                <div
                  key={rule.id}
                  className="flex-1 h-full rounded-lg bg-emerald-500/25 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-300 truncate px-2"
                >
                  {rule.startTime}-{rule.endTime}: {rule.playlistName}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Scheduled Stream Cards List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-foreground">Configured Streams Ready For Broadcast</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {localStreams.map((stream) => (
            <div key={stream.id} className="p-5 rounded-2xl border border-white/10 bg-card/60 backdrop-blur space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{stream.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{stream.channelName || "RTMP Stream Target"}</p>
                </div>
                <StatusBadge status={stream.status} />
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground bg-black/30 p-3 rounded-xl border border-white/10">
                <div className="flex items-center justify-between">
                  <span>Active Playlist:</span>
                  <span className="font-semibold text-foreground truncate max-w-[150px]">{stream.playlistName || "Default"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Output Specs:</span>
                  <span className="font-semibold text-foreground">{stream.resolution} @ {stream.fps || 30}FPS</span>
                </div>
              </div>

              {stream.status === "OFFLINE" || stream.status === "ERROR" ? (
                <Button
                  onClick={async () => {
                    await apiService.controlStream(stream.id, "start");
                    setLocalStreams(prev => prev.map(s => s.id === stream.id ? { ...s, status: "STARTING" as const } : s));
                    (toast as any)({ title: "Stream Starting", description: `"${stream.name}" is starting…`, type: "success" });
                  }}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold gap-2 rounded-full h-10 text-xs shadow-md shadow-emerald-500/10"
                >
                  <Play className="h-3.5 w-3.5 fill-black" /> Start Stream Now
                </Button>
              ) : (
                <Button
                  onClick={() => router.push(`/streams/${stream.id}`)}
                  variant="outline"
                  className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold gap-2 rounded-full h-10 text-xs"
                >
                  <Settings className="h-3.5 w-3.5" /> Manage Live Stream
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* Confirm Dialog */}
  {cfg && (
    <ConfirmDialog
      open={confirmDialog.open}
      onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      title={cfg.title}
      description={cfg.description}
      confirmLabel={cfg.label}
      variant={cfg.variant}
      onConfirm={handleConfirm}
    />
  )}

  {/* Create / Edit Stream Modal Popup */}
  <CreateStreamDialog
    open={isCreateOpen}
    onOpenChange={(open) => {
      setIsCreateOpen(open);
      if (!open) setEditingStream(null);
    }}
    stream={editingStream}
    onSuccess={loadData}
  />

  {/* Time-Based Playlist Rule Modal Dialog */}
  <Dialog open={ruleModalOpen} onOpenChange={setRuleModalOpen}>
    <DialogContent className="border border-slate-200 dark:border-white/10 bg-white/98 dark:bg-zinc-950/98 text-foreground sm:max-w-md rounded-2xl shadow-2xl p-6">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base font-bold">
          <Clock className="h-4 w-4 text-emerald-400" /> Add 24/7 Schedule Automation Rule
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-3">
        {/* Action Type Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Rule Action Type</label>
          <CustomSelect
            value={ruleAction}
            onChange={(val) => setRuleAction(val as any)}
            options={[
              { value: "switch", label: "🔄 Switch Playlist (Ganti Playlist Otomatis)" },
              { value: "start", label: "▶️ Start Stream (Mulai Siaran Otomatis)" },
              { value: "stop", label: "🛑 STOP Stream (Hentikan Siaran Otomatis)" },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {ruleAction === "stop" ? "Stop At (Time)" : "Start Time"}
            </label>
            <Input
              type="time"
              value={ruleStartTime}
              onChange={(e) => setRuleStartTime(e.target.value)}
              className="h-10 bg-white/5 border-white/10 font-mono text-xs rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">
              {ruleAction === "stop" ? "Until (Time Window)" : "End Time"}
            </label>
            <Input
              type="time"
              value={ruleEndTime}
              onChange={(e) => setRuleEndTime(e.target.value)}
              className="h-10 bg-white/5 border-white/10 font-mono text-xs rounded-xl"
            />
          </div>
        </div>

        {ruleAction !== "stop" && (
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Target Playlist to Play</label>
            <CustomSelect
              value={selectedPlaylistId}
              onChange={setSelectedPlaylistId}
              placeholder="Select target playlist..."
              options={playlists.map((pl) => ({
                value: pl.id,
                label: `${pl.name} (${pl.itemCount} videos, ${pl.totalDuration})`,
              }))}
            />
          </div>
        )}
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => setRuleModalOpen(false)}
          className="rounded-full h-10 px-5 text-xs font-bold border-white/10"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleCreateRule}
          disabled={savingRule}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold rounded-full h-10 px-5 text-xs shadow-lg shadow-emerald-500/10"
        >
          {savingRule ? "Saving..." : "Save Rule"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</div>
);
}

function StatusBadge({ status }: { status: Stream["status"] }) {
  const { t } = useLanguage();
  const style: Record<Stream["status"], string> = {
    LIVE:       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    STARTING:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
    RESTARTING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ERROR:      "bg-red-500/10 text-red-400 border-red-500/20",
    SCHEDULED:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
    OFFLINE:    "bg-slate-200/70 text-slate-600 border-slate-300 dark:bg-white/5 dark:text-white/30 dark:border-white/10",
  };

  const getLabel = () => {
    switch (status) {
      case "LIVE": return t("status.live");
      case "OFFLINE": return t("status.offline");
      case "STARTING": return t("status.starting");
      case "RESTARTING": return t("status.restarting");
      case "SCHEDULED": return t("status.scheduled");
      case "ERROR": return t("status.error");
      default: return status;
    }
  };

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide border", style[status])}>
      {status === "LIVE" && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {status === "OFFLINE" && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-white/30" />}
      {getLabel()}
    </span>
  );
}
