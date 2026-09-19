"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MediaItem } from "@/lib/mock-data";
import { Film, HardDrive, Clock, Video, Download, ExternalLink, AlertCircle, RotateCw, Sparkles, HelpCircle, ChevronDown, ChevronUp, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem | null;
}

export function MediaPreviewDialog({ open, onOpenChange, media }: MediaPreviewDialogProps) {
  const [videoError, setVideoError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [compatibleMode, setCompatibleMode] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (open) {
      setVideoError(false);
      setReloadKey(0);
      setCompatibleMode(false);
      setShowHelp(false);
    }
  }, [open, media?.id]);

  if (!media) return null;

  const handleReload = () => {
    setVideoError(false);
    setReloadKey((prev) => prev + 1);
  };

  const videoSrc = compatibleMode
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
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCompatibleMode((prev) => !prev);
                  setVideoError(false);
                  setReloadKey((prev) => prev + 1);
                }}
                title={compatibleMode ? "Kembali ke file asli" : "Streaming via H.264 (Solusi Layar Putih)"}
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all shadow-sm",
                  compatibleMode
                    ? "bg-emerald-600 border-emerald-500 text-white"
                    : "border-slate-200 dark:border-white/10 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-foreground"
                )}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>{compatibleMode ? "Mode Kompatibel Aktif" : "Mode Kompatibel (H.264)"}</span>
              </button>

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
          </div>
          <DialogDescription className="text-xs text-muted-foreground flex items-center gap-4 mt-0.5">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> Durasi: {media.duration}
            </span>
            <span className="flex items-center gap-1">
              <HardDrive className="h-3 w-3" /> Ukuran: {media.size}
            </span>
            {compatibleMode && (
              <span className="text-emerald-500 font-medium">
                • Streaming H.264 On-The-Fly
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2.5">
          <div className="aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 relative shadow-inner">
            {media.filepath ? (
              <>
                <video
                  key={`${media.id}-${compatibleMode ? "compat" : "orig"}-${reloadKey}`}
                  src={videoSrc}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="w-full h-full object-contain bg-zinc-950"
                  onError={() => setVideoError(true)}
                />
                {videoError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-zinc-950/95 text-center text-white backdrop-blur-sm z-10">
                    <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/20 mb-3">
                      <AlertCircle className="h-8 w-8 text-amber-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-zinc-100 mb-1">
                      Format / Codec Tidak Didukung Langsung
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mb-4 leading-relaxed">
                      Browser tidak dapat memutar codec video ini. Klik tombol di bawah untuk memutar dalam Mode Kompatibel (H.264) atau unduh file aslinya.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCompatibleMode(true);
                          setVideoError(false);
                          setReloadKey((p) => p + 1);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-colors"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Putar Mode Kompatibel
                      </button>
                      <a
                        href={`/api/media/${media.id}/file?download=1`}
                        download={media.filename}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                      >
                        <Download className="h-3.5 w-3.5" /> Unduh File Asli
                      </a>
                      <button
                        type="button"
                        onClick={handleReload}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                      >
                        <RotateCw className="h-3.5 w-3.5" /> Coba Muat Ulang
                      </button>
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

          {/* Quick Troubleshooting Banner */}
          <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-zinc-900/50 p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-700 dark:text-zinc-300 font-medium">
                <HelpCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Video bersuara tapi layar putih / kosong?</span>
              </div>
              <button
                type="button"
                onClick={() => setShowHelp((prev) => !prev)}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
              >
                {showHelp ? "Tutup Panduan" : "Lihat Solusi"}
                {showHelp ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {showHelp && (
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-white/10 space-y-2.5 text-slate-600 dark:text-zinc-400 leading-relaxed animate-in fade-in">
                <p>
                  Layar putih saat audio berputar disebabkan oleh <strong>Akselerasi Grafis (Hardware Acceleration)</strong> di browser Chrome/Edge yang bermasalah dengan codec video Anda (misal HEVC/H.265).
                </p>
                <div className="bg-white dark:bg-zinc-950 p-2.5 rounded-lg border border-slate-200 dark:border-white/10 space-y-1.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <Monitor className="h-3.5 w-3.5 text-emerald-500" />
                    Cara Atasi di Google Chrome (Permanen):
                  </div>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-[11px]">
                    <li>Buka tab baru dan ketik: <code className="bg-slate-100 dark:bg-zinc-900 px-1 py-0.5 rounded text-emerald-500 font-mono">chrome://settings/system</code></li>
                    <li>Matikan toggle <strong>"Gunakan akselerasi grafis jika tersedia"</strong> (<em>Use graphics acceleration when available</em>).</li>
                    <li>Klik tombol <strong>Muat Ulang (Relaunch)</strong> Chrome.</li>
                  </ol>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span>Atau gunakan tombol di atas:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCompatibleMode(true);
                      setVideoError(false);
                      setReloadKey((p) => p + 1);
                    }}
                    className="text-emerald-600 dark:text-emerald-400 font-bold underline"
                  >
                    Aktifkan Mode Kompatibel (H.264)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


