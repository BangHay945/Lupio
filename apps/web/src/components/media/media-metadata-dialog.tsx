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
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { apiService } from "@/lib/services/api";
import { MediaItem } from "@/lib/mock-data";
import { FileEdit, Loader2, Save, FileVideo, HardDrive, Clock, Upload, Trash2, Image } from "lucide-react";

interface MediaMetadataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem | null;
  onSuccess?: (updatedItem: MediaItem) => void;
}

export function MediaMetadataDialog({
  open,
  onOpenChange,
  media,
  onSuccess,
}: MediaMetadataDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (media && open) {
      setTitle(media.title || "");
      setDescription(media.description || "");
      setThumbnail(media.thumbnail || "");
    }
  }, [media, open]);

  if (!media) return null;

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      (toast as any)({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, WEBP, GIF).",
        type: "error",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setThumbnail(result);
        (toast as any)({
          title: "Thumbnail Loaded",
          description: `Selected image "${file.name}" as cover thumbnail.`,
          type: "success",
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!media) return;

    setSaving(true);
    try {
      const updated = await apiService.updateMedia(media.id, {
        title: title.trim(),
        description: description.trim(),
        thumbnail: thumbnail.trim(),
      });

      (toast as any)({
        title: "Metadata Updated",
        description: `Saved details & thumbnail for "${title.trim() || media.filename}"`,
        type: "success",
      });

      onSuccess?.(updated);
      onOpenChange(false);
    } catch (err: any) {
      (toast as any)({
        title: "Update Failed",
        description: err.message || "Failed to update media metadata.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !saving && onOpenChange(val)}>
      <DialogContent className="sm:max-w-[540px] bg-white/98 dark:bg-zinc-950/98 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl text-foreground">
        <form onSubmit={handleSave} className="flex flex-col gap-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileEdit className="h-5 w-5 text-emerald-400" /> Edit Media Metadata & Thumbnail
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update display title, description, and custom cover thumbnail for this video.
            </DialogDescription>
          </DialogHeader>

          {/* Hidden File Input for Thumbnail Image */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleImageFileUpload}
          />

          {/* Quick File Summary Card & Thumbnail Preview */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 flex flex-col sm:flex-row gap-3 items-center">
            <div className="w-full sm:w-28 aspect-video rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center border border-white/10 shrink-0 relative group">
              {thumbnail ? (
                <>
                  <img
                    src={thumbnail}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                    onError={() => {}}
                  />
                  <button
                    type="button"
                    onClick={() => setThumbnail("")}
                    title="Remove Thumbnail"
                    className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </>
              ) : (
                <FileVideo className="h-6 w-6 text-zinc-500" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground truncate">
                <span className="truncate">{media.filename}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {media.duration}
                </span>
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3" /> {media.size}
                </span>
                {media.resolution && <span>{media.resolution}</span>}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="media-title" className="text-xs font-medium text-zinc-300">
                Title / Display Name
              </label>
              <Input
                id="media-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={media.filename}
                className="bg-white/5 border-white/10 focus:border-emerald-500 text-sm"
                disabled={saving}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="media-thumbnail" className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <Image className="h-3.5 w-3.5 text-emerald-400" /> Custom Thumbnail Image
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={saving}
                  className="h-7 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 rounded-lg gap-1.5"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload Image File
                </Button>
              </div>
              <Input
                id="media-thumbnail"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="Upload file above or paste image URL here..."
                className="bg-white/5 border-white/10 focus:border-emerald-500 text-sm"
                disabled={saving}
              />
              <p className="text-[11px] text-muted-foreground">
                Click <strong>Upload Image File</strong> to pick an image (JPG/PNG) from your device, or paste a URL.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="media-description" className="text-xs font-medium text-zinc-300">
                Description
              </label>
              <textarea
                id="media-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes, tags, or description about this video asset..."
                rows={2}
                disabled={saving}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30 outline-none resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
              className="border-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold gap-1.5"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
