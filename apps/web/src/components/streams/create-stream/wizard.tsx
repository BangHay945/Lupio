"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MediaItem, Playlist, Channel } from "@/lib/mock-data";
import { apiService } from "@/lib/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Radio,
  FileVideo,
  ListVideo,
  Tv,
  Settings2,
  Calendar,
  Rocket,
  ShieldCheck,
  Clock,
  Image as ImageIcon,
  Layers,
} from "lucide-react";
import { CustomSelect } from "@/components/ui/select";
import Link from "next/link";

const STEPS = [
  { id: 1, label: "Basic Info", icon: Radio, desc: "Name & details" },
  { id: 2, label: "Content", icon: ListVideo, desc: "Playlist or video" },
  { id: 3, label: "Destination", icon: Tv, desc: "YouTube / RTMP" },
  { id: 4, label: "Output", icon: Settings2, desc: "Resolution & bitrate" },
  { id: 5, label: "Schedule", icon: Calendar, desc: "Timing & repeat" },
  { id: 6, label: "Review", icon: Rocket, desc: "Verify & launch" },
];

export function CreateStreamWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [playlistList, setPlaylistList] = useState<Playlist[]>([]);
  const [channelList, setChannelList] = useState<Channel[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    contentType: "playlist" as "playlist" | "single",
    selectedPlaylistId: "",
    selectedMediaId: "",
    playbackMode: "sequential" as "sequential" | "shuffle",
    loopMode: "forever" as "forever" | "once",
    channelType: "existing" as "existing" | "custom",
    selectedChannelId: "",
    customRtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
    customStreamKey: "",
    preset: "1080p30",
    resolution: "1080p",
    fps: "30",
    videoBitrate: "8000",
    audioBitrate: "128",
    enableDigitalClock: false,
    clockPosition: "top-right" as "top-left" | "top-right" | "bottom-left" | "bottom-right",
    clockTimezone: "Asia/Jakarta",
    clockShowLabel: true,
    logoWatermarkPath: "",
    logoPosition: "top-left" as "top-left" | "top-right" | "bottom-left" | "bottom-right",
    scheduleType: "now" as "now" | "scheduled",
    startDate: new Date().toISOString().split("T")[0],
    startTime: "20:00",
    repeatRule: "daily" as "never" | "daily" | "weekly",
  });

  useEffect(() => {
    async function loadOptions() {
      try {
        const [realMedia, realPlaylists, realChannels] = await Promise.all([
          apiService.getMedia(),
          apiService.getPlaylists(),
          apiService.getChannels(),
        ]);

        if (Array.isArray(realMedia)) {
          setMediaList(realMedia);
          if (realMedia.length > 0) {
            setFormData((prev) => ({ ...prev, selectedMediaId: prev.selectedMediaId || realMedia[0].id }));
          }
        }
        if (Array.isArray(realPlaylists)) {
          setPlaylistList(realPlaylists);
          if (realPlaylists.length > 0) {
            setFormData((prev) => ({ ...prev, selectedPlaylistId: prev.selectedPlaylistId || realPlaylists[0].id }));
          }
        }
        if (Array.isArray(realChannels)) {
          setChannelList(realChannels);
          if (realChannels.length > 0) {
            setFormData((prev) => ({ ...prev, selectedChannelId: prev.selectedChannelId || realChannels[0].id }));
          }
        }
      } catch (e) {
        console.error("Failed to load options from backend:", e);
      }
    }
    loadOptions();
  }, []);

  const updateForm = (fields: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.name.trim()) {
      (toast as any)({ title: "Validation Error", description: "Silakan masukkan nama stream.", type: "error" });
      return;
    }
    if (currentStep === 2) {
      if (formData.contentType === "playlist" && (!formData.selectedPlaylistId || playlistList.length === 0)) {
        (toast as any)({ title: "Validation Error", description: "Silakan buat dan pilih playlist terlebih dahulu.", type: "error" });
        return;
      }
      if (formData.contentType === "single" && (!formData.selectedMediaId || mediaList.length === 0)) {
        (toast as any)({ title: "Validation Error", description: "Silakan upload dan pilih video terlebih dahulu.", type: "error" });
        return;
      }
    }
    if (currentStep === 3) {
      if (formData.channelType === "existing" && (!formData.selectedChannelId || channelList.length === 0)) {
        (toast as any)({ title: "Validation Error", description: "Silakan tambahkan dan pilih channel target terlebih dahulu.", type: "error" });
        return;
      }
      if (formData.channelType === "custom" && !formData.customStreamKey.trim()) {
        (toast as any)({ title: "Validation Error", description: "Silakan masukkan Stream Key RTMP.", type: "error" });
        return;
      }
    }
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async (startNow: boolean) => {
    try {
      let targetChannelName = "Custom Channel";
      let channelId = formData.selectedChannelId;

      if (formData.channelType === "custom") {
        const createdChannel = await apiService.saveChannel({
          name: formData.name ? `${formData.name} Channel` : "Custom YouTube Channel",
          platform: "YouTube",
          rtmpUrl: formData.customRtmpUrl || "rtmp://a.rtmp.youtube.com/live2",
          streamKey: formData.customStreamKey || "mock-stream-key",
          status: "Active",
        });
        targetChannelName = createdChannel.name;
        channelId = createdChannel.id;
      } else {
        const selectedChannel = channelList.find((c) => c.id === formData.selectedChannelId) || channelList[0];
        targetChannelName = selectedChannel ? selectedChannel.name : "YouTube Channel";
        channelId = selectedChannel ? selectedChannel.id : "";
      }

      const selectedPlaylist = playlistList.find((p) => p.id === formData.selectedPlaylistId);

      await apiService.createStream({
        name: formData.name || "Untitled Stream",
        channelName: targetChannelName,
        channelId: channelId,
        playlistName: formData.contentType === "playlist"
          ? (selectedPlaylist ? selectedPlaylist.name : "Custom Playlist")
          : (mediaList.find((m) => m.id === formData.selectedMediaId)?.filename || "Single File"),
        resolution: formData.resolution,
        fps: formData.fps,
        videoBitrate: formData.videoBitrate,
        scheduleType: startNow ? "now" : formData.scheduleType,
        enableDigitalClock: formData.enableDigitalClock,
        clockPosition: formData.clockPosition,
        clockTimezone: formData.clockTimezone,
        clockShowLabel: formData.clockShowLabel,
        logoWatermarkPath: formData.logoWatermarkPath || undefined,
        logoPosition: formData.logoPosition,
      });

      (toast as any)({
        title: startNow ? "Stream Live!" : "Stream Saved",
        description: startNow
          ? `Stream "${formData.name}" has been launched successfully.`
          : `Stream "${formData.name}" has been created as scheduled.`,
        type: "success",
      });
      router.push("/streams");
    } catch (err: any) {
      (toast as any)({ title: "Error Creating Stream", description: err.message, type: "error" });
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between">
        <Link href="/streams" className="flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Cancel & Back to Streams
        </Link>
        <span className="text-xs font-semibold text-muted-foreground">
          Step {currentStep} of {STEPS.length}
        </span>
      </div>

      {/* Steps Indicator Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {STEPS.map((step) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <button
              key={step.id}
              onClick={() => isCompleted && setCurrentStep(step.id)}
              disabled={!isCompleted && !isActive}
              className={cn(
                "flex flex-col p-3 rounded-xl border text-left transition-all relative overflow-hidden",
                isActive
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-sm"
                  : isCompleted
                  ? "border-white/10 bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                  : "border-white/5 bg-white/[0.01] text-muted-foreground opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <StepIcon className={cn("h-4 w-4", isActive ? "text-emerald-400" : isCompleted ? "text-emerald-500" : "text-muted-foreground")} />
                {isCompleted && <Check className="h-3.5 w-3.5 text-emerald-500" />}
              </div>
              <span className="text-xs font-bold truncate">{step.label}</span>
              <span className="text-[10px] text-muted-foreground truncate">{step.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Main Form Content Card */}
      <Card className="border border-white/10 bg-card/60 backdrop-blur">
        <CardContent className="p-6 md:p-8">
          {/* STEP 1: BASIC INFO */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Basic Information</h2>
                <p className="text-xs text-muted-foreground mt-1">Give your stream a recognizable title and optional notes.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stream Name *</label>
                  <Input
                    placeholder="e.g. 24/7 Lofi Study Beats"
                    value={formData.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description (Optional)</label>
                  <Input
                    placeholder="Internal notes or stream objective"
                    value={formData.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONTENT */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Content Source</h2>
                <p className="text-xs text-muted-foreground mt-1">Select the video content source and playback options.</p>
              </div>

              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateForm({ contentType: "playlist" })}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                    formData.contentType === "playlist"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <ListVideo className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Playlist</p>
                    <p className="text-xs text-muted-foreground">Loop multiple media files</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateForm({ contentType: "single" })}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                    formData.contentType === "single"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <FileVideo className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Single File</p>
                    <p className="text-xs text-muted-foreground">Stream one video file</p>
                  </div>
                </button>
              </div>

              {/* Selector */}
              {formData.contentType === "playlist" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Playlist</label>
                    <Link href="/playlists" target="_blank" className="text-[11px] text-emerald-400 hover:underline">
                      + Buat Playlist
                    </Link>
                  </div>
                  {playlistList.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-center space-y-2">
                      <p className="text-xs text-muted-foreground">Belum ada playlist yang dibuat.</p>
                      <Link href="/playlists" target="_blank" className="text-xs text-emerald-400 hover:underline font-medium inline-block">
                        + Buat Playlist Baru &rarr;
                      </Link>
                    </div>
                  ) : (
                    <select
                      value={formData.selectedPlaylistId}
                      onChange={(e) => updateForm({ selectedPlaylistId: e.target.value })}
                      className="w-full h-10 rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="">-- Pilih Playlist --</option>
                      {playlistList.map((pl) => (
                        <option key={pl.id} value={pl.id}>
                          {pl.name} ({pl.itemCount} items · {pl.totalDuration})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Media File</label>
                    <Link href="/media" target="_blank" className="text-[11px] text-emerald-400 hover:underline">
                      + Upload Video
                    </Link>
                  </div>
                  {mediaList.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-center space-y-2">
                      <p className="text-xs text-muted-foreground">Belum ada video yang diunggah.</p>
                      <Link href="/media" target="_blank" className="text-xs text-emerald-400 hover:underline font-medium inline-block">
                        + Upload Video ke Media Library &rarr;
                      </Link>
                    </div>
                  ) : (
                    <select
                      value={formData.selectedMediaId}
                      onChange={(e) => updateForm({ selectedMediaId: e.target.value })}
                      className="w-full h-10 rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="">-- Pilih Video --</option>
                      {mediaList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.filename} ({m.duration} · {m.size})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Playback Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Playback Order</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.playbackMode === "sequential" ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => updateForm({ playbackMode: "sequential" })}
                    >
                      Sequential
                    </Button>
                    <Button
                      type="button"
                      variant={formData.playbackMode === "shuffle" ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => updateForm({ playbackMode: "shuffle" })}
                    >
                      Shuffle
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Loop Behavior</label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={formData.loopMode === "forever" ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => updateForm({ loopMode: "forever" })}
                    >
                      Loop Forever (24/7)
                    </Button>
                    <Button
                      type="button"
                      variant={formData.loopMode === "once" ? "secondary" : "outline"}
                      size="sm"
                      className="flex-1"
                      onClick={() => updateForm({ loopMode: "once" })}
                    >
                      Play Once
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: DESTINATION */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Destination Channel</h2>
                <p className="text-xs text-muted-foreground mt-1">Configure your stream destination or RTMP keys.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateForm({ channelType: "existing" })}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                    formData.channelType === "existing"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <Tv className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Existing Channel</p>
                    <p className="text-xs text-muted-foreground">Pick preconfigured channel</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => updateForm({ channelType: "custom" })}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                    formData.channelType === "custom"
                      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  )}
                >
                  <ShieldCheck className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">Custom RTMP</p>
                    <p className="text-xs text-muted-foreground">Enter URL & Stream Key</p>
                  </div>
                </button>
              </div>

              {formData.channelType === "existing" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Channel</label>
                    <Link href="/channels" target="_blank" className="text-[11px] text-emerald-400 hover:underline">
                      + Tambah Channel
                    </Link>
                  </div>
                  {channelList.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-center space-y-2">
                      <p className="text-xs text-muted-foreground">Belum ada channel RTMP tersimpan.</p>
                      <Link href="/channels" target="_blank" className="text-xs text-emerald-400 hover:underline font-medium inline-block">
                        + Tambahkan Channel Baru &rarr;
                      </Link>
                    </div>
                  ) : (
                    <select
                      value={formData.selectedChannelId}
                      onChange={(e) => updateForm({ selectedChannelId: e.target.value })}
                      className="w-full h-10 rounded-md border border-white/10 bg-zinc-900 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="">-- Pilih Channel Target --</option>
                      {channelList.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.name} ({ch.platform})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">RTMPS Server URL</label>
                    <Input
                      value={formData.customRtmpUrl}
                      onChange={(e) => updateForm({ customRtmpUrl: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stream Key</label>
                    <Input
                      type="password"
                      placeholder="live_12345_abcde..."
                      value={formData.customStreamKey}
                      onChange={(e) => updateForm({ customStreamKey: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: OUTPUT */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Output Encoding Settings</h2>
                <p className="text-xs text-muted-foreground mt-1">Select video quality preset and encoding bitrates.</p>
              </div>

              {/* Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => updateForm({ preset: "1080p30", resolution: "1080p", fps: "30", videoBitrate: "8000" })}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    formData.preset === "1080p30" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5"
                  )}
                >
                  <p className="text-sm font-bold">1080p Full HD</p>
                  <p className="text-xs text-muted-foreground mt-1">1920x1080 @ 30fps · 8 Mbps</p>
                </button>

                <button
                  type="button"
                  onClick={() => updateForm({ preset: "720p30", resolution: "720p", fps: "30", videoBitrate: "4000" })}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    formData.preset === "720p30" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5"
                  )}
                >
                  <p className="text-sm font-bold">720p HD Standard</p>
                  <p className="text-xs text-muted-foreground mt-1">1280x720 @ 30fps · 4 Mbps</p>
                </button>

                <button
                  type="button"
                  onClick={() => updateForm({ preset: "4k60", resolution: "4K", fps: "60", videoBitrate: "15000" })}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    formData.preset === "4k60" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5"
                  )}
                >
                  <p className="text-sm font-bold">4K Ultra HD</p>
                  <p className="text-xs text-muted-foreground mt-1">3840x2160 @ 60fps · 15 Mbps</p>
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-white/10 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resolution</label>
                  <Input value={formData.resolution} onChange={(e) => updateForm({ resolution: e.target.value })} className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">FPS</label>
                  <Input value={formData.fps} onChange={(e) => updateForm({ fps: e.target.value })} className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Video Bitrate (Kbps)</label>
                  <Input value={formData.videoBitrate} onChange={(e) => updateForm({ videoBitrate: e.target.value })} className="bg-white/5 border-white/10" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audio Bitrate (Kbps)</label>
                  <Input value={formData.audioBitrate} onChange={(e) => updateForm({ audioBitrate: e.target.value })} className="bg-white/5 border-white/10" />
                </div>
              </div>

              {/* Overlays & Branding (Clock & Logo Watermark) */}
              <div className="space-y-4 border-t border-white/10 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-emerald-400" /> Visual Overlays & Branding
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Burn digital clock timecode and logo watermark into the stream.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Digital Clock */}
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                        <Clock className="h-3.5 w-3.5 text-blue-400" /> Realtime Digital Clock
                      </span>
                      <button
                        type="button"
                        onClick={() => updateForm({ enableDigitalClock: !formData.enableDigitalClock })}
                        className={cn(
                          "text-[10px] px-2.5 py-0.5 rounded font-bold transition-all",
                          formData.enableDigitalClock
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/5 text-zinc-400 border border-white/10 hover:text-white"
                        )}
                      >
                        {formData.enableDigitalClock ? "ENABLED" : "DISABLED"}
                      </button>
                    </div>

                    {formData.enableDigitalClock ? (
                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Clock Placement</label>
                          <select
                            value={formData.clockPosition}
                            onChange={(e) => updateForm({ clockPosition: e.target.value as any })}
                            className="w-full h-9 rounded-md border border-white/10 bg-zinc-900 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="top-right">Top Right (Pojok Kanan Atas)</option>
                            <option value="top-left">Top Left (Pojok Kiri Atas)</option>
                            <option value="bottom-right">Bottom Right (Pojok Kanan Bawah)</option>
                            <option value="bottom-left">Bottom Left (Pojok Kiri Bawah)</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground font-medium">Zona Waktu / Negara</label>
                          <select
                            value={formData.clockTimezone}
                            onChange={(e) => updateForm({ clockTimezone: e.target.value })}
                            className="w-full h-9 rounded-md border border-white/10 bg-zinc-900 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="Asia/Jakarta">🇮🇩 WIB (Jakarta, Jawa, Sumatra - UTC+7)</option>
                            <option value="Asia/Makassar">🇮🇩 WITA (Bali, Makassar, NTB - UTC+8)</option>
                            <option value="Asia/Jayapura">🇮🇩 WIT (Jayapura, Maluku, Papua - UTC+9)</option>
                            <option value="Asia/Singapore">🇸🇬 SGT (Singapura & Malaysia - UTC+8)</option>
                            <option value="Asia/Riyadh">🇸🇦 KSA (Arab Saudi / Makkah - UTC+3)</option>
                            <option value="Asia/Tokyo">🇯🇵 JST (Tokyo / Jepang - UTC+9)</option>
                            <option value="Europe/London">🇬🇧 GMT/UTC (London / Inggris - UTC+0)</option>
                            <option value="America/New_York">🇺🇸 EST (New York / AS - UTC-5)</option>
                            <option value="America/Los_Angeles">🇺🇸 PST (Los Angeles / AS - UTC-8)</option>
                            <option value="UTC">🌐 UTC (Universal Coordinated Time)</option>
                            <option value="server">🖥️ Waktu Server Lokal (System Default)</option>
                          </select>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer pt-1 text-xs select-none">
                          <input
                            type="checkbox"
                            checked={formData.clockShowLabel}
                            onChange={(e) => updateForm({ clockShowLabel: e.target.checked })}
                            className="rounded border-white/20 bg-zinc-900 text-emerald-500 focus:ring-0 h-3.5 w-3.5"
                          />
                          <span className="text-[11px] text-zinc-300">
                            Tampilkan label zona waktu (misal: <span className="font-mono text-emerald-400">21:00:00 WIB</span>)
                          </span>
                        </label>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 italic">
                        Real-time UTC/Server HH:MM:SS live timecode burned into broadcast video.
                      </p>
                    )}
                  </div>

                  {/* Logo Watermark */}
                  <div className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                        <ImageIcon className="h-3.5 w-3.5 text-purple-400" /> Logo PNG Watermark
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Input
                        placeholder="File path, e.g. uploads/logo.png"
                        value={formData.logoWatermarkPath}
                        onChange={(e) => updateForm({ logoWatermarkPath: e.target.value })}
                        className="bg-white/5 border-white/10 text-xs h-9"
                      />
                      <select
                        value={formData.logoPosition}
                        onChange={(e) => updateForm({ logoPosition: e.target.value as any })}
                        className="w-full h-9 rounded-md border border-white/10 bg-zinc-900 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="top-left">Top Left (Pojok Kiri Atas)</option>
                        <option value="top-right">Top Right (Pojok Kanan Atas)</option>
                        <option value="bottom-left">Bottom Left (Pojok Kiri Bawah)</option>
                        <option value="bottom-right">Bottom Right (Pojok Kanan Bawah)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SCHEDULE */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Schedule & Timing</h2>
                <p className="text-xs text-muted-foreground mt-1">Choose when to launch your broadcast.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateForm({ scheduleType: "now" })}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    formData.scheduleType === "now" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5"
                  )}
                >
                  <p className="text-sm font-bold">Start Immediately</p>
                  <p className="text-xs text-muted-foreground mt-1">Launch FFmpeg stream worker as soon as saved</p>
                </button>

                <button
                  type="button"
                  onClick={() => updateForm({ scheduleType: "scheduled" })}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    formData.scheduleType === "scheduled" ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5"
                  )}
                >
                  <p className="text-sm font-bold">Schedule for Later</p>
                  <p className="text-xs text-muted-foreground mt-1">Set a start date, time, and recurrence rule</p>
                </button>
              </div>

              {formData.scheduleType === "scheduled" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/10 pt-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Date</label>
                    <Input type="date" value={formData.startDate} onChange={(e) => updateForm({ startDate: e.target.value })} className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Start Time</label>
                    <Input type="time" value={formData.startTime} onChange={(e) => updateForm({ startTime: e.target.value })} className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recurrence</label>
                    <CustomSelect
                      value={formData.repeatRule}
                      onChange={(val) => updateForm({ repeatRule: val as any })}
                      options={[
                        { value: "never", label: "One-time Event" },
                        { value: "daily", label: "Daily" },
                        { value: "weekly", label: "Weekly" },
                      ]}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 6: REVIEW */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Review Configuration</h2>
                <p className="text-xs text-muted-foreground mt-1">Verify all stream parameters before initiating the worker.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.02] border border-white/10 p-5 rounded-xl text-sm">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Stream Name</p>
                  <p className="font-semibold text-foreground mt-0.5">{formData.name || "Untitled Stream"}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Content Source</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {formData.contentType === "playlist"
                      ? `Playlist: ${playlistList.find((p) => p.id === formData.selectedPlaylistId)?.name || formData.selectedPlaylistId || "Belum dipilih"}`
                      : `Single File: ${mediaList.find((m) => m.id === formData.selectedMediaId)?.filename || formData.selectedMediaId || "Belum dipilih"}`}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Destination</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {formData.channelType === "existing"
                      ? channelList.find((c) => c.id === formData.selectedChannelId)?.name || formData.selectedChannelId || "Belum dipilih"
                      : `Custom RTMPS (${formData.customRtmpUrl})`}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Quality Output</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {formData.resolution} @ {formData.fps}fps · {formData.videoBitrate} Kbps
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Playback & Loop</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {formData.playbackMode} · {formData.loopMode === "forever" ? "Loop 24/7" : "Once"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Timing</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {formData.scheduleType === "now"
                      ? "Start Immediately"
                      : `Scheduled: ${formData.startDate} ${formData.startTime} (${formData.repeatRule})`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Nav Buttons */}
          <div className="flex items-center justify-between border-t border-white/10 pt-6 mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="border-white/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={handleNext} className="bg-emerald-500 text-black hover:bg-emerald-400 font-semibold">
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleFinish(false)}
                  className="border-white/10"
                >
                  Save Draft
                </Button>
                <Button
                  type="button"
                  onClick={() => handleFinish(true)}
                  className="bg-emerald-500 text-black hover:bg-emerald-400 font-bold px-6"
                >
                  <Rocket className="mr-2 h-4 w-4" /> Start Stream Now
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
