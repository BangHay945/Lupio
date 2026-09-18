"use client";

import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { MonitorPlay, Loader2, Volume2, VolumeX, Maximize2, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LivePreviewPlayerProps {
  streamId: string;
  streamName: string;
  isLive: boolean;
  status: string;
  fallbackMediaUrl?: string;
}

export function LivePreviewPlayer({
  streamId,
  streamName,
  isLive,
  status,
  fallbackMediaUrl,
}: LivePreviewPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  const [loading, setLoading] = useState(false);
  const [muted, setMuted] = useState(true);
  const [hasFeed, setHasFeed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const previewUrl = `/api/streams/${streamId}/preview/index.m3u8`;

  useEffect(() => {
    let hls: Hls | null = null;
    let timer: NodeJS.Timeout | null = null;

    if (!isLive) {
      setHasFeed(false);
      setLoading(false);
      if (hlsInstance) {
        hlsInstance.destroy();
        setHlsInstance(null);
      }
      return;
    }

    setLoading(true);

    const initHls = () => {
      const video = videoRef.current;
      if (!video) return;

      if (Hls.isSupported()) {
        if (hls) hls.destroy();

        hls = new Hls({
          maxBufferLength: 4,
          maxMaxBufferLength: 8,
          liveSyncDurationCount: 2,
          liveMaxLatencyDurationCount: 4,
          manifestLoadingTimeOut: 3000,
          manifestLoadingMaxRetry: 10,
        });

        hls.loadSource(previewUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          setHasFeed(true);
          video.play().catch(() => {});
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                // Manifest not created yet by FFmpeg, retry after delay
                timer = setTimeout(() => {
                  setRetryCount((c) => c + 1);
                  if (hls) {
                    hls.loadSource(previewUrl);
                  }
                }, 2000);
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                hls?.destroy();
                break;
            }
          }
        });

        setHlsInstance(hls);
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Native HLS for Safari / iOS
        video.src = previewUrl;
        video.addEventListener("loadedmetadata", () => {
          setLoading(false);
          setHasFeed(true);
          video.play().catch(() => {});
        });
      }
    };

    // Small delay to allow FFmpeg to write first segment
    timer = setTimeout(initHls, 1500);

    return () => {
      if (timer) clearTimeout(timer);
      if (hls) {
        hls.destroy();
      }
    };
  }, [streamId, isLive]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div className="aspect-video bg-black rounded-xl border border-white/10 overflow-hidden relative group select-none">
      {/* Top Status Badges */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
        {isLive ? (
          <div className="bg-emerald-500/20 backdrop-blur border border-emerald-500/40 text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            LIVE TRANSMITTING
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur border border-white/20 text-white/70 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-zinc-500" />
            OFFLINE
          </div>
        )}

        {isLive && hasFeed && (
          <div className="bg-blue-500/20 backdrop-blur border border-blue-500/40 text-blue-400 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
            <Radio className="h-2.5 w-2.5" /> HLS LOW-LATENCY
          </div>
        )}
      </div>

      {/* Main Video Surface */}
      <video
        ref={videoRef}
        muted={muted}
        playsInline
        autoPlay
        className={`w-full h-full object-contain ${
          isLive && hasFeed ? "opacity-100" : isLive ? "opacity-30" : fallbackMediaUrl ? "opacity-70" : "opacity-0"
        } transition-opacity duration-300`}
        src={!isLive && fallbackMediaUrl ? fallbackMediaUrl : undefined}
      />

      {/* Loading Overlay while waiting for first HLS segment */}
      {isLive && loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm gap-2">
          <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          <p className="text-xs font-semibold text-emerald-400">Syncing Live HLS Video Feed...</p>
          <p className="text-[10px] text-muted-foreground">Buffering realtime encoder segments</p>
        </div>
      )}

      {/* Offline Placeholder */}
      {!isLive && !fallbackMediaUrl && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <MonitorPlay className="h-12 w-12 text-zinc-600 mb-2" />
          <p className="text-sm font-semibold text-zinc-400">Encoder is Currently Offline</p>
          <p className="text-xs text-zinc-600 mt-0.5">Start stream to begin broadcasting and live preview.</p>
        </div>
      )}

      {/* Hover Floating Controls Bar */}
      {isLive && (
        <div className="absolute bottom-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-black/70 backdrop-blur border border-white/10 p-1 rounded-lg shadow-lg">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleMute}
            className="h-7 w-7 p-0 text-white hover:bg-white/20"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            className="h-7 w-7 p-0 text-white hover:bg-white/20"
            title="Fullscreen"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
