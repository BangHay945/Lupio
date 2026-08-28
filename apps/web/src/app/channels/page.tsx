"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Video, Gamepad2, MessageCircle, Globe, MoreHorizontal, Pencil, Trash, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Channel, mockChannels } from "@/lib/mock-data";
import { apiService } from "@/lib/services/api";
import { ChannelDialog } from "@/components/channels/channel-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  // Delete confirm dialog
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; channel: Channel | null }>({
    open: false,
    channel: null,
  });

  const loadChannels = async () => {
    try {
      const real = await apiService.getChannels();
      if (Array.isArray(real)) setChannels(real);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChannels();
  }, []);

  const maskStreamKey = (key: string) => {
    if (!key || key.length <= 8) return "********";
    return `${key.substring(0, 4)}-****-****-${key.substring(key.length - 4)}`;
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "YouTube":
        return <Video className="h-4 w-4 text-red-500" />;
      case "Twitch":
        return <Gamepad2 className="h-4 w-4 text-purple-500" />;
      case "Facebook":
        return <MessageCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <Globe className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    (toast as any)({ title: "Copied!", description: `${type} copied to clipboard.`, type: "success" });
  };

  const handleOpenAdd = () => {
    setEditingChannel(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.channel) return;
    const ch = deleteConfirm.channel;
    try {
      await apiService.deleteChannel(ch.id);
      setChannels((prev) => prev.filter((c) => c.id !== ch.id));
      (toast as any)({ title: "Channel Deleted", description: `"${ch.name}" removed.`, type: "info" });
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    } finally {
      setDeleteConfirm({ open: false, channel: null });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-end">
        <Button
          onClick={handleOpenAdd}
          className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold gap-1.5 rounded-lg px-4 shadow-lg shadow-emerald-500/10"
        >
          <Plus className="h-4 w-4" /> Add Channel
        </Button>
      </div>

      <div className="rounded-xl border border-white/[0.07] bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Platform</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>RTMP URL</TableHead>
              <TableHead>Stream Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground animate-pulse text-xs">
                  Loading channels...
                </TableCell>
              </TableRow>
            ) : channels.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No channels configured. Click "+ Add Channel" to get started.
                </TableCell>
              </TableRow>
            ) : (
              channels.map((channel) => (
                <TableRow key={channel.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPlatformIcon(channel.platform)}
                      <span className="font-medium">{channel.platform}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{channel.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[200px] text-muted-foreground">{channel.rtmpUrl}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(channel.rtmpUrl, "RTMP URL")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-muted-foreground">{maskStreamKey(channel.streamKey)}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyToClipboard(channel.streamKey, "Stream Key")}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                      channel.status === "Active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                      channel.status === "Error" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      "bg-white/5 text-muted-foreground border-white/10"
                    )}>
                      {channel.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => handleOpenEdit(channel)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400 cursor-pointer focus:text-red-400"
                          onClick={() => setDeleteConfirm({ open: true, channel })}
                        >
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add / Edit Channel Modal Popup */}
      <ChannelDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        channel={editingChannel}
        onSuccess={loadChannels}
      />

      {/* Delete Confirmation */}
      {deleteConfirm.channel && (
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
          title="Delete Channel"
          description={`Are you sure you want to delete "${deleteConfirm.channel.name}"?`}
          confirmLabel="Delete Channel"
          variant="destructive"
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
