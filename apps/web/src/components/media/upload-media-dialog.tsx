"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiService } from "@/lib/services/api";
import { MediaItem } from "@/lib/mock-data";
import { toast } from "@/components/ui/toast";
import {
  UploadCloud,
  FileVideo,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  RefreshCw,
  Globe,
  Link2,
  DownloadCloud,
  Minus,
  Maximize2,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n/language-context";

export interface QueuedUploadFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  loaded?: number;
  total?: number;
  speedBps?: number;
  etaSeconds?: number;
  errorMessage?: string;
  result?: MediaItem;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatSpeed(bps: number): string {
  if (!bps || bps <= 0) return "0 KB/s";
  if (bps >= 1024 * 1024) {
    return `${(bps / (1024 * 1024)).toFixed(1)} MB/s`;
  }
  return `${(bps / 1024).toFixed(0)} KB/s`;
}

function formatEta(seconds: number): string {
  if (!seconds || seconds <= 0 || !isFinite(seconds)) return "...";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${hrs}h ${remMins}m`;
  }
  return `${mins}m ${secs}s`;
}

function playSuccessChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(830.61, now + 0.15);
    gain2.gain.setValueAtTime(0.12, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.9);
  } catch {}
}

interface UploadMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newItem: MediaItem) => void;
  initialFiles?: File[];
}

export function UploadMediaDialog({
  open,
  onOpenChange,
  onSuccess,
  initialFiles,
}: UploadMediaDialogProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"file" | "url">("file");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileQueue, setFileQueue] = useState<QueuedUploadFile[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // URL import state
  const [importUrl, setImportUrl] = useState("");
  const [customFilename, setCustomFilename] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Reset minimized on modal open
  useEffect(() => {
    if (open) {
      setIsMinimized(false);
    }
  }, [open]);

  // Sync initialFiles when dialog opens with pre-selected files
  useEffect(() => {
    if (open && initialFiles && initialFiles.length > 0) {
      addFilesToQueue(initialFiles);
    }
  }, [open, initialFiles]);

  // Reset queue when dialog closes
  useEffect(() => {
    if (!open && !uploading) {
      setFileQueue([]);
    }
  }, [open, uploading]);

  const isValidVideoFile = (file: File) => {
    return (
      file.type.startsWith("video/") ||
      Boolean(file.name.match(/\.(mp4|mkv|mov|avi|ts|flv|webm|m4v)$/i))
    );
  };

  const addFilesToQueue = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: QueuedUploadFile[] = [];
    let invalidCount = 0;

    fileArray.forEach((file) => {
      if (isValidVideoFile(file)) {
        // Prevent duplicate file with same name and size in current queue
        const exists = fileQueue.some(
          (q) => q.file.name === file.name && q.file.size === file.size
        );
        if (!exists) {
          validFiles.push({
            id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
            file,
            status: "pending",
            progress: 0,
          });
        }
      } else {
        invalidCount++;
      }
    });

    if (invalidCount > 0) {
      (toast as any)({
        title: "Unsupported Files",
        description: `${invalidCount} non-video file${invalidCount > 1 ? "s were" : " was"} ignored.`,
        type: "warning",
      });
    }

    if (validFiles.length > 0) {
      setFileQueue((prev) => [...prev, ...validFiles]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
      // Reset input value so re-selecting same files triggers change event
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (uploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    if (uploading) return;
    setFileQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const handleStartUpload = async () => {
    const pendingItems = fileQueue.filter(
      (item) => item.status === "pending" || item.status === "error"
    );
    if (pendingItems.length === 0) return;

    setUploading(true);
    (toast as any)({
      title: "Uploading Files",
      description: `Starting upload for ${pendingItems.length} file${pendingItems.length > 1 ? "s" : ""}...`,
      type: "info",
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < fileQueue.length; i++) {
      const currentItem = fileQueue[i];
      if (currentItem.status === "completed") continue;

      // Mark uploading
      setFileQueue((prev) =>
        prev.map((item) =>
          item.id === currentItem.id
            ? { ...item, status: "uploading", progress: 0, loaded: 0, total: currentItem.file.size }
            : item
        )
      );

      try {
        const uploadedItem = await apiService.uploadMediaWithProgress(
          currentItem.file,
          ({ loaded, total, percentage, speedBps, etaSeconds }) => {
            setFileQueue((prev) =>
              prev.map((item) =>
                item.id === currentItem.id
                  ? {
                      ...item,
                      progress: percentage,
                      loaded,
                      total,
                      speedBps,
                      etaSeconds,
                    }
                  : item
              )
            );
          }
        );

        setFileQueue((prev) =>
          prev.map((item) =>
            item.id === currentItem.id
              ? {
                  ...item,
                  status: "completed",
                  progress: 100,
                  speedBps: 0,
                  etaSeconds: 0,
                  result: uploadedItem,
                }
              : item
          )
        );

        successCount++;
        onSuccess(uploadedItem);
      } catch (err: any) {
        failCount++;
        setFileQueue((prev) =>
          prev.map((item) =>
            item.id === currentItem.id
              ? {
                  ...item,
                  status: "error",
                  progress: 0,
                  speedBps: 0,
                  etaSeconds: 0,
                  errorMessage: err.message || "Upload failed",
                }
              : item
          )
        );
      }
    }

    setUploading(false);

    if (successCount > 0) {
      playSuccessChime();
    }

    if (successCount > 0 && failCount === 0) {
      (toast as any)({
        title: "Upload Complete! 🎉",
        description: `Successfully uploaded ${successCount} media asset${successCount > 1 ? "s" : ""}.`,
        type: "success",
      });
    } else if (failCount > 0) {
      (toast as any)({
        title: "Upload Completed with Issues",
        description: `${successCount} uploaded, ${failCount} failed.`,
        type: "warning",
      });
    }
  };

  const completedCount = fileQueue.filter((f) => f.status === "completed").length;
  const errorCount = fileQueue.filter((f) => f.status === "error").length;
  const pendingCount = fileQueue.filter((f) => f.status === "pending").length;
  const totalCount = fileQueue.length;
  const overallPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllFinished = totalCount > 0 && completedCount + errorCount === totalCount;
  const allSuccessful = totalCount > 0 && completedCount === totalCount;
  const currentUploadingItem = fileQueue.find((f) => f.status === "uploading");

  const handleImportUrl = async () => {
    if (!importUrl.trim()) {
      setImportError("Please enter a valid video or Google Drive URL");
      return;
    }
    setImporting(true);
    setImportError(null);
    try {
      (toast as any)({
        title: "Starting Download",
        description: "Downloading video from remote URL to Lupio server...",
        type: "info",
      });

      const newItem = await apiService.importMediaFromUrl(
        importUrl.trim(),
        customFilename.trim() || undefined
      );

      (toast as any)({
        title: "Import Complete! 🎉",
        description: `Successfully imported "${newItem.filename}" (${newItem.size}, ${newItem.resolution}).`,
        type: "success",
      });

      onSuccess(newItem);
      setImportUrl("");
      setCustomFilename("");
      onOpenChange(false);
    } catch (err: any) {
      setImportError(err.message || "Failed to download and process media file");
      (toast as any)({
        title: "Import Error",
        description: err.message || "Download failed",
        type: "error",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open && !isMinimized}
        onOpenChange={(val) => {
          if (!val && uploading) {
            setIsMinimized(true);
            return;
          }
          if (!uploading && !importing) onOpenChange(val);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-[620px] w-full min-w-0 overflow-hidden bg-white/98 dark:bg-zinc-950/98 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl text-foreground relative"
        >
          {/* Top-Right Window Controls (Strip Minimize & Close Aligned) */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-1 z-20">
            {(uploading || fileQueue.length > 0) && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsMinimized(true)}
                className="text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                title="Perkecil ke pojok kanan bawah"
              >
                <Minus className="h-4 w-4 stroke-[2.5]" />
                <span className="sr-only">Minimize</span>
              </Button>
            )}
            <DialogClose
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                />
              }
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          <div className="flex items-start justify-between gap-3 pr-20">
            <DialogHeader className="gap-1 flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                {activeTab === "file" ? (
                  <>
                    <UploadCloud className="h-5 w-5 text-emerald-400" /> {t("media.uploadTitle")}
                  </>
                ) : (
                  <>
                    <Globe className="h-5 w-5 text-emerald-400" /> {t("media.cloudTitle")}
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {activeTab === "file"
                  ? t("media.fileDesc")
                  : t("media.cloudDesc")}
              </DialogDescription>
            </DialogHeader>
          </div>

        {/* Tab Selection Switcher */}
        <div className="pill-tab-switcher flex items-center p-1.5 rounded-full border border-slate-300 dark:border-white/10 bg-transparent text-xs w-full min-w-0">
          <button
            type="button"
            disabled={uploading || importing}
            onClick={() => setActiveTab("file")}
            className={cn(
              "flex-1 py-2 px-4 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 border",
              activeTab === "file"
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-xs"
                : "border-transparent text-muted-foreground hover:text-white"
            )}
          >
            <UploadCloud className="h-4 w-4" />
            {t("media.tabLocal")}
          </button>
          <button
            type="button"
            disabled={uploading || importing}
            onClick={() => setActiveTab("url")}
            className={cn(
              "flex-1 py-2 px-4 text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 border",
              activeTab === "url"
                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-xs"
                : "border-transparent text-muted-foreground hover:text-white"
            )}
          >
            <Globe className="h-4 w-4" />
            {t("media.tabCloud")}
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="video/mp4,video/mkv,video/mov,video/avi,video/ts,video/webm,video/flv,.mp4,.mkv,.mov,.avi,.ts,.flv,.webm"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {activeTab === "url" ? (
          <div className="py-2 space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                  <Link2 className="h-3.5 w-3.5 text-blue-400" /> {t("media.urlLabel")}
                </label>
                <Input
                  placeholder="https://example.com/video.mp4 or https://drive.google.com/file/d/.../view"
                  value={importUrl}
                  onChange={(e) => {
                    setImportUrl(e.target.value);
                    if (importError) setImportError(null);
                  }}
                  disabled={importing}
                  className="bg-black/30 border-white/15 focus-visible:border-blue-500/60 focus-visible:ring-blue-500/30 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  {t("media.filenameLabel")}
                </label>
                <Input
                  placeholder="Leave blank to auto-detect from remote header/link"
                  value={customFilename}
                  onChange={(e) => setCustomFilename(e.target.value)}
                  disabled={importing}
                  className="bg-black/30 border-white/15 text-xs"
                />
              </div>

              {/* Cloud Service Badges & Info */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-xs space-y-2">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span>Supported Cloud Sources & Direct Downloads</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                    <span><strong>Direct URLs:</strong> Any HTTP/HTTPS link (.mp4, .mkv, .ts, .mov, etc.).</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1 shrink-0" />
                    <span><strong>Google Drive:</strong> Public link ("Anyone with link can view").</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                    <span><strong>Dropbox:</strong> Automatically converted to raw stream.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1 shrink-0" />
                    <span><strong>Server-Side FFmpeg:</strong> Auto metadata probing & thumbnail generation.</span>
                  </div>
                </div>
              </div>

              {/* Importing Spinner / Status */}
              {importing && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-blue-400 animate-spin shrink-0" />
                  <div className="text-xs space-y-0.5">
                    <div className="font-semibold text-blue-300">Downloading & Processing Media...</div>
                    <div className="text-zinc-400 text-[11px]">
                      Your Lupio server is streaming bytes directly and extracting metadata.
                    </div>
                  </div>
                </div>
              )}

              {/* Error display */}
              {importError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex items-start gap-2.5 text-xs text-red-300">
                  <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-semibold">Import Error:</span>
                    <p className="text-[11px] text-red-200/90">{importError}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-2 space-y-4 w-full min-w-0">
            {/* Dropzone Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!uploading) setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none w-full min-w-0 ${
                dragOver
                  ? "border-emerald-500 bg-emerald-500/10 scale-[0.99]"
                  : fileQueue.length > 0
                  ? "border-slate-300 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/60 dark:hover:bg-white/[0.04] hover:border-slate-400 dark:hover:border-white/20"
                  : "border-slate-300 dark:border-white/15 bg-slate-50/50 dark:bg-white/[0.02] hover:bg-slate-100/60 dark:hover:bg-white/[0.05] hover:border-slate-400 dark:hover:border-white/25"
              }`}
            >
              <UploadCloud
                className={`h-9 w-9 mb-2 transition-colors ${
                  dragOver ? "text-emerald-400 animate-bounce" : "text-muted-foreground"
                }`}
              />
              <h4 className="text-sm font-semibold text-foreground">
                {dragOver
                  ? "Drop video files to add to queue"
                  : fileQueue.length > 0
                  ? "Click or drag more video files here"
                  : "Click or drag video files to upload"}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Supports multiple files (MP4, MKV, MOV, AVI, TS, WEBM)
              </p>
            </div>

            {/* Overall Progress Bar (visible during or after upload) */}
            {(uploading || (totalCount > 0 && (completedCount > 0 || errorCount > 0))) && (
              <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.03] p-3 space-y-2 w-full min-w-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    {uploading && <Loader2 className="h-3.5 w-3.5 text-emerald-400 animate-spin" />}
                    {uploading
                      ? `Uploading (${completedCount}/${totalCount} files completed)`
                      : allSuccessful
                      ? "All files uploaded successfully"
                      : `Upload finished (${completedCount} of ${totalCount} succeeded)`}
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{overallPercentage}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-2 overflow-hidden relative">
                  <div
                    className={`h-full transition-all duration-300 ${
                      errorCount > 0 && !uploading ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${overallPercentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* File Queue List */}
            {fileQueue.length > 0 && (
              <div className="space-y-2 w-full min-w-0">
                <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
                  <span>
                    Queued Files ({fileQueue.length})
                    {completedCount > 0 && ` · ${completedCount} completed`}
                    {errorCount > 0 && ` · ${errorCount} failed`}
                  </span>
                  {!uploading && (
                    <button
                      type="button"
                      onClick={() => setFileQueue([])}
                      className="text-[11px] text-zinc-400 hover:text-foreground transition-colors"
                    >
                      Clear list
                    </button>
                  )}
                </div>

                <div className="max-h-[210px] overflow-y-auto overflow-x-hidden space-y-2 pr-1 rounded-xl w-full min-w-0">
                  {fileQueue.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.02] text-xs w-full min-w-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                        <div className="h-7 w-7 rounded-md bg-slate-200/60 dark:bg-white/5 flex items-center justify-center shrink-0">
                          {item.status === "completed" ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : item.status === "uploading" ? (
                            <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />
                          ) : item.status === "error" ? (
                            <AlertCircle className="h-4 w-4 text-red-400" />
                          ) : (
                            <FileVideo className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1 overflow-hidden">
                          <p className="font-medium text-foreground truncate block w-full" title={item.file.name}>
                            {item.file.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                            <span>{(item.file.size / (1024 * 1024)).toFixed(1)} MB</span>
                            {item.status === "uploading" && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-500 font-semibold">{item.progress}%</span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5 text-emerald-500 font-medium">
                                  <Zap className="h-3 w-3" /> {formatSpeed(item.speedBps || 0)}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Clock className="h-3 w-3" /> Sisa {formatEta(item.etaSeconds || 0)}
                                </span>
                                <span>•</span>
                                <span>{formatBytes(item.loaded || 0)} / {formatBytes(item.total || item.file.size)}</span>
                              </>
                            )}
                            {item.status === "completed" && (
                              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Uploaded
                              </span>
                            )}
                            {item.status === "error" && (
                              <span className="text-red-400 truncate max-w-[200px]">
                                {item.errorMessage || "Failed"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {!uploading && item.status !== "completed" && (
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(item.id)}
                          className="p-1 rounded-md hover:bg-slate-200/60 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title="Remove file"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center justify-end w-full min-w-0">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading || importing}
              className="border-slate-300 dark:border-white/10"
            >
              {activeTab === "file" && allSuccessful ? "Done" : "Cancel"}
            </Button>

            {activeTab === "file" ? (
              !allSuccessful && (
                <Button
                  type="button"
                  onClick={handleStartUpload}
                  disabled={fileQueue.length === 0 || uploading || (pendingCount === 0 && errorCount === 0)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold gap-1.5"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : errorCount > 0 && pendingCount === 0 ? (
                    <RefreshCw className="h-4 w-4" />
                  ) : (
                    <UploadCloud className="h-4 w-4" />
                  )}
                  {uploading
                    ? `Uploading (${completedCount}/${totalCount})...`
                    : errorCount > 0 && pendingCount === 0
                    ? `Retry Failed (${errorCount})`
                    : `Start Upload${totalCount > 0 ? ` (${totalCount})` : ""}`}
                </Button>
              )
            ) : (
              <Button
                type="button"
                onClick={handleImportUrl}
                disabled={!importUrl.trim() || importing}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold gap-1.5 shadow-lg shadow-blue-500/20"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importing to Server...
                  </>
                ) : (
                  <>
                    <DownloadCloud className="h-4 w-4" />
                    Download & Import
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Floating Bottom-Right Dock Widget when Minimized */}
    {isMinimized && (uploading || fileQueue.length > 0) && (
      <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 dark:border-white/15 bg-white/98 dark:bg-zinc-900/98 backdrop-blur-xl p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {uploading ? (
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            ) : allSuccessful ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
            )}
            <span className="text-xs font-bold text-foreground truncate">
              {uploading
                ? `Mengunggah (${completedCount}/${totalCount} berkas)...`
                : allSuccessful
                ? "Unggahan Selesai 🎉"
                : "Unggahan Terhenti"}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              title="Buka Jendela Penuh"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            {!uploading && (
              <button
                type="button"
                onClick={() => {
                  setIsMinimized(false);
                  onOpenChange(false);
                  setFileQueue([]);
                }}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                title="Tutup"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active File Summary */}
        {uploading && currentUploadingItem && (
          <div className="text-[11px] space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="truncate max-w-[210px] font-medium text-foreground">{currentUploadingItem.file.name}</span>
              <span className="font-mono text-emerald-500 font-bold">{currentUploadingItem.progress}%</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1 text-emerald-500 font-medium">
                <Zap className="h-3 w-3" /> {formatSpeed(currentUploadingItem.speedBps || 0)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" /> Sisa {formatEta(currentUploadingItem.etaSeconds || 0)}
              </span>
              <span>
                {formatBytes(currentUploadingItem.loaded || 0)} / {formatBytes(currentUploadingItem.total || currentUploadingItem.file.size)}
              </span>
            </div>
          </div>
        )}

        {/* Mini Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              errorCount > 0 && !uploading ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${overallPercentage}%` }}
          />
        </div>
      </div>
    )}
  </>
  );
}
