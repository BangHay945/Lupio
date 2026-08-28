"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
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
} from "lucide-react";

export interface QueuedUploadFile {
  id: string;
  file: File;
  status: "pending" | "uploading" | "completed" | "error";
  progress: number;
  errorMessage?: string;
  result?: MediaItem;
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
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileQueue, setFileQueue] = useState<QueuedUploadFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

      // Mark uploading & simulate progress start
      setFileQueue((prev) =>
        prev.map((item) =>
          item.id === currentItem.id
            ? { ...item, status: "uploading", progress: 35 }
            : item
        )
      );

      try {
        // Progress ticker simulation
        const progressTimer = setInterval(() => {
          setFileQueue((prev) =>
            prev.map((item) =>
              item.id === currentItem.id && item.status === "uploading"
                ? { ...item, progress: Math.min(item.progress + 20, 90) }
                : item
            )
          );
        }, 300);

        const uploadedItem = await apiService.uploadMedia(currentItem.file);
        clearInterval(progressTimer);

        setFileQueue((prev) =>
          prev.map((item) =>
            item.id === currentItem.id
              ? { ...item, status: "completed", progress: 100, result: uploadedItem }
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
                  errorMessage: err.message || "Upload failed",
                }
              : item
          )
        );
      }
    }

    setUploading(false);

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

  return (
    <Dialog open={open} onOpenChange={(val) => !uploading && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[620px] bg-zinc-950 border border-white/10 p-6 rounded-2xl shadow-2xl">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <UploadCloud className="h-5 w-5 text-emerald-400" /> Upload Media Assets
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Select or drag multiple video files to upload directly to your Lupio server.
          </DialogDescription>
        </DialogHeader>

        <input
          type="file"
          ref={fileInputRef}
          multiple
          accept="video/mp4,video/mkv,video/mov,video/avi,video/ts,video/webm,video/flv,.mp4,.mkv,.mov,.avi,.ts,.flv,.webm"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="py-2 space-y-4">
          {/* Dropzone Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!uploading) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer select-none ${
              dragOver
                ? "border-emerald-500 bg-emerald-500/10 scale-[0.99]"
                : fileQueue.length > 0
                ? "border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                : "border-white/15 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/25"
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
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 space-y-2">
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
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden relative">
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
            <div className="space-y-2">
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
                    className="text-[11px] text-zinc-400 hover:text-white transition-colors"
                  >
                    Clear list
                  </button>
                )}
              </div>

              <div className="max-h-[210px] overflow-y-auto space-y-2 pr-1 rounded-xl">
                {fileQueue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-white/10 bg-white/[0.02] text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="h-7 w-7 rounded-md bg-white/5 flex items-center justify-center shrink-0">
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

                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{item.file.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{(item.file.size / (1024 * 1024)).toFixed(1)} MB</span>
                          {item.status === "uploading" && (
                            <span className="text-emerald-400">Uploading... {item.progress}%</span>
                          )}
                          {item.status === "completed" && (
                            <span className="text-emerald-400">Uploaded</span>
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
                        className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
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

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!uploading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="border-white/10 text-xs gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add More
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
              className="border-white/10"
            >
              {allSuccessful ? "Done" : "Cancel"}
            </Button>

            {!allSuccessful && (
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
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
