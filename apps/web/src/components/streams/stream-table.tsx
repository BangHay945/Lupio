"use client";

import { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Stream } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Search, Settings, Play, Square, RotateCcw, MoreHorizontal, Radio, Trash2, Plus, Pencil, LayoutGrid, List, ListFilter } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "@/components/ui/toast";
import { CreateStreamDialog } from "@/components/streams/create-stream-dialog";
import { apiService } from "@/lib/services/api";

interface StreamTableProps {
  streams: Stream[];
}

export function StreamTable({ streams }: StreamTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [localStreams, setLocalStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: "stop" | "restart" | "delete" | null;
    streamId: string | null;
    streamName: string;
  }>({ open: false, type: null, streamId: null, streamName: "" });

  const loadStreams = async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      const real = await apiService.getStreams();
      if (Array.isArray(real)) setLocalStreams(real);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStreams();
    const hasLive = localStreams.some(s => s.status === "LIVE" || s.status === "STARTING" || s.status === "RESTARTING");
    const intervalTime = hasLive ? 3000 : 8000;
    const interval = setInterval(loadStreams, intervalTime);
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
    <div className="space-y-4 w-full">
      {/* Search + View Toggle + Create */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search streams..."
              className="pl-8 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Grid / Table View Switcher (Matches Schedule Page Tab Bar 100%) */}
          <div className="pill-tab-switcher flex items-center p-1 rounded-xl border border-slate-300 dark:border-white/10 bg-transparent text-xs">
            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all text-xs",
                viewMode === "table" ? "bg-emerald-500/20 text-emerald-400 font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListFilter className="h-3.5 w-3.5" /> Table View
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all text-xs",
                viewMode === "grid" ? "bg-emerald-500/20 text-emerald-400 font-bold shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grid View
            </button>
          </div>
        </div>

        <Button
          onClick={() => setIsCreateOpen(true)}
          className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-black font-semibold gap-1.5 rounded-lg px-4 shadow-lg shadow-emerald-500/10 text-xs"
        >
          <Plus className="h-4 w-4" /> Create Stream
        </Button>
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
                    <DropdownMenuContent align="end" className="border-white/10 bg-zinc-950 p-1.5 w-44">
                      <DropdownMenuItem
                        onClick={() => router.push(`/streams/${stream.id}`)}
                        className="cursor-pointer text-xs"
                      >
                        <Settings className="mr-2 h-4 w-4 text-emerald-400" /> Manage Stream
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer text-xs"
                        onClick={() => {
                          setEditingStream(stream);
                          setIsCreateOpen(true);
                        }}
                      >
                        <Pencil className="mr-2 h-4 w-4 text-emerald-400" /> Edit Configuration
                      </DropdownMenuItem>
                      {stream.status === "OFFLINE" || stream.status === "ERROR" ? (
                        <DropdownMenuItem
                          className="text-emerald-400 cursor-pointer text-xs focus:text-emerald-400"
                          onClick={async () => {
                            await apiService.controlStream(stream.id, "start");
                            setLocalStreams(prev => prev.map(s => s.id === stream.id ? { ...s, status: "STARTING" as const } : s));
                            (toast as any)({ title: "Stream Starting", description: `"${stream.name}" is starting…`, type: "success" });
                          }}
                        >
                          <Play className="mr-2 h-4 w-4" /> Start Stream
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="cursor-pointer text-xs text-amber-400"
                          onClick={() => openConfirm("restart", stream)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" /> Restart Stream
                        </DropdownMenuItem>
                      )}
                      {stream.status !== "OFFLINE" && (
                        <DropdownMenuItem
                          className="text-red-400 cursor-pointer text-xs focus:text-red-400"
                          onClick={() => openConfirm("stop", stream)}
                        >
                          <Square className="mr-2 h-4 w-4" /> Stop Stream
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-red-400 cursor-pointer text-xs focus:text-red-400"
                        onClick={() => openConfirm("delete", stream)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Stream
                      </DropdownMenuItem>
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
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-black font-bold gap-2 rounded-xl text-xs"
                >
                  <Play className="h-3.5 w-3.5 fill-black" /> Start Stream Now
                </Button>
              ) : (
                <Button
                  onClick={() => router.push(`/streams/${stream.id}`)}
                  variant="outline"
                  className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold gap-2 rounded-xl text-xs"
                >
                  <Settings className="h-3.5 w-3.5" /> Manage Live Stream
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW LAYOUT */
        <div className="rounded-xl border border-white/10 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.07] hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stream Name</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Channel</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Output</TableHead>
                <TableHead className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Uptime</TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">Actions</TableHead>
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
                      <DropdownMenuTrigger className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-white/[0.07] bg-white/[0.03] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="border-white/10 bg-zinc-900">
                        <DropdownMenuItem>
                          <Link href={`/streams/${stream.id}`} className="flex w-full items-center cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" /> Manage
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => {
                            setEditingStream(stream);
                            setIsCreateOpen(true);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        {stream.status === "OFFLINE" || stream.status === "ERROR" ? (
                          <DropdownMenuItem
                            className="text-emerald-400 cursor-pointer focus:text-emerald-400"
                            onClick={async () => {
                              await apiService.controlStream(stream.id, "start");
                              setLocalStreams(prev => prev.map(s => s.id === stream.id ? { ...s, status: "STARTING" as const } : s));
                              (toast as any)({ title: "Stream Starting", description: `"${stream.name}" is starting…`, type: "success" });
                            }}
                          >
                            <Play className="mr-2 h-4 w-4" /> Start
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => openConfirm("restart", stream)}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" /> Restart
                          </DropdownMenuItem>
                        )}
                        {stream.status !== "OFFLINE" && (
                          <DropdownMenuItem
                            className="text-red-400 cursor-pointer focus:text-red-400"
                            onClick={() => openConfirm("stop", stream)}
                          >
                            <Square className="mr-2 h-4 w-4" /> Stop
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-red-400 cursor-pointer focus:text-red-400"
                          onClick={() => openConfirm("delete", stream)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
        onSuccess={loadStreams}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: Stream["status"] }) {
  const style: Record<Stream["status"], string> = {
    LIVE:       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    STARTING:   "bg-amber-500/10 text-amber-400 border-amber-500/20",
    RESTARTING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    ERROR:      "bg-red-500/10 text-red-400 border-red-500/20",
    SCHEDULED:  "bg-blue-500/10 text-blue-400 border-blue-500/20",
    OFFLINE:    "bg-slate-200/70 text-slate-600 border-slate-300 dark:bg-white/5 dark:text-white/30 dark:border-white/10",
  };

  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide border", style[status])}>
      {status === "LIVE" && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />}
      {status === "OFFLINE" && <span className="mr-1 h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-white/30" />}
      {status}
    </span>
  );
}
