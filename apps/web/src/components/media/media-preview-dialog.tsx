"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MediaItem } from "@/lib/mock-data";
import { Film, HardDrive, Clock, Video, Download, AlertCircle, RotateCw, Cpu } from "lucide-react";

interface MediaPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem | null;
}

export function MediaPreviewDialog({ open, onOpenChange, media }: MediaPreviewDialogProps) {
  const [videoError, setVideoError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // useTranscode: false = serve file directly, true = transcode via preview-stream (for H.265)
  const [useTranscode, setUseTranscode] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (open) {
      setVideoError(false);
      setUseTranscode(false);
      setReloadKey(0);
    }
  }, [open, media?.id]);

  if (!media) return null;

  const handleReload = () => {
    setVideoError(false);
    setUseTranscode(false);
    setReloadKey((prev) => prev + 1);
  };

  // When direct file plays but shows black (HEVC codec unsupported), auto-switch to preview-stream
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.videoWidth === 0 && !useTranscode) {
      // Browser can't decode this codec — fall back to server-side H.264 transcode
      setUseTranscode(true);
      setReloadKey((prev) => prev + 1);
    }
  };

  const videoSrc = useTranscode
    ? `/api/media/${media.id}/preview-stream`
    : `/api/media/${media.id}/file`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] bg-white/98 dark:bg-zinc-950/98 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl overflow-hidden text-foreground">
        <DialogHeader className="gap-1">
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 truncate">
              <Film className="h-5 w-5 text-emerald-400 shrink-0" /> {media.filename}
            </DialogTitle>
            <a
              href={`/api/media/${media.id}/file?download=1`}
              download={media.filename}
              title="Unduh file video asli"
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-xs font-medium text-foreground transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Unduh</span>
            </a>
          </div>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-4 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Durasi: {media.duration}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" /> Ukuran: {media.size}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2">
          <div className="aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 relative shadow-inner">
            {media.filepath ? (
              <>
                <video
                  ref={videoRef}
                  key={`${media.id}-${reloadKey}`}
                  src={videoSrc}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain bg-zinc-950"
                  onError={() => setVideoError(true)}
                  onLoadedMetadata={handleLoadedMetadata}
                />
                {/* General error overlay */}
                {videoError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-zinc-950/95 text-center text-white backdrop-blur-sm z-10">
                    <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/20 mb-3">
                      <AlertCircle className="h-8 w-8 text-amber-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                      Gagal Memuat Video Preview
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mb-4 leading-relaxed">
                      Terjadi kendala saat memuat video preview dari server. Anda dapat mencoba memuat ulang atau mengunduh file asli.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleReload}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
                      >
                        <RotateCw className="h-3.5 w-3.5" /> Coba Muat Ulang
                      </button>
                      <a
                        href={`/api/media/${media.id}/file?download=1`}
                        download={media.filename}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" /> Unduh File Asli
                      </a>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                <Video className="h-12 w-12 text-zinc-600" />
                <p className="text-xs font-medium">Video preview player ready</p>
              </div>
            )}
          </div>

          {/* CPU warning banner — only shown for H.265 transcode mode */}
          {useTranscode && !videoError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06]">
              <Cpu className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-snug">
                <span className="text-amber-300 font-semibold">Mode Transcode H.265</span> — Preview dikonversi ke H.264 secara real-time (480p · max 90 detik).
                Tutup preview saat tidak digunakan agar CPU VPS tidak terbebani.
              </p>
            </div>
          )}
        </div>
      </DialogContent>

    </Dialog>
  );
}



