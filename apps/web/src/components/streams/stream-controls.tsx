"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { Stream } from "@/lib/mock-data";
import { apiService } from "@/lib/services/api";
import { Play, Square, RotateCcw, Copy, Trash } from "lucide-react";

interface StreamControlsProps {
  stream: Stream;
  onUpdate?: () => void;
}

export function StreamControls({ stream, onUpdate }: StreamControlsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "start" | "stop" | "restart") => {
    setLoading(true);
    try {
      await apiService.controlStream(stream.id, action);
      (toast as any)({
        title: `Stream ${action.toUpperCase()}ED`,
        description: `Stream "${stream.name}" ${action} command sent.`,
        type: action === "stop" ? "info" : "success",
      });
      if (onUpdate) onUpdate();
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete stream "${stream.name}"?`)) return;
    setLoading(true);
    try {
      await apiService.deleteStream(stream.id);
      (toast as any)({ title: "Stream Deleted", description: `"${stream.name}" removed.`, type: "error" });
      router.push("/streams");
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {stream.status === "OFFLINE" || stream.status === "ERROR" ? (
        <Button disabled={loading} onClick={() => handleAction("start")} className="bg-green-600 hover:bg-green-700 text-white">
          <Play className="mr-2 h-4 w-4" /> Start Stream
        </Button>
      ) : (
        <>
          <Button disabled={loading} onClick={() => handleAction("restart")} variant="secondary">
            <RotateCcw className="mr-2 h-4 w-4" /> Restart
          </Button>
          <Button disabled={loading} onClick={() => handleAction("stop")} variant="destructive">
            <Square className="mr-2 h-4 w-4" /> Stop Stream
          </Button>
        </>
      )}
      
      <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

      <Button disabled={loading} variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete}>
        <Trash className="mr-2 h-4 w-4" /> Delete
      </Button>
    </div>
  );
}
