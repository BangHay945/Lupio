import { spawn, exec, ChildProcess } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { db } from "./db";
import { Stream, Channel, MediaItem } from "../mock-data";
import { sendStreamNotification } from "./webhook";

interface ActiveProcess {
  streamId: string;
  process: ChildProcess;
  startedAt: Date;
  restartCount: number;
  lastHeartbeat?: Date;
  fps?: number;
  bitrateKbps?: number;
  droppedFrames?: number;
}

export interface StreamStats {
  streamId: string;
  isLive: boolean;
  fps: number;
  bitrateKbps: number;
  uptimeSeconds: number;
  cpuPercent: number;
  droppedFrames: number;
  history: Array<{ time: string; bitrate: number; fps: number; cpu: number }>;
}

export class StreamManager {
  private activeProcesses: Map<string, ActiveProcess> = new Map();
  private statsHistoryMap: Map<string, Array<{ time: string; bitrate: number; fps: number; cpu: number }>> = new Map();
  private watchdogTimer: NodeJS.Timeout | null = null;
  private currentActivePlaylistMap: Map<string, string> = new Map();
  private intentionalStops: Set<string> = new Set();
  private reconnectingStreams: Set<string> = new Set();

  constructor() {
    this.setupProcessLifecycle();
    this.startWatchdogDaemon();
    this.initBootRecovery();
  }

  /**
   * Graceful Shutdown: Terminate all spawned FFmpeg processes cleanly when server stops/restarts
   */
  private setupProcessLifecycle() {
    const cleanup = (signal: string) => {
      console.log(`[StreamManager] Received ${signal}. Terminating all active FFmpeg processes gracefully...`);
      for (const [streamId, active] of this.activeProcesses) {
        try {
          if (active && active.process && !active.process.killed) {
            const pid = active.process.pid;
            if (process.platform === "win32" && pid) {
              exec(`taskkill /pid ${pid} /T /F`, () => {});
            } else {
              active.process.kill("SIGKILL");
            }
          }
        } catch (e) {}
      }
      this.activeProcesses.clear();
    };

    process.once("SIGTERM", () => cleanup("SIGTERM"));
    process.once("SIGINT", () => cleanup("SIGINT"));
    process.once("beforeExit", () => cleanup("beforeExit"));
  }

  /**
   * Recovers active streams and schedules automatically after server / VPS restart.
   * Streams with manualStop=true are NEVER auto-resumed.
   */
  private async initBootRecovery() {
    try {
      setTimeout(async () => {
        const streams = db.getStreams();
        for (const stream of streams) {
          // Respect manual stop — never auto-resume a stream the user intentionally stopped
          if (stream.manualStop) {
            stream.status = "OFFLINE";
            db.saveStream(stream);
            continue;
          }
          if (stream.status === "LIVE" || stream.status === "STARTING" || stream.status === "RESTARTING") {
            db.addLog("info", "watchdog", `[Server Boot Recovery] Auto-resuming stream "${stream.name}" after server restart...`);
            await this.startStream(stream.id, false);
          }
        }
      }, 3000);
    } catch (e) {
      console.error("Boot recovery error:", e);
    }
  }

