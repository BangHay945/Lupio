"use client";

import { useState, useEffect } from "react";
import { MediaItem } from "@/lib/mock-data";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import {
  UploadCloud,
  Search,
  FileVideo,
  Clock,
  HardDrive,
  MoreVertical,
  Trash,
  Plus,
  Play,
  FileEdit,
  FolderUp,
  Tag,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { apiService } from "@/lib/services/api";
import { UploadMediaDialog } from "@/components/media/upload-media-dialog";
import { MediaPreviewDialog } from "@/components/media/media-preview-dialog";
import { MediaMetadataDialog } from "@/components/media/media-metadata-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLanguage } from "@/lib/i18n/language-context";

export default function MediaPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [initialFiles, setInitialFiles] = useState<File[]>([]);
  const [pageDragOver, setPageDragOver] = useState(false);

  // Media Preview State
  const [previewMedia, setPreviewMedia] = useState<MediaItem | null>(null);

  // Media Metadata State
  const [editMetadataMedia, setEditMetadataMedia] = useState<MediaItem | null>(null);

  // Delete confirm dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; media: MediaItem | null }>({
    open: false,
    media: null,
  });

  const loadMedia = async () => {
    try {
      const real = await apiService.getMedia();
      if (Array.isArray(real)) setMediaList(real);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  const filteredMedia = mediaList.filter((item) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const matchFilename = item.filename.toLowerCase().includes(q);
    const matchTitle = item.title ? item.title.toLowerCase().includes(q) : false;
    const matchDesc = item.description ? item.description.toLowerCase().includes(q) : false;
    return matchFilename || matchTitle || matchDesc;
  });

  const handleUploadSuccess = (newMedia: MediaItem) => {
    setMediaList((prev) => {
      const existsIndex = prev.findIndex((m) => m.id === newMedia.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = newMedia;
        return updated;
      }
      return [newMedia, ...prev];
    });
  };

  const handleMetadataSuccess = (updatedItem: MediaItem) => {
    setMediaList((prev) =>
      prev.map((m) => (m.id === updatedItem.id ? updatedItem : m))
    );
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.media) return;
    const item = deleteConfirm.media;
    try {
      await apiService.deleteMedia(item.id);
      setMediaList((prev) => prev.filter((m) => m.id !== item.id));
      (toast as any)({
        title: "File Deleted",
        description: `${item.filename} removed from disk.`,
        type: "info",
      });
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    } finally {
      setDeleteConfirm({ open: false, media: null });
    }
  };

  const handleTopDropzoneDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPageDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setInitialFiles(Array.from(e.dataTransfer.files));
      setUploadOpen(true);
    }
  };

  const totalMediaSizeBytes = mediaList.reduce((acc, item) => {
    const sizeNum = parseFloat(item.size || "0");
    if (item.size?.includes("GB")) return acc + sizeNum * 1024 * 1024 * 1024;
    return acc + sizeNum * 1024 * 1024;
  }, 0);
  const totalMediaSizeGB = (totalMediaSizeBytes / (1024 * 1024 * 1024)).toFixed(2);
  const storageUsedPercent = Math.min((parseFloat(totalMediaSizeGB) / 100) * 100, 100).toFixed(1);

  return (
    <div className="flex flex-col gap-6 w-full pb-12">
      {/* Header Bar — Search, Storage Monitor & Upload Button */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("media.search")}
              className="pl-9 pr-4 bg-card/60 border-white/10 rounded-full h-10.5 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            {mediaList.length} items
          </span>

          {/* VPS 100 GB Storage Meter Badge */}
          <div className="hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-white/10 bg-card/40 text-xs shrink-0">
            <HardDrive className="h-3.5 w-3.5 text-sky-400 shrink-0" />
            <span className="font-semibold text-foreground text-[11px]">{totalMediaSizeGB} GB / 100 GB</span>
            <div className="h-1.5 w-16 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all"
                style={{ width: `${Math.max(Number(storageUsedPercent), 3)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">({storageUsedPercent}%)</span>
          </div>
        </div>

        <Button
          onClick={() => {
            setInitialFiles([]);
            setUploadOpen(true);
          }}
          className="shrink-0 bg-emerald-500 hover:bg-emerald-600 text-black font-bold gap-2 rounded-full h-10 px-5 shadow-lg shadow-emerald-500/10 text-xs"
        >
          <Plus className="h-4 w-4" /> {t("action.uploadMedia")}
        </Button>
      </div>

      {/* Grid of Media Assets */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {filteredMedia.map((item) => (
          <Card
            key={item.id}
            className="overflow-hidden group border-white/10 bg-card/60 backdrop-blur hover:border-white/20 transition-all"
          >
            {/* Thumbnail with Play Hover */}
            <div
              onClick={() => setPreviewMedia(item)}
              className="media-thumbnail-preview aspect-video bg-slate-900 flex items-center justify-center relative cursor-pointer transition-colors overflow-hidden border-b border-slate-200 dark:border-white/10"
            >
              {item.thumbnail ? (
                <img
                  src={item.thumbnail}
                  alt={item.title || item.filename}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <FileVideo className="h-10 w-10 text-muted-foreground/40 group-hover:scale-90 group-hover:opacity-0 transition-all duration-200" />
              )}

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]">
                <div className="h-10 w-10 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg transform group-hover:scale-100 scale-75 transition-transform">
                  <Play className="h-5 w-5 fill-black ml-0.5" />
                </div>
              </div>

              <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded font-mono border border-white/10">
                {item.duration}
              </div>

              {item.title && (
                <div className="absolute top-2 left-2 bg-emerald-500/90 text-black font-semibold text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 shadow">
                  <Tag className="h-2.5 w-2.5" /> Custom Title
                </div>
              )}
            </div>

            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0 flex-1">
                  <h4
                    onClick={() => setPreviewMedia(item)}
                    className="text-xs font-semibold leading-snug truncate cursor-pointer hover:text-emerald-400 transition-colors"
                    title={item.title || item.filename}
                  >
                    {item.title || item.filename}
                  </h4>
                  {item.title && (
                    <p
                      className="text-[10px] text-zinc-500 truncate mt-0.5"
                      title={item.filename}
                    >
                      {item.filename}
                    </p>
                  )}
                  {item.description && (
                    <p
                      className="text-[11px] text-muted-foreground truncate mt-1 line-clamp-1"
                      title={item.description}
                    >
                      {item.description}
                    </p>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-6 w-6 p-0 -mt-1 -mr-1 shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44 bg-zinc-950 border-white/10">
                    <DropdownMenuItem
                      className="cursor-pointer text-xs"
                      onClick={() => setPreviewMedia(item)}
                    >
                      <Play className="mr-2 h-3.5 w-3.5 text-emerald-400" /> Preview Video
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer text-xs"
                      onClick={() => setEditMetadataMedia(item)}
                    >
                      <FileEdit className="mr-2 h-3.5 w-3.5 text-sky-400" /> {t("action.edit")} Metadata
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      className="text-red-400 cursor-pointer focus:text-red-400 text-xs"
                      onClick={() => setDeleteConfirm({ open: true, media: item })}
                    >
                      <Trash className="mr-2 h-3.5 w-3.5" /> {t("action.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>

            <CardFooter className="p-3 pt-0 text-[11px] text-muted-foreground flex items-center justify-between">
              <div className="flex items-center">
                <HardDrive className="mr-1 h-3 w-3" /> {item.size}
              </div>
              <div className="flex items-center">
                <Clock className="mr-1 h-3 w-3" /> {item.uploadDate}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="text-center py-20 text-xs text-muted-foreground animate-pulse">
          {t("dash.loading")}
        </div>
      )}

      {!loading && filteredMedia.length === 0 && (
        <div className="empty-state-wrapper text-center py-16 px-6 rounded-3xl w-full">
          <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center mx-auto mb-4 text-emerald-500 shadow-xs">
            <UploadCloud className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-foreground">{t("media.empty")}</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-6 max-w-sm mx-auto leading-relaxed">
            {search
              ? `No media files match "${search}".`
              : t("media.emptyDesc")}
          </p>
          <Button
            onClick={() => {
              setInitialFiles([]);
              setUploadOpen(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold h-10 px-6 rounded-full shadow-lg shadow-emerald-500/20 gap-2 text-xs transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" /> {t("action.uploadMedia")}
          </Button>
        </div>
      )}

      {/* Bulk Upload Media Modal Dialog */}
      <UploadMediaDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={handleUploadSuccess}
        initialFiles={initialFiles}
      />

      {/* Edit Metadata Modal Dialog */}
      <MediaMetadataDialog
        open={!!editMetadataMedia}
        onOpenChange={(open) => !open && setEditMetadataMedia(null)}
        media={editMetadataMedia}
        onSuccess={handleMetadataSuccess}
      />

      {/* Media Video Preview Modal Dialog */}
      <MediaPreviewDialog
        open={!!previewMedia}
        onOpenChange={(open) => !open && setPreviewMedia(null)}
        media={previewMedia}
      />

      {/* Delete Confirmation */}
      {deleteConfirm.media && (
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
          title="Delete Video File"
          description={`Permanently delete "${deleteConfirm.media.filename}" from disk?`}
          confirmLabel="Delete File"
          variant="destructive"
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
