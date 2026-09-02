"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MediaItem } from "@/lib/mock-data";
import { Film, HardDrive, Clock, Video } from "lucide-react";

interface MediaPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem | null;
}

export function MediaPreviewDialog({ open, onOpenChange, media }: MediaPreviewDialogProps) {
  if (!media) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] bg-white/98 dark:bg-zinc-950/98 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl overflow-hidden text-foreground">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 truncate">
            <Film className="h-5 w-5 text-emerald-400 shrink-0" /> {media.filename}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-4 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Duration: {media.duration}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" /> Size: {media.size}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 relative shadow-inner">
            {media.filepath ? (
              <video
                src={`/api/media/${media.id}/file`}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Video className="h-12 w-12 text-zinc-600" />
                <p className="text-xs font-medium">Video preview player ready</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
