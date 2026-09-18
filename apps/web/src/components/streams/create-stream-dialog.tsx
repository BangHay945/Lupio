"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiService } from "@/lib/services/api";
import { Channel, MediaItem, Playlist, Stream } from "@/lib/mock-data";
import { toast } from "@/components/ui/toast";
import { Tv, Film, Video, Key, Play, Plus, Pencil, Layers, Type, ShieldAlert, Share2, Clock, Image as ImageIcon } from "lucide-react";
import { CustomSelect } from "@/components/ui/select";

interface CreateStreamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stream?: Stream | null;
  onSuccess: () => void;
}

export function CreateStreamDialog({ open, onOpenChange, stream, onSuccess }: CreateStreamDialogProps) {
  const [streamName, setStreamName] = useState("");
  const [channels, setChannels] = useState<Channel[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  
  const [selectedChannelId, setSelectedChannelId] = useState("");
  const [selectedMultiChannelIds, setSelectedMultiChannelIds] = useState<string[]>([]);
  const [contentType, setContentType] = useState<"media" | "playlist">("media");
  const [selectedMediaId, setSelectedMediaId] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState("");
  const [preset, setPreset] = useState("1080p30");

  // Advanced Overlay & Anti-Drop Backup
  const [watermarkText, setWatermarkText] = useState("");
  const [tickerText, setTickerText] = useState("");
  const [enableDigitalClock, setEnableDigitalClock] = useState(false);
  const [clockPosition, setClockPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("top-right");
  const [clockTimezone, setClockTimezone] = useState("Asia/Jakarta");
  const [clockShowLabel, setClockShowLabel] = useState(true);
  const [logoWatermarkPath, setLogoWatermarkPath] = useState("");
  const [logoPosition, setLogoPosition] = useState<"top-left" | "top-right" | "bottom-left" | "bottom-right">("top-left");
  const [backupMediaId, setBackupMediaId] = useState("");
  const [transitionEffect, setTransitionEffect] = useState("full");
  const [maxDurationHours, setMaxDurationHours] = useState<number>(0);
  
  // Custom Channel Inline State
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newStreamKey, setNewStreamKey] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open, stream]);

  const loadInitialData = async () => {
    try {
      const [chData, plData, medData] = await Promise.all([
        apiService.getChannels(),
        apiService.getPlaylists(),
        apiService.getMedia(),
      ]);
      setChannels(Array.isArray(chData) ? chData : []);
      setPlaylists(Array.isArray(plData) ? plData : []);
      setMediaItems(Array.isArray(medData) ? medData : []);

      if (stream) {
        setStreamName(stream.name || "");
        setWatermarkText(stream.watermarkText || "");
        setTickerText(stream.tickerText || "");
        setEnableDigitalClock(Boolean(stream.enableDigitalClock));
        setClockPosition((stream.clockPosition as any) || "top-right");
        setClockTimezone(stream.clockTimezone || "Asia/Jakarta");
        setClockShowLabel(stream.clockShowLabel !== false);
        setLogoWatermarkPath(stream.logoWatermarkPath || "");
        setLogoPosition((stream.logoPosition as any) || "top-left");
        setBackupMediaId(stream.backupMediaId || "");
        setTransitionEffect(stream.transitionEffect || "full");
        setMaxDurationHours(stream.maxDurationHours || 0);
        if (stream.channelId) setSelectedChannelId(stream.channelId);
        if (stream.multiChannelIds) setSelectedMultiChannelIds(stream.multiChannelIds);

        if (stream.resolution === "720p") setPreset("720p30");
        else if (stream.resolution === "4K") setPreset("4k60");
        else setPreset("1080p30");
      } else {
        setStreamName("");
        setWatermarkText("");
        setTickerText("");
        setEnableDigitalClock(false);
        setClockPosition("top-right");
        setClockTimezone("Asia/Jakarta");
        setClockShowLabel(true);
        setLogoWatermarkPath("");
        setLogoPosition("top-left");
        setBackupMediaId("");
        setMaxDurationHours(0);
        setSelectedMultiChannelIds([]);
        if (Array.isArray(chData) && chData.length > 0) setSelectedChannelId(chData[0].id);
        if (Array.isArray(medData) && medData.length > 0) setSelectedMediaId(medData[0].id);
        if (Array.isArray(plData) && plData.length > 0) setSelectedPlaylistId(plData[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleMultiChannel = (cid: string) => {
    setSelectedMultiChannelIds((prev) =>
      prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]
    );
  };

  const handleSave = async (startNow: boolean) => {
    if (!streamName.trim()) {
      (toast as any)({ title: "Validation Error", description: "Please enter a stream name.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      let finalChannelId = selectedChannelId;
      let finalChannelName = channels.find((c) => c.id === selectedChannelId)?.name || "YouTube Channel";

      if (showAddChannel) {
        if (!newStreamKey.trim()) {
          (toast as any)({ title: "Validation Error", description: "Please enter your YouTube Stream Key.", type: "error" });
          setLoading(false);
          return;
        }
        const createdChannel = await apiService.saveChannel({
          name: newChannelName.trim() || "My YouTube Channel",
          platform: "YouTube",
          rtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
          streamKey: newStreamKey.trim(),
          status: "Active",
        });
        finalChannelId = createdChannel.id;
        finalChannelName = createdChannel.name;
      }

      let res = "1080p";
      let fps = 30;
      let bitrate = "8000 Kbps";

      if (preset === "720p30") {
        res = "720p";
        fps = 30;
        bitrate = "4000 Kbps";
      } else if (preset === "4k60") {
        res = "4K";
        fps = 60;
        bitrate = "15000 Kbps";
      }

      let playlistName = "Single File";
      let playlistId = "";
      if (contentType === "playlist") {
        playlistName = playlists.find((p) => p.id === selectedPlaylistId)?.name || "Custom Playlist";
        playlistId = selectedPlaylistId;
      } else {
        playlistName = mediaItems.find((m) => m.id === selectedMediaId)?.filename || "Single File";
        playlistId = selectedMediaId;
      }

      const payload = {
        name: streamName.trim(),
        channelName: finalChannelName,
        channelId: finalChannelId,
        playlistName,
        playlistId,
        resolution: res,
        fps,
        bitrate,
        transitionEffect,
        multiChannelIds: selectedMultiChannelIds,
        watermarkText: watermarkText.trim(),
        tickerText: tickerText.trim(),
        enableDigitalClock,
        clockPosition,
        clockTimezone,
        clockShowLabel,
        logoWatermarkPath: logoWatermarkPath.trim() || undefined,
        logoPosition,
        backupMediaId,
        maxDurationHours: Number(maxDurationHours) || 0,
        enableOverlay: Boolean(watermarkText || tickerText || enableDigitalClock || logoWatermarkPath),
      };

      if (stream) {
        // Edit Mode
        const updated = await apiService.updateStream(stream.id, payload);

        if (startNow) {
          await apiService.controlStream(stream.id, "start");
        }

        (toast as any)({
          title: "Stream Updated! ✨",
          description: `"${updated.name}" settings updated successfully.`,
          type: "success",
        });
      } else {
        // Create Mode
        const createdStream = await apiService.createStream({
          ...payload,
          videoBitrate: bitrate,
          scheduleType: startNow ? "now" : "later",
        });

        if (startNow && createdStream?.id) {
          await apiService.controlStream(createdStream.id, "start");
        }

        (toast as any)({
          title: startNow ? "Stream Live! 🚀" : "Stream Created",
          description: startNow ? `"${streamName}" is now streaming live.` : `"${streamName}" saved successfully.`,
          type: "success",
        });
      }

      setStreamName("");
      setShowAddChannel(false);
      setNewChannelName("");
      setNewStreamKey("");
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      (toast as any)({ title: "Error", description: e.message || "Failed to save stream", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] bg-white/98 dark:bg-zinc-950/98 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto text-foreground">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {stream ? (
              <>
                <Pencil className="h-5 w-5 text-emerald-400" /> Edit Stream Settings
              </>
            ) : (
              <>
                <Video className="h-5 w-5 text-emerald-400" /> Create Live Stream
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure multi-destination restreaming, overlays, emergency backup, and output resolution.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* Stream Name */}
          <div className="space-y-1.5">
            <label className="font-semibold uppercase tracking-wider text-muted-foreground">Stream Title *</label>
            <Input
              placeholder="e.g. 24/7 Lofi Study Beats"
              value={streamName}
              onChange={(e) => setStreamName(e.target.value)}
              className="bg-white/5 border-white/10 h-10"
            />
          </div>

          {/* Primary Target Channel */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tv className="h-3.5 w-3.5" /> Primary Target Channel
              </label>
              <button
                type="button"
                onClick={() => setShowAddChannel(!showAddChannel)}
                className="text-[11px] font-medium text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> {showAddChannel ? "Select Existing" : "Add New Key"}
              </button>
            </div>

            {showAddChannel ? (
              <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2.5">
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground">Channel Name</label>
                  <Input
                    placeholder="e.g. My YouTube Channel"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="bg-white/5 border-white/10 h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-muted-foreground flex items-center gap-1">
                    <Key className="h-3 w-3 text-emerald-400" /> YouTube Stream Key *
                  </label>
                  <Input
                    type="password"
                    placeholder="Paste key from YouTube Studio..."
                    value={newStreamKey}
                    onChange={(e) => setNewStreamKey(e.target.value)}
                    className="bg-white/5 border-white/10 h-9 text-xs"
                  />
                </div>
              </div>
            ) : (
              <CustomSelect
                value={selectedChannelId}
                onChange={setSelectedChannelId}
                placeholder="Select broadcast channel..."
                options={
                  channels.length === 0
                    ? [{ value: "", label: "No channels available (Click Add New Key)" }]
                    : channels.map((c) => ({
                        value: c.id,
                        label: `${c.name} (${c.platform})`,
                      }))
                }
              />
            )}
          </div>

          {/* Multi-Destination Restreaming (Simultaneous Push) */}
          {channels.length > 1 && (
            <div className="space-y-2 p-3 rounded-xl border border-white/10 bg-black/40">
              <label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                <Share2 className="h-4 w-4 text-emerald-400" /> Multi-Destination Restreaming (Simultaneous Push)
              </label>
              <p className="text-[11px] text-muted-foreground">Select additional platforms to broadcast to at the same time:</p>
              <div className="flex flex-wrap gap-2 pt-1">
                {channels
                  .filter((c) => c.id !== selectedChannelId)
                  .map((c) => {
                    const selected = selectedMultiChannelIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleMultiChannel(c.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                          selected
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                            : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
                        }`}
                      >
                        <span className={`h-2 w-2 rounded-full ${selected ? "bg-emerald-400" : "bg-zinc-600"}`} />
                        {c.name} ({c.platform})
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Video Overlays & Branding (Watermark, Realtime Clock, Logo, Ticker) */}
          <div className="space-y-3 p-3.5 rounded-xl border border-white/10 bg-black/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-emerald-400" /> Visual Overlays & Branding
              </span>
              <span className="text-[10px] text-zinc-400">FFmpeg Realtime Overlay Engine</span>
            </div>

            {/* Row 1: Realtime Digital Clock */}
            <div className="space-y-3 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-400" /> Digital Clock Overlay
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Burn jam siaran real-time langsung pada siaran video.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEnableDigitalClock(!enableDigitalClock)}
                  className={`text-[10px] px-2.5 py-1 rounded font-bold transition-all ${
                    enableDigitalClock
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-white/5 text-zinc-400 border border-white/10 hover:text-white"
                  }`}
                >
                  {enableDigitalClock ? "ENABLED" : "DISABLED"}
                </button>
              </div>

              {enableDigitalClock ? (
                <div className="space-y-2.5 pt-1 border-t border-white/5">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Position */}
                    <div className="space-y-1">
                      <label className="font-semibold text-xs text-muted-foreground">Posisi Jam</label>
                      <CustomSelect
                        value={clockPosition}
                        onChange={(val: any) => setClockPosition(val)}
                        options={[
                          { value: "top-right", label: "Top Right (Pojok Kanan Atas)" },
                          { value: "top-left", label: "Top Left (Pojok Kiri Atas)" },
                          { value: "bottom-right", label: "Bottom Right (Pojok Kanan Bawah)" },
                          { value: "bottom-left", label: "Bottom Left (Pojok Kiri Bawah)" },
                        ]}
                      />
                    </div>

                    {/* Timezone / Country */}
                    <div className="space-y-1">
                      <label className="font-semibold text-xs text-muted-foreground">Zona Waktu / Negara</label>
                      <CustomSelect
                        value={clockTimezone}
                        onChange={(val: any) => setClockTimezone(val)}
                        options={[
                          { value: "Asia/Jakarta", label: "🇮🇩 WIB (Jakarta / UTC+7)" },
                          { value: "Asia/Makassar", label: "🇮🇩 WITA (Bali / Makassar / UTC+8)" },
                          { value: "Asia/Jayapura", label: "🇮🇩 WIT (Jayapura / Papua / UTC+9)" },
                          { value: "Asia/Singapore", label: "🇸🇬 SGT (Singapura / UTC+8)" },
                          { value: "Asia/Riyadh", label: "🇸🇦 KSA (Makkah / UTC+3)" },
                          { value: "Asia/Tokyo", label: "🇯🇵 JST (Tokyo / UTC+9)" },
                          { value: "Europe/London", label: "🇬🇧 GMT (London / UTC+0)" },
                          { value: "America/New_York", label: "🇺🇸 EST (New York / UTC-5)" },
                          { value: "America/Los_Angeles", label: "🇺🇸 PST (Los Angeles / UTC-8)" },
                          { value: "UTC", label: "🌐 UTC (Universal Time)" },
                          { value: "server", label: "🖥️ Waktu Server Lokal" },
                        ]}
                      />
                    </div>
                  </div>

                  {/* Label Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer pt-0.5 text-xs text-foreground select-none">
                    <input
                      type="checkbox"
                      checked={clockShowLabel}
                      onChange={(e) => setClockShowLabel(e.target.checked)}
                      className="rounded border-white/20 bg-zinc-900 text-emerald-500 focus:ring-0 h-3.5 w-3.5"
                    />
                    <span className="text-[11px] text-zinc-300">
                      Sertakan label zona waktu di samping jam (contoh: <span className="font-mono text-emerald-400">21:00:00 WIB</span>)
                    </span>
                  </label>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 italic">
                  Aktifkan untuk menampilkan jam siaran langsung pada live stream
                </div>
              )}
            </div>

            {/* Row 2: PNG Logo Watermark */}
            <div className="grid gap-3 sm:grid-cols-2 p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="space-y-1">
                <label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5 text-purple-400" /> Logo PNG Watermark Path
                </label>
                <Input
                  placeholder="e.g. uploads/logo.png"
                  value={logoWatermarkPath}
                  onChange={(e) => setLogoWatermarkPath(e.target.value)}
                  className="bg-white/5 border-white/10 h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-xs text-muted-foreground">Logo Position</label>
                <CustomSelect
                  value={logoPosition}
                  onChange={(val: any) => setLogoPosition(val)}
                  options={[
                    { value: "top-left", label: "Top Left (Pojok Kiri Atas)" },
                    { value: "top-right", label: "Top Right (Pojok Kanan Atas)" },
                    { value: "bottom-left", label: "Bottom Left (Pojok Kiri Bawah)" },
                    { value: "bottom-right", label: "Bottom Right (Pojok Kanan Bawah)" },
                  ]}
                />
              </div>
            </div>

            {/* Row 3: Text Watermark & Ticker */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Type className="h-3.5 w-3.5 text-blue-400" /> Watermark Logo Text
                </label>
                <Input
                  placeholder="e.g. LUPIO LIVE 24/7"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="bg-white/5 border-white/10 h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-yellow-400" /> Running Text Ticker Banner
                </label>
                <Input
                  placeholder="e.g. Subscribe for daily 24/7 stream!"
                  value={tickerText}
                  onChange={(e) => setTickerText(e.target.value)}
                  className="bg-white/5 border-white/10 h-9 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Emergency Backup Video (Anti-Drop 24/7) */}
          <div className="space-y-1.5">
            <label className="font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" /> Emergency Backup Video (Anti-Drop 24/7)
            </label>
            <CustomSelect
              value={backupMediaId}
              onChange={setBackupMediaId}
              placeholder="None (Use Synthetic Test Pattern)"
              options={[
                { value: "", label: "None (Use Synthetic Test Pattern)" },
                ...mediaItems.map((m) => ({
                  value: m.id,
                  label: `${m.filename} (${m.duration})`,
                })),
              ]}
            />
          </div>

          {/* Content Source */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Film className="h-3.5 w-3.5" /> Video Content Source
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setContentType("media")}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    contentType === "media" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  Single Video
                </button>
                <button
                  type="button"
                  onClick={() => setContentType("playlist")}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                    contentType === "playlist" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  Playlist
                </button>
              </div>
            </div>

            {contentType === "media" ? (
              <CustomSelect
                value={selectedMediaId}
                onChange={setSelectedMediaId}
                placeholder="Select media file..."
                options={
                  mediaItems.length === 0
                    ? [{ value: "", label: "No media files uploaded" }]
                    : mediaItems.map((m) => ({
                        value: m.id,
                        label: `${m.filename} (${m.duration})`,
                      }))
                }
              />
            ) : (
              <CustomSelect
                value={selectedPlaylistId}
                onChange={setSelectedPlaylistId}
                placeholder="Select playlist..."
                options={
                  playlists.length === 0
                    ? [{ value: "", label: "No playlists created" }]
                    : playlists.map((p) => ({
                        value: p.id,
                        label: `${p.name} (${p.itemCount} items, ${p.totalDuration})`,
                      }))
                }
              />
            )}
          </div>

          {/* Track Transition Effect */}
          <div className="space-y-1.5">
            <label className="font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Track Transition Style (Anti-Drop)</span>
              <span className="text-[10px] text-emerald-400 font-normal">Broadcast Grade</span>
            </label>
            <CustomSelect
              value={transitionEffect}
              onChange={setTransitionEffect}
              options={[
                { value: "full", label: "🌟 Smooth Blend (Video & Audio Fade In/Out)" },
                { value: "fade", label: "🎬 Video Black Fade (1.0s)" },
                { value: "crossfade", label: "🎵 Soft Audio Crossfade (1.5s)" },
                { value: "none", label: "⚡ Direct Cut (Instant Loop)" },
              ]}
            />
          </div>

          {/* Stream Preset */}
          <div className="space-y-1.5">
            <label className="font-semibold uppercase tracking-wider text-muted-foreground">Output Quality Preset</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPreset("720p30")}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  preset === "720p30" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold" : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                <div className="font-semibold text-xs">720p HD</div>
                <div className="text-[10px] text-muted-foreground">30 FPS • 4Mbps</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset("1080p30")}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  preset === "1080p30" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold" : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                <div className="font-semibold text-xs">1080p Full HD</div>
                <div className="text-[10px] text-muted-foreground">30 FPS • 8Mbps</div>
              </button>

              <button
                type="button"
                onClick={() => setPreset("4k60")}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  preset === "4k60" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 font-bold" : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                <div className="font-semibold text-xs">4K Ultra HD</div>
                <div className="text-[10px] text-muted-foreground">60 FPS • 15Mbps</div>
              </button>
            </div>
          </div>

          {/* Feature 4: Live Stream Duration / Auto-Stop Timer */}
          <div className="space-y-1.5">
            <label className="font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-400" /> Live Duration (Auto-Stop Timer)
              </span>
              <span className="text-[10px] text-emerald-400 font-normal">Graceful Shutdown</span>
            </label>
            <CustomSelect
              value={String(maxDurationHours)}
              onChange={(val) => setMaxDurationHours(Number(val))}
              options={[
                { value: "0", label: "♾️ 24/7 Infinite Non-Stop (No Auto-Stop)" },
                { value: "2", label: "⏱️ 2 Hours (Auto-Stop)" },
                { value: "4", label: "⏱️ 4 Hours (Auto-Stop)" },
                { value: "6", label: "⏱️ 6 Hours (Auto-Stop)" },
                { value: "8", label: "⏱️ 8 Hours (Auto-Stop)" },
                { value: "12", label: "⏱️ 12 Hours (Auto-Stop)" },
                { value: "24", label: "⏱️ 24 Hours (Auto-Stop)" },
              ]}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-white/10">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="text-xs">
            Cancel
          </Button>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => handleSave(false)} disabled={loading} className="text-xs">
              Save Draft
            </Button>
            <Button
              onClick={() => handleSave(true)}
              disabled={loading}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-bold gap-1.5 text-xs px-4"
            >
              <Play className="h-3.5 w-3.5 fill-black" />
              {loading ? "Starting..." : "Start Streaming Now"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
