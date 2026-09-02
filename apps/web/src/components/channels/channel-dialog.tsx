"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Channel } from "@/lib/mock-data";
import { apiService } from "@/lib/services/api";
import { toast } from "@/components/ui/toast";
import { Tv, Key, Globe, Video, Eye, EyeOff } from "lucide-react";
import { CustomSelect } from "@/components/ui/select";

interface ChannelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel?: Channel | null;
  onSuccess: () => void;
}

export function ChannelDialog({ open, onOpenChange, channel, onSuccess }: ChannelDialogProps) {
  const [platform, setPlatform] = useState("YouTube");
  const [name, setName] = useState("");
  const [rtmpUrl, setRtmpUrl] = useState("rtmp://a.rtmp.youtube.com/live2");
  const [streamKey, setStreamKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (channel) {
      setPlatform(channel.platform || "YouTube");
      setName(channel.name || "");
      setRtmpUrl(channel.rtmpUrl || "rtmp://a.rtmp.youtube.com/live2");
      setStreamKey(channel.streamKey || "");
    } else {
      setPlatform("YouTube");
      setName("");
      setRtmpUrl("rtmp://a.rtmp.youtube.com/live2");
      setStreamKey("");
    }
  }, [channel, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      (toast as any)({ title: "Validation Error", description: "Please enter a channel name.", type: "error" });
      return;
    }
    if (!streamKey.trim()) {
      (toast as any)({ title: "Validation Error", description: "Please enter a stream key.", type: "error" });
      return;
    }

    setLoading(true);
    try {
      if (channel) {
        // Edit Mode
        const updated = await apiService.updateChannel(channel.id, {
          name: name.trim(),
          platform: platform as any,
          rtmpUrl: rtmpUrl.trim(),
          streamKey: streamKey.trim(),
        });
        (toast as any)({ title: "Channel Updated", description: `"${updated.name}" has been updated.`, type: "success" });
      } else {
        // Create Mode
        const created = await apiService.saveChannel({
          name: name.trim(),
          platform: platform as any,
          rtmpUrl: rtmpUrl.trim() || "rtmp://a.rtmp.youtube.com/live2",
          streamKey: streamKey.trim(),
          status: "Active",
        });
        (toast as any)({ title: "Channel Created", description: `"${created.name}" saved to database.`, type: "success" });
      }
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      (toast as any)({ title: "Error", description: e.message || "Failed to save channel", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white/98 dark:bg-zinc-950/98 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xl text-foreground">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Tv className="h-5 w-5 text-emerald-400" /> {channel ? "Edit Channel" : "Add New Channel"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure your streaming platform server URL and secret stream key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3 text-xs">
          {/* Platform Selection */}
          <div className="space-y-1.5">
            <label className="font-semibold uppercase tracking-wider text-muted-foreground">Platform</label>
            <CustomSelect
              value={platform}
              onChange={(val) => {
                setPlatform(val);
                if (val === "YouTube" && !rtmpUrl) {
                  setRtmpUrl("rtmp://a.rtmp.youtube.com/live2");
                }
              }}
              options={[
                { value: "YouTube", label: "YouTube Live" },
                { value: "Twitch", label: "Twitch" },
                { value: "Facebook", label: "Facebook Live" },
                { value: "Custom", label: "Custom RTMP Server" },
              ]}
            />
          </div>

          {/* Channel Name */}
          <div className="space-y-1.5">
            <label className="font-semibold uppercase tracking-wider text-muted-foreground">Channel Name *</label>
            <Input
              placeholder="e.g. My Primary YouTube Channel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/5 border-white/10 h-10 text-xs"
            />
          </div>

          {/* RTMP Server URL */}
          <div className="space-y-1.5">
            <label className="font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> RTMP Server URL
            </label>
            <Input
              placeholder="rtmp://a.rtmp.youtube.com/live2"
              value={rtmpUrl}
              onChange={(e) => setRtmpUrl(e.target.value)}
              className="bg-white/5 border-white/10 h-10 text-xs"
            />
          </div>

          {/* Stream Key */}
          <div className="space-y-1.5">
            <label className="font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-emerald-400" /> YouTube Stream Key *
            </label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                placeholder="Paste key from YouTube Studio (e.g. abcd-1234-efgh-5678)"
                value={streamKey}
                onChange={(e) => setStreamKey(e.target.value)}
                className="bg-white/5 border-white/10 h-10 text-xs pr-10"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-white/10">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-white/10"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold"
          >
            {channel ? "Save Changes" : "Add Channel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
