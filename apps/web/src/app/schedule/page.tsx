"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, Calendar, Clock, Tv, Film, MoreHorizontal, Play, Trash2, 
  CheckCircle2, Sparkles, LayoutGrid, ListFilter, RotateCw, Layers, ShieldCheck 
} from "lucide-react";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Stream, ScheduleRule, Playlist } from "@/lib/mock-data";
import { apiService } from "@/lib/services/api";
import { CreateStreamDialog } from "@/components/streams/create-stream-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function SchedulePage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [scheduleRules, setScheduleRules] = useState<ScheduleRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");
  const [createOpen, setCreateOpen] = useState(false);
  
  // Rule Dialog State
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("18:00");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [savingRule, setSavingRule] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; stream: Stream | null }>({
    open: false,
    stream: null,
  });

  const loadData = async () => {
    try {
      const [stData, plData, ruleData] = await Promise.all([
        apiService.getStreams(),
        apiService.getPlaylists(),
        apiService.getScheduleRules(),
      ]);
      if (Array.isArray(stData)) setStreams(stData);
      if (Array.isArray(plData)) setPlaylists(plData);
      if (Array.isArray(ruleData)) setScheduleRules(ruleData);
      if (Array.isArray(plData) && plData.length > 0) setSelectedPlaylistId(plData[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartNow = async (stream: Stream) => {
    try {
      await apiService.controlStream(stream.id, "start");
      (toast as any)({
        title: "Stream Launched! 🚀",
        description: `"${stream.name}" is starting now.`,
        type: "success",
      });
      loadData();
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.stream) return;
    const st = deleteConfirm.stream;
    try {
      await apiService.deleteStream(st.id);
      setStreams((prev) => prev.filter((s) => s.id !== st.id));
      (toast as any)({ title: "Scheduled Stream Deleted", description: `"${st.name}" removed.`, type: "info" });
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    } finally {
      setDeleteConfirm({ open: false, stream: null });
    }
  };

  const handleCreateRule = async () => {
    if (!selectedPlaylistId) {
      (toast as any)({ title: "Validation Error", description: "Please select a target playlist.", type: "error" });
      return;
    }

    setSavingRule(true);
    try {
      const pl = playlists.find((p) => p.id === selectedPlaylistId);
      const newRule = await apiService.saveScheduleRule({
        streamName: "All Streams",
        startTime,
        endTime,
        playlistId: selectedPlaylistId,
        playlistName: pl?.name || "Target Playlist",
        active: true,
      });

      setScheduleRules((prev) => [...prev, newRule]);
      (toast as any)({
        title: "Rule Created! ⏰",
        description: `Auto-switch to "${pl?.name}" at ${startTime}-${endTime}.`,
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

  const scheduledStreams = streams.filter(
    (s) => s.status === "SCHEDULED" || s.status === "OFFLINE" || s.status === "LIVE"
  );

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="pill-tab-switcher flex items-center p-1 rounded-xl border border-slate-300 dark:border-white/10 bg-transparent text-xs">
            <button
              onClick={() => setViewMode("timeline")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all",
                viewMode === "timeline" ? "bg-emerald-500/20 text-emerald-400 shadow-xs" : "text-muted-foreground hover:text-white"
              )}
            >
              <ListFilter className="h-3.5 w-3.5" /> Timeline
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all",
                viewMode === "grid" ? "bg-emerald-500/20 text-emerald-400 shadow-xs" : "text-muted-foreground hover:text-white"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid View
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setRuleModalOpen(true)}
            variant="outline"
            className="font-semibold gap-1.5 text-xs border-white/15 bg-white/5 hover:bg-white/10 rounded-lg"
          >
            <Clock className="h-4 w-4 text-emerald-400" /> Add Time-Based Rule
          </Button>
          <Button
            onClick={() => setCreateOpen(true)}
            className="font-semibold gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-black text-xs rounded-lg shadow-lg shadow-emerald-500/10"
          >
            <Plus className="h-4 w-4 fill-black" /> Schedule Stream
          </Button>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-white/10 bg-card/60 backdrop-blur flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black">{scheduledStreams.length}</div>
            <div className="text-xs text-muted-foreground">Configured Streams</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-card/60 backdrop-blur flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RotateCw className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black">{scheduleRules.length} Active</div>
            <div className="text-xs text-muted-foreground">Auto-Switcher Rules</div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-white/10 bg-card/60 backdrop-blur flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="text-2xl font-black">100%</div>
            <div className="text-xs text-muted-foreground">Watchdog Auto-Healing</div>
          </div>
        </div>
      </div>

      {/* Feature 1: Time-Based Auto Switcher Rules Section */}
      <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-foreground">Smart Time-Based Playlist Auto-Switcher Rules</h3>
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
              Live Engine Active
            </span>
          </div>
          <button
            onClick={() => setRuleModalOpen(true)}
            className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> New Time Rule
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
          {scheduleRules.map((rule) => (
            <div key={rule.id} className="p-3.5 rounded-xl border border-white/10 bg-black/40 flex items-center justify-between">
              <div className="space-y-1 min-w-0 pr-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-foreground truncate">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[11px]">
                    {rule.startTime} – {rule.endTime}
                  </span>
                  <span className="truncate">{rule.playlistName}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Applies to: <span className="text-white/80 font-medium">{rule.streamName || "All Streams"}</span>
                </div>
              </div>

              <button
                onClick={() => handleDeleteRule(rule.id)}
                className="text-muted-foreground hover:text-red-400 transition-colors p-1"
                title="Delete Rule"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="text-center py-20 text-xs text-muted-foreground animate-pulse">
          Loading scheduled streams...
        </div>
      ) : scheduledStreams.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
          <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-sm font-semibold">No Scheduled Streams</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Schedule upcoming broadcasts or set auto-switcher time rules.
          </p>
          <Button onClick={() => setCreateOpen(true)} variant="outline" size="sm">
            <Plus className="mr-1.5 h-4 w-4" /> Schedule Stream Now
          </Button>
        </div>
      ) : viewMode === "timeline" ? (
        <div className="space-y-4">
          {scheduledStreams.map((stream) => (
            <div
              key={stream.id}
              className="p-5 rounded-2xl border border-white/10 bg-card/60 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                  <Tv className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">{stream.name}</h3>
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        stream.status === "LIVE"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-white/10 text-muted-foreground"
                      )}
                    >
                      {stream.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Tv className="h-3.5 w-3.5 text-emerald-400" /> {stream.channelName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Film className="h-3.5 w-3.5 text-blue-400" /> {stream.playlistName}
                    </span>
                    <span className="font-mono text-white/50">{stream.resolution} @ {stream.fps}FPS</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                <Button
                  onClick={() => handleStartNow(stream)}
                  disabled={stream.status === "LIVE"}
                  size="sm"
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs gap-1.5"
                >
                  <Play className="h-3.5 w-3.5 fill-black" />
                  {stream.status === "LIVE" ? "Broadcasting Live" : "Start Stream Now"}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                    <MoreHorizontal className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setDeleteConfirm({ open: true, stream })}
                      className="text-red-400 focus:text-red-400 cursor-pointer text-xs"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete Schedule
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scheduledStreams.map((stream) => (
            <div key={stream.id} className="p-5 rounded-2xl border border-white/10 bg-card/60 backdrop-blur space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-foreground text-sm truncate">{stream.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{stream.channelName}</p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                      stream.status === "LIVE" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground"
                    )}
                  >
                    {stream.status}
                  </span>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-transparent text-muted-foreground hover:bg-black/10 dark:hover:bg-white/10 hover:text-foreground transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Schedule Actions</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-white/10 bg-zinc-950 p-1.5 w-44">
                      <DropdownMenuItem
                        onClick={() => handleStartNow(stream)}
                        disabled={stream.status === "LIVE"}
                        className="cursor-pointer text-xs text-emerald-400 focus:text-emerald-400"
                      >
                        <Play className="mr-2 h-4 w-4" /> Start Stream Now
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteConfirm({ open: true, stream })}
                        className="text-red-400 focus:text-red-400 cursor-pointer text-xs"
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Schedule
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 bg-black/5 dark:bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span>Playlist:</span>
                  <span className="text-foreground font-semibold truncate max-w-[140px]">{stream.playlistName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Preset:</span>
                  <span className="font-mono text-foreground">{stream.resolution}</span>
                </div>
              </div>

              <Button
                onClick={() => handleStartNow(stream)}
                disabled={stream.status === "LIVE"}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs gap-1.5 rounded-xl"
              >
                <Play className="h-3.5 w-3.5 fill-black" />
                {stream.status === "LIVE" ? "Broadcasting Live" : "Start Stream Now"}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Rule Creation Modal */}
      <Dialog open={ruleModalOpen} onOpenChange={setRuleModalOpen}>
        <DialogContent className="sm:max-w-[450px] bg-zinc-950 border border-white/10 p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-400" /> Create Time-Based Auto-Switcher Rule
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-semibold uppercase text-muted-foreground">Start Time (HH:mm)</label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="bg-white/5 border-white/10 h-10"
                />
              </div>
              <div className="space-y-1">
                <label className="font-semibold uppercase text-muted-foreground">End Time (HH:mm)</label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="bg-white/5 border-white/10 h-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold uppercase text-muted-foreground">Target Playlist to Switch To</label>
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(e.target.value)}
                className="w-full h-10 rounded-lg border border-white/10 bg-zinc-900 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.itemCount} items)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-white/10">
            <Button variant="outline" onClick={() => setRuleModalOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button
              onClick={handleCreateRule}
              disabled={savingRule}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs"
            >
              {savingRule ? "Saving Rule..." : "Save Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Stream Modal */}
      <CreateStreamDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={loadData}
      />

      {/* Confirm Delete Modal */}
      {deleteConfirm.stream && (
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
          title="Delete Schedule"
          description={`Delete schedule for "${deleteConfirm.stream.name}"?`}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