  /**
   * Background Watchdog & Auto-Switcher Loop (Runs every 10 seconds)
   */
  private startWatchdogDaemon() {
    if (this.watchdogTimer) clearInterval(this.watchdogTimer);

    this.watchdogTimer = setInterval(async () => {
      try {
        const settings = db.getSettings();
        const streams = db.getStreams();
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });

        // -------------------------------------------------------------
        // 1. Auto-Healing Watchdog, Auto-Stop Timer & Freeze Detector
        // -------------------------------------------------------------
        for (const stream of streams) {
          // CRITICAL: If user manually stopped this stream, skip ALL auto-restart logic
          if (stream.manualStop) {
            // Also kill any orphaned process that might still be running
            const orphan = this.activeProcesses.get(stream.id);
            if (orphan && orphan.process && !orphan.process.killed) {
              try { orphan.process.kill("SIGKILL"); } catch (e) {}
              this.activeProcesses.delete(stream.id);
            }
            if (stream.status !== "OFFLINE") {
              stream.status = "OFFLINE";
              stream.restartCount = 0;
              db.saveStream(stream);
            }
            continue;
          }

          this.intentionalStops.delete(stream.id); // keep in-memory in sync

          const active = this.activeProcesses.get(stream.id);

          // If child process is actually running in memory, ensure status is LIVE
          if (active && active.process && !active.process.killed && active.process.exitCode === null) {
            if (stream.status !== "LIVE") {
              stream.status = "LIVE";
              stream.restartCount = 0;
              db.saveStream(stream);
              db.addLog("info", "watchdog", `[Watchdog] Synced stream "${stream.name}" status to LIVE (Process is active).`);
            }
          }

          if (stream.status === "LIVE") {
            // Case A: Missing or dead process while stream marked LIVE
            if (!active || !active.process || active.process.killed || active.process.exitCode !== null) {
              if (settings.enableAutoHealing !== false && !this.reconnectingStreams.has(stream.id)) {
                const maxRetries = settings.maxWatchdogRetries || 3;
                const reconnectDelay = settings.reconnectDelay || 5;
                this.triggerAutoRecovery(stream.id, "Process terminated unexpectedly", maxRetries, reconnectDelay);
              }
              continue;
            }

            const runningSeconds = Math.floor((now.getTime() - active.startedAt.getTime()) / 1000);

            // Feature 4: Live Stream Auto-Stop Duration Timer
            if (stream.maxDurationHours && stream.maxDurationHours > 0) {
              const maxSeconds = stream.maxDurationHours * 3600;
              if (runningSeconds >= maxSeconds) {
                db.addLog("info", "watchdog", `[Auto-Stop Timer] Stream "${stream.name}" reached max duration limit (${stream.maxDurationHours}h). Stopping stream gracefully.`);
                sendStreamNotification("STOP", stream.name, stream.channelName || "YouTube Live", `Stream reached max duration limit of ${stream.maxDurationHours}h.`);
                await this.stopStream(stream.id);
                continue;
              }
            }

            // Case B: Encoder Stall / Freeze Detection (>45s no heartbeat after initial warmup)
            if (settings.enableAutoHealing !== false && runningSeconds > 35 && active.lastHeartbeat) {
              const idleSeconds = Math.floor((now.getTime() - active.lastHeartbeat.getTime()) / 1000);
              if (idleSeconds > 45) {
                db.addLog("warn", "watchdog", `[Watchdog Freeze Detector] Stream "${stream.name}" encoder stalled (>45s idle). Force restarting...`);
                try { active.process.kill("SIGKILL"); } catch (e) {}
                this.activeProcesses.delete(stream.id);
                const maxRetries = settings.maxWatchdogRetries || 3;
                const reconnectDelay = settings.reconnectDelay || 5;
                this.triggerAutoRecovery(stream.id, "Encoder stalled (>45s idle)", maxRetries, reconnectDelay);
                continue;
              }
            }

            // Case C: Stable Uptime Reset (Reset retry count after 30 seconds of stable broadcasting)
            if (runningSeconds > 30 && (stream.restartCount || 0) > 0) {
              stream.restartCount = 0;
              db.saveStream(stream);
              db.addLog("info", "watchdog", `[Watchdog] Stream "${stream.name}" is stable (>30s). Reset recovery counter to 0.`);
            }
          }
        }

        // -------------------------------------------------------------
        // 2. Explicit Schedule Actions (Start, Switch, and STOP)
        // -------------------------------------------------------------
        const rules = db.getScheduleRules().filter((r) => r.active);
        for (const rule of rules) {
          const action = rule.action || "switch";
          const isCurrentWindow = this.isTimeInWindow(timeStr, rule.startTime, rule.endTime);

          for (const stream of streams) {
            const matchesStream = !rule.streamName || rule.streamName === stream.name || rule.streamName === "All Streams" || rule.streamId === stream.id;
            if (!matchesStream) continue;

            if (action === "stop") {
              // Explicit Stop Rule: If inside the stop window, stop the stream
              if (isCurrentWindow && stream.status === "LIVE") {
                db.addLog("info", "scheduler", `[Schedule STOP Action] Stopping stream "${stream.name}" per rule "${rule.playlistName || 'Scheduled Stop'}" (${rule.startTime}-${rule.endTime}).`);
                await this.stopStream(stream.id);
              }
            } else if (action === "start") {
              // Explicit Start Rule: start only if not manually stopped
              if (isCurrentWindow && stream.status === "OFFLINE" && !stream.manualStop) {
                db.addLog("info", "scheduler", `[Schedule START Action] Starting stream "${stream.name}" per rule "${rule.playlistName || 'Scheduled Start'}" (${rule.startTime}-${rule.endTime}).`);
                if (rule.playlistId) {
                  stream.playlistId = rule.playlistId;
                  stream.playlistName = rule.playlistName;
                  db.saveStream(stream);
                }
                await this.startStream(stream.id, false);
              }
            } else {
              // Default "switch": Auto-switch playlist while live, or auto-start if NOT manually stopped
              if (isCurrentWindow) {
                if (stream.status === "LIVE") {
                  const prevPlaylist = this.currentActivePlaylistMap.get(stream.id);
                  if (rule.playlistId && prevPlaylist !== rule.playlistId) {
                    db.addLog("info", "scheduler", `[Auto-Switcher] Switching to playlist "${rule.playlistName}" (${rule.startTime}-${rule.endTime}) for stream "${stream.name}"`);
                    this.currentActivePlaylistMap.set(stream.id, rule.playlistId);
                    stream.playlistName = rule.playlistName;
                    stream.playlistId = rule.playlistId;
                    db.saveStream(stream);
                  }
                } else if (stream.status === "OFFLINE" && !stream.manualStop) {
                  db.addLog("info", "scheduler", `[Schedule Auto-Start] Starting stream "${stream.name}" for active rule "${rule.playlistName}" (${rule.startTime}-${rule.endTime}).`);
                  if (rule.playlistId) {
                    stream.playlistId = rule.playlistId;
                    stream.playlistName = rule.playlistName;
                    db.saveStream(stream);
                  }
                  await this.startStream(stream.id, false);
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.error("Watchdog daemon error:", err);
      }
    }, 10000);
  }

  /**
   * Triggers an automatic auto-recovery restart for dropped / crashed streams
   */
  private async triggerAutoRecovery(streamId: string, reason: string, maxRetries: number, delaySeconds: number) {
    if (this.intentionalStops.has(streamId)) return;
    if (this.reconnectingStreams.has(streamId)) return;

    const stream = db.getStreamById(streamId);
    if (!stream || stream.status === "OFFLINE") {
      return;
    }

    this.reconnectingStreams.add(streamId);

    const currentRetries = stream.restartCount || 0;
    if (currentRetries < maxRetries) {
      const nextAttempt = currentRetries + 1;
      stream.status = "STARTING";
      stream.restartCount = nextAttempt;
      db.saveStream(stream);

      db.addLog("warn", "watchdog", `[Watchdog Auto-Healing] "${stream.name}" (${reason}). Reconnecting in ${delaySeconds}s (Attempt #${nextAttempt}/${maxRetries})...`);
      sendStreamNotification("RECONNECT", stream.name, stream.channelName || "YouTube Live", `Auto-recovery attempt #${nextAttempt}/${maxRetries} (${reason})`);

      setTimeout(async () => {
        try {
          if (!this.intentionalStops.has(streamId) && stream.status !== "OFFLINE") {
            await this.startStream(streamId, false);
          }
        } finally {
          this.reconnectingStreams.delete(streamId);
        }
      }, delaySeconds * 1000);
    } else {
      db.addLog("error", "watchdog", `[Watchdog Critical] Stream "${stream.name}" exceeded maximum recovery attempts (${maxRetries}). Marking ERROR.`);
      stream.status = "ERROR";
      db.saveStream(stream);
      sendStreamNotification("ERROR", stream.name, stream.channelName || "YouTube Live", `Stream failed after ${maxRetries} consecutive auto-recovery attempts.`);
      this.reconnectingStreams.delete(streamId);
    }
  }

  private isTimeInWindow(current: string, start: string, end: string): boolean {
    if (start <= end) {
      return current >= start && current <= end;
    } else {
      // Overnight rule (e.g. 22:00 to 06:00)
      return current >= start || current <= end;
    }
  }

  public getActiveProcessCount(): number {
    return this.activeProcesses.size;
  }

  public isStreamActive(streamId: string): boolean {
    return this.activeProcesses.has(streamId);
  }

  public getStreamStats(streamId: string): StreamStats {
    const active = this.activeProcesses.get(streamId);
    const isLive = !!active && !active.process.killed;
    
    const now = new Date();
    const uptimeSeconds = active ? Math.floor((now.getTime() - active.startedAt.getTime()) / 1000) : 0;

    // Real CPU from os.loadavg() — divide by active stream count to estimate per-stream share
    const loadAvg = os.loadavg()[0] || 0;
    const cpuCount = os.cpus().length || 1;
    const activeStreamCount = Math.max(this.activeProcesses.size, 1);
    const systemCpuPercent = Math.min(Math.round((loadAvg / cpuCount) * 100), 99);
    // Estimate per-stream CPU as an even share of total load
    const cpuPercent = isLive ? Math.round(systemCpuPercent / activeStreamCount) : 0;

    // FPS and bitrate: use parsed values from stderr if available, else use last known or estimated
    const fps = active?.fps ?? (isLive ? 29.97 : 0);
    const bitrateKbps = active?.bitrateKbps ?? (isLive ? 8000 : 0);
    const droppedFrames = active?.droppedFrames || 0;

    let history = this.statsHistoryMap.get(streamId) || [];
    const timeLabel = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    if (isLive) {
      history = [...history, { time: timeLabel, bitrate: Math.round(bitrateKbps), fps: Number(fps.toFixed(1)), cpu: cpuPercent }];
      if (history.length > 20) history = history.slice(-20);
      this.statsHistoryMap.set(streamId, history);
    }

    return {
      streamId,
      isLive,
      fps: Number(fps.toFixed(1)),
      bitrateKbps: Math.round(bitrateKbps),
      uptimeSeconds,
      cpuPercent,
      droppedFrames,
      history,
    };
  }

  public async startStream(streamId: string, isBackupMode: boolean = false): Promise<{ success: boolean; message: string }> {
    const stream = db.getStreamById(streamId);
    if (!stream) return { success: false, message: "Stream not found" };

    // Clear manual stop lock — user explicitly wants to start this stream
    if (stream.manualStop) {
      stream.manualStop = false;
      db.saveStream(stream);
    }

    this.intentionalStops.delete(streamId);

    const channels = db.getChannels();
    const mediaList = db.getMedia();
    const playlists = db.getPlaylists();
    const settings = db.getSettings();

    const targetChannels: Channel[] = [];
    if (stream.channelId) {
      const primary = channels.find((c) => c.id === stream.channelId);
      if (primary) targetChannels.push(primary);
    } else if (stream.channelName) {
      const primary = channels.find((c) => c.name === stream.channelName);
      if (primary) targetChannels.push(primary);
    }
    if (targetChannels.length === 0 && channels.length > 0) {
      targetChannels.push(channels[0]);
    }

    if (stream.multiChannelIds && Array.isArray(stream.multiChannelIds)) {
      for (const cid of stream.multiChannelIds) {
        const extra = channels.find((c) => c.id === cid);
        if (extra && !targetChannels.some((tc) => tc.id === extra.id)) {
          targetChannels.push(extra);
        }
      }
    }

    if (targetChannels.length === 0) {
      return { success: false, message: "No valid RTMP channel destination configured." };
    }

    // ---------------------------------------------------------------
    // Resolve input: playlist (multi-track) or single media file
    // ---------------------------------------------------------------
    let inputFilePath: string | undefined;
    let concatManifestPath: string | undefined;
    let isBackup = false;
    let isPlaylist = false;

    // 1. Try to find a matching playlist by playlistId
    const playlist = playlists.find((p) => p.id === stream.playlistId);
    if (playlist && Array.isArray(playlist.mediaItems) && playlist.mediaItems.length > 0) {
      // Resolve all media items that have a valid file on disk
      const validItems = playlist.mediaItems
        .map((item) => {
          // item stored in playlist may have partial data — cross-reference full mediaList for filepath
          const fullMedia = mediaList.find((m) => m.id === item.id) || item;
          return fullMedia;
        })
        .filter((m) => m.filepath && fs.existsSync(m.filepath));

      if (validItems.length > 0) {
        // Write ffconcat manifest to temp directory
        const concatDir = path.join(process.cwd(), "data", "concat");
        if (!fs.existsSync(concatDir)) fs.mkdirSync(concatDir, { recursive: true });

        concatManifestPath = path.join(concatDir, `${streamId}.txt`);

        // Feature 2: Playlist Shuffle / Random Play Mode
        let itemsToPlay = [...validItems];
        if (playlist.isShuffled) {
          for (let i = itemsToPlay.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [itemsToPlay[i], itemsToPlay[j]] = [itemsToPlay[j], itemsToPlay[i]];
          }
          db.addLog("info", "stream", `[Playlist Shuffle] Random playback enabled for "${playlist.name}". Shuffled ${itemsToPlay.length} track(s).`);
        }

        // ffconcat format — paths must use forward slashes and be absolute
        const lines = ["ffconcat version 1.0"];
        for (const m of itemsToPlay) {
          // Escape backslashes for Windows paths in ffconcat
          const safePath = m.filepath!.replace(/\\/g, "/");
          lines.push(`file '${safePath}'`);
        }
        fs.writeFileSync(concatManifestPath, lines.join("\n"), "utf-8");

        inputFilePath = concatManifestPath;
        isPlaylist = true;

        db.addLog(
          "info",
          "stream",
          `[Playlist] "${playlist.name}" — ${itemsToPlay.length} track(s) loaded into ffconcat manifest for stream "${stream.name}".`
        );
      } else {
        db.addLog("warn", "stream", `[Playlist] "${playlist.name}" has no valid files on disk. Falling back to single media lookup.`);
      }
    }

    // 2. Fallback: try single media file (matched by playlistId = mediaId, or by filename)
    if (!inputFilePath) {
      const selectedMedia = mediaList.find(
        (m) => m.id === stream.playlistId || m.filename === stream.playlistName
      );
      if (selectedMedia?.filepath && fs.existsSync(selectedMedia.filepath)) {
        inputFilePath = selectedMedia.filepath;
      }
    }

    // 3. Last resort: emergency backup video
    if (!inputFilePath && (stream.backupMediaId || settings.backupMediaId)) {
      const backupId = stream.backupMediaId || settings.backupMediaId;
      const backupMedia = mediaList.find((m) => m.id === backupId);
      if (backupMedia && backupMedia.filepath && fs.existsSync(backupMedia.filepath)) {
        inputFilePath = backupMedia.filepath;
        isBackup = true;
        db.addLog(
          "warn",
          "stream",
          `Primary media missing for "${stream.name}". Switched to Emergency Backup Video (${backupMedia.filename}).`
        );
      }
    }

    // Scaling, Watermark & Ticker Overlay Chain
    const filterParts: string[] = [];

    // 1. Auto-scale & pad video to match selected output resolution
    let targetScale = "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2";
    if (stream.resolution === "720p") {
      targetScale = "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2";
    } else if (stream.resolution === "4K") {
      targetScale = "scale=3840:2160:force_original_aspect_ratio=decrease,pad=3840:2160:(ow-iw)/2:(oh-ih)/2";
    }
    filterParts.push(targetScale);

    const watermarkText = stream.watermarkText || settings.globalWatermarkText || "";
    const tickerText = stream.tickerText || "";

    const sanitizeFfmpegDrawtext = (text: string) => {
      return text
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "")
        .replace(/:/g, "\\:")
        .replace(/%/g, "\\%")
        .replace(/\[/g, "\\[")
        .replace(/\]/g, "\\]");
    };

    if (watermarkText) {
      const cleanW = sanitizeFfmpegDrawtext(watermarkText);
      filterParts.push(`drawtext=text='${cleanW}':x=w-tw-30:y=30:fontsize=24:fontcolor=white@0.8:shadowcolor=black@0.6:shadowx=2:shadowy=2`);
    }

    if (tickerText) {
      const cleanT = sanitizeFfmpegDrawtext(tickerText);
      filterParts.push(`drawtext=text='${cleanT}':x=w-mod(t*110\\,w+tw):y=h-50:fontsize=22:fontcolor=yellow@0.9:box=1:boxcolor=black@0.6:boxborderw=8`);
    }

    // Feature: Realtime Digital Clock Overlay (with Timezone & Country support)
    if (stream.enableDigitalClock) {
      const pos = stream.clockPosition || "top-right";
      let clockX = "w-tw-30";
      let clockY = "30";
      if (pos === "top-left") { clockX = "30"; clockY = "30"; }
      else if (pos === "bottom-left") { clockX = "30"; clockY = "h-th-30"; }
      else if (pos === "bottom-right") { clockX = "w-tw-30"; clockY = "h-th-30"; }

      const tzLabels: Record<string, string> = {
        "Asia/Jakarta": "WIB",
        "Asia/Makassar": "WITA",
        "Asia/Jayapura": "WIT",
        "Asia/Singapore": "SGT",
        "Asia/Riyadh": "KSA",
        "Asia/Tokyo": "JST",
        "Europe/London": "GMT",
        "America/New_York": "EST",
        "America/Los_Angeles": "PST",
        "UTC": "UTC",
      };

      const tzSuffix = (stream.clockShowLabel !== false && stream.clockTimezone && tzLabels[stream.clockTimezone])
        ? ` ${tzLabels[stream.clockTimezone]}`
        : "";

      filterParts.push(`drawtext=fontcolor=white:fontsize=22:box=1:boxcolor=black@0.6:boxborderw=6:x=${clockX}:y=${clockY}:text='%{localtime\\:%T}${tzSuffix}'`);
    }

    // Feature: PNG Logo Watermark Overlay
    if (stream.logoWatermarkPath && fs.existsSync(stream.logoWatermarkPath)) {
      const safeLogo = stream.logoWatermarkPath.replace(/\\/g, "/");
      const pos = stream.logoPosition || "top-left";
      let overlayCoord = "30:30";
      if (pos === "top-right") overlayCoord = "W-w-30:30";
      else if (pos === "bottom-left") overlayCoord = "30:H-h-30";
      else if (pos === "bottom-right") overlayCoord = "W-w-30:H-h-30";

      filterParts.push(`movie='${safeLogo}',scale=160:-1[logo];[in][logo]overlay=${overlayCoord}`);
    }

    // Playlist & Stream Transition Effects (Anti-Drop Smooth Fades)
    const effectiveTransition = stream.transitionEffect || playlist?.transitionEffect || "full";
    if (effectiveTransition === "fade" || effectiveTransition === "full") {
      filterParts.push("fade=t=in:st=0:d=1.0:color=black");
    }

    if (effectiveTransition !== "none") {
      db.addLog("info", "stream", `[Transition Engine] Stream "${stream.name}" activated with "${effectiveTransition}" smooth broadcast transition.`);
    }

    const filterArgs = filterParts.length > 0 ? ["-vf", filterParts.join(",")] : [];

    // Feature 4: Audio Normalizer & Soft Transition Filter Chain
    const audioFilters: string[] = ["aformat=channel_layouts=stereo:sample_rates=44100"];
    if (effectiveTransition === "crossfade" || effectiveTransition === "full") {
      audioFilters.push("afade=t=in:ss=0:d=1.5");
    }
    if (settings.enableAudioNormalizer !== false) {
      audioFilters.push("loudnorm=I=-16:TP=-1.5:LRA=11");
    }
    const audioFilterArgs = audioFilters.length > 0 ? ["-af", audioFilters.join(",")] : [];

    // Clean Bitrate & Buffer sizes for YouTube RTMP
    const numBitrate = parseInt((stream.bitrate || "4000").replace(/[^0-9]/g, ""), 10) || 4000;
    const cleanBitrate = `${numBitrate}k`;
    const bufsize = `${numBitrate * 2}k`;
    const fps = stream.fps || 30;
    const gop = fps * 2; // YouTube recommends 2-second GOP

    // Ensure local HLS preview folder exists
    const hlsDir = path.join(process.cwd(), "data", "hls", streamId);
    if (!fs.existsSync(hlsDir)) {
      fs.mkdirSync(hlsDir, { recursive: true });
    }
    const hlsMuxer = `[f=hls:hls_time=2:hls_list_size=4:hls_flags=delete_segments]data/hls/${streamId}/index.m3u8`;

    let outputArgs: string[] = [];
    if (targetChannels.length > 1) {
      const rtmpOutputs = targetChannels.map((c) => {
        const url = c.rtmpUrl.endsWith("/") ? c.rtmpUrl : `${c.rtmpUrl}/`;
        return `[f=flv:flvflags=no_duration_filesize:onfail=ignore]${url}${c.streamKey.trim()}`;
      });
      const allOutputs = [...rtmpOutputs, hlsMuxer].join("|");
      outputArgs = ["-f", "tee", "-map", "0:v", "-map", "0:a", allOutputs];
    } else {
      const ch = targetChannels[0];
      const rtmpBase = ch.rtmpUrl.endsWith("/") ? ch.rtmpUrl : `${ch.rtmpUrl}/`;
      const streamKey = ch.streamKey.trim();
      const destination = `${rtmpBase}${streamKey}`;
      const isMockKey = streamKey.includes("test_mock") || streamKey === "mock";

      const flvOutput = isMockKey
        ? `[f=null]pipe:`
        : `[f=flv:flvflags=no_duration_filesize:onfail=ignore]${destination}`;

      const allOutputs = `${flvOutput}|${hlsMuxer}`;
      outputArgs = ["-f", "tee", "-map", "0:v", "-map", "0:a", allOutputs];
    }

    // Hardware Acceleration & Encoder selection
    const hwSetting = (settings.hardwareAccel || "").toLowerCase();
    let videoCodec = "libx264";
    let presetArg = ["-preset", "veryfast"];
    const threadsArg = settings.threadCount ? ["-threads", String(settings.threadCount)] : [];

    if (hwSetting.includes("nvenc")) {
      videoCodec = "h264_nvenc";
      presetArg = ["-preset", "p4"];
    } else if (hwSetting.includes("vaapi")) {
      videoCodec = "h264_vaapi";
      presetArg = [];
    } else if (hwSetting.includes("qsv") || hwSetting.includes("quicksync")) {
      videoCodec = "h264_qsv";
      presetArg = ["-preset", "veryfast"];
    }

    const encodingArgs = [
      "-c:v", videoCodec,
      ...presetArg,
      ...threadsArg,
      "-b:v", cleanBitrate,
      "-maxrate", cleanBitrate,
      "-bufsize", bufsize,
      "-r", String(fps),
      "-g", String(gop),
      "-keyint_min", String(fps),
      "-sc_threshold", "0",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-ar", "44100",
      "-ac", "2",
    ];

    let ffmpegArgs: string[] = [];
    if (inputFilePath && fs.existsSync(/*turbopackIgnore: true*/ inputFilePath)) {
      if (isPlaylist) {
        // Playlist mode: use ffconcat demuxer with -safe 0 for absolute paths
        // -stream_loop -1 loops the entire concat list infinitely
        ffmpegArgs = [
          "-re",
          "-stream_loop", "-1",
          "-f", "concat",
          "-safe", "0",
          "-i", inputFilePath,
          ...filterArgs,
          ...audioFilterArgs,
          ...encodingArgs,
          ...outputArgs,
        ];
      } else {
        // Single file mode: stream_loop -1 loops the file directly
        ffmpegArgs = [
          "-re",
          "-stream_loop", "-1",
          "-i", inputFilePath,
          ...filterArgs,
          ...audioFilterArgs,
          ...encodingArgs,
          ...outputArgs,
        ];
      }
    } else {
      // No file found — stream test pattern so the channel stays alive
      ffmpegArgs = [
        "-re",
        "-f", "lavfi", "-i", "testsrc=size=1920x1080:rate=30",
        "-f", "lavfi", "-i", "sine=frequency=1000:sample_rate=44100",
        ...filterArgs,
        ...audioFilterArgs,
        ...encodingArgs,
        ...outputArgs,
      ];
    }

    let ffmpegPath = settings.ffmpegPath || "ffmpeg";
    const bundledStaticPath = path.join(
      process.cwd(),
      "node_modules",
      "ffmpeg-static",
      process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"
    );

    if (settings.ffmpegPath && settings.ffmpegPath !== "ffmpeg" && fs.existsSync(settings.ffmpegPath)) {
      ffmpegPath = settings.ffmpegPath;
    } else if (fs.existsSync(bundledStaticPath)) {
      ffmpegPath = bundledStaticPath;
    } else {
      try {
        const ffmpegStatic = require("ffmpeg-static");
        if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
          ffmpegPath = ffmpegStatic;
        }
      } catch (e) {}
    }

    try {
      db.addLog("info", "ffmpeg", `Initiating FFmpeg process (${ffmpegPath}) for "${stream.name}" [EBU R128: ${settings.enableAudioNormalizer !== false ? "ON" : "OFF"}]`);

      // Prepare timezone environment if digital clock is enabled
      const env = { ...process.env };
      if (stream.enableDigitalClock && stream.clockTimezone && stream.clockTimezone !== "server") {
        const isWin = process.platform === "win32";
        const posixTzMap: Record<string, string> = {
          "Asia/Jakarta": "WIB-7",
          "Asia/Makassar": "WITA-8",
          "Asia/Jayapura": "WIT-9",
          "Asia/Singapore": "SGT-8",
          "Asia/Riyadh": "AST-3",
          "Asia/Tokyo": "JST-9",
          "Europe/London": "GMT0",
          "America/New_York": "EST5EDT",
          "America/Los_Angeles": "PST8PDT",
          "UTC": "UTC0",
        };
        env.TZ = isWin ? (posixTzMap[stream.clockTimezone] || stream.clockTimezone) : stream.clockTimezone;
      }

      const child = spawn(/*turbopackIgnore: true*/ ffmpegPath, ffmpegArgs, {
        detached: false,
        stdio: ["ignore", "pipe", "pipe"],
        env,
      });

      const activeProc: ActiveProcess = {
        streamId,
        process: child,
        startedAt: new Date(),
        restartCount: isBackupMode ? (stream.restartCount || 0) : 0,
      };

      this.intentionalStops.delete(streamId);
      this.reconnectingStreams.delete(streamId);
      this.activeProcesses.set(streamId, activeProc);

      stream.status = "LIVE";
      stream.restartCount = activeProc.restartCount;
      db.saveStream(stream);

      sendStreamNotification("START", stream.name, targetChannels.map((c) => `${c.platform} (${c.name})`).join(", "), isBackup ? "Active Backup Video Mode" : "Normal Live Transmission");

      child.stderr?.on("data", (chunk: Buffer) => {
        const str = chunk.toString();
        activeProc.lastHeartbeat = new Date();

        // Parse real stats from FFmpeg progress output
        // FFmpeg writes lines like: frame=  120 fps= 30 q=28.0 size=    4096kB time=00:00:04.00 bitrate=8389.0kbits/s drop=0 speed=1.00x
        const fpsMatch = str.match(/fps=\s*([\d.]+)/);
        if (fpsMatch) activeProc.fps = parseFloat(fpsMatch[1]);

        const bitrateMatch = str.match(/bitrate=\s*([\d.]+)kbits\/s/);
        if (bitrateMatch) activeProc.bitrateKbps = parseFloat(bitrateMatch[1]);

        const dropMatch = str.match(/drop=\s*(\d+)/);
        if (dropMatch) activeProc.droppedFrames = parseInt(dropMatch[1]);

        if (str.toLowerCase().includes("error") || str.toLowerCase().includes("fatal")) {
          db.addLog("warn", "ffmpeg", `[${stream.name}] ${str.slice(0, 150)}`);
        }
      });

      child.on("close", (code) => {
        db.addLog("info", "ffmpeg", `FFmpeg process for "${stream.name}" exited with code ${code}`);
        this.activeProcesses.delete(streamId);

        const currentStream = db.getStreamById(streamId);
        if (currentStream) {
          if (this.intentionalStops.has(streamId) || currentStream.status === "OFFLINE") {
            // User intentionally stopped the stream — keep intentionalStops persistent so watchdog won't restart it
            currentStream.status = "OFFLINE";
            currentStream.restartCount = 0;
            db.saveStream(currentStream);
            sendStreamNotification("STOP", stream.name, targetChannels.map((c) => c.name).join(", "), `User stopped stream.`);
          } else {
            // Unexpected crash / disconnect — trigger auto-healing
            const maxRetries = settings.maxWatchdogRetries || 3;
            const reconnectDelay = settings.reconnectDelay || 5;
            this.triggerAutoRecovery(streamId, `Exited with code ${code}`, maxRetries, reconnectDelay);
          }
        }
      });

      child.on("error", (err) => {
        db.addLog("error", "ffmpeg", `Failed to spawn FFmpeg process for "${stream.name}": ${err.message}`);
        this.activeProcesses.delete(streamId);

        if (!this.intentionalStops.has(streamId)) {
          const maxRetries = settings.maxWatchdogRetries || 3;
          const reconnectDelay = settings.reconnectDelay || 5;
          this.triggerAutoRecovery(streamId, `Spawn error: ${err.message}`, maxRetries, reconnectDelay);
        }
      });

      return {
        success: true,
        message: `Stream "${stream.name}" started successfully.`,
      };
    } catch (err: any) {
      db.addLog("error", "system", `Execution error starting stream "${stream.name}": ${err.message}`);
      return { success: false, message: err.message };
    }
  }

  public async stopStream(streamId: string): Promise<{ success: boolean; message: string }> {
    this.intentionalStops.add(streamId);
    this.reconnectingStreams.delete(streamId);

    const stream = db.getStreamById(streamId);
    if (stream) {
      stream.status = "OFFLINE";
      stream.restartCount = 0;
      stream.manualStop = true;  // ← Persist to db.json so auto-restart is blocked after server restart too
      db.saveStream(stream);
      db.addLog("info", "system", `Stream "${stream.name}" stopped by user (manualStop=true).`);
      sendStreamNotification("STOP", stream.name, stream.channelName || "RTMP Target");
    }

    const procObj = this.activeProcesses.get(streamId);
    this.activeProcesses.delete(streamId);
    this.statsHistoryMap.delete(streamId);

    if (procObj && procObj.process) {
      const pid = procObj.process.pid;
      try {
        if (process.platform === "win32" && pid) {
          // On Windows, taskkill /pid <PID> /T /F forces the full process tree to terminate immediately
          exec(`taskkill /pid ${pid} /T /F`, () => {});
        } else if (pid) {
          procObj.process.kill("SIGKILL");
        }
      } catch (e) {
        console.error("Error terminating FFmpeg process:", e);
      }
    }

    // Clean up ffconcat manifest if it exists
    const concatManifestPath = path.join(process.cwd(), "data", "concat", `${streamId}.txt`);
    if (fs.existsSync(concatManifestPath)) {
      try {
        fs.unlinkSync(concatManifestPath);
      } catch (e) {
        // Non-critical — ignore cleanup errors
      }
    }

    // Clean up HLS preview files if they exist
    const hlsDir = path.join(process.cwd(), "data", "hls", streamId);
    if (fs.existsSync(hlsDir)) {
      try {
        fs.rmSync(hlsDir, { recursive: true, force: true });
      } catch (e) {}
    }

    return { success: true, message: `Stream stopped.` };
  }

  public async restartStream(streamId: string): Promise<{ success: boolean; message: string }> {
    await this.stopStream(streamId);
    await new Promise((res) => setTimeout(res, 1500));
    return this.startStream(streamId);
  }
}

export const streamManager = new StreamManager();
