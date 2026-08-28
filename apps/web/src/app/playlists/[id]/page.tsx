"use client";

import { use, useEffect, useState } from "react";
import { Playlist, mockPlaylists } from "@/lib/mock-data";
import { PlaylistBuilder } from "@/components/playlists/playlist-builder";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiService } from "@/lib/services/api";

export default function PlaylistDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const id = params.id;

  const [playlist, setPlaylist] = useState<Playlist | undefined>(undefined);
  const [loading, setLoading] = useState(id !== "new");

  useEffect(() => {
    async function loadPlaylist() {
      if (id === "new") {
        setLoading(false);
        return;
      }
      try {
        const playlists = await apiService.getPlaylists();
        let found = Array.isArray(playlists) ? playlists.find((p) => p.id === id) : undefined;
        if (!found) {
          found = mockPlaylists.find((p) => p.id === id);
        }
        setPlaylist(found);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadPlaylist();
  }, [id]);

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground">Loading playlist builder...</div>;
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1600px] mx-auto h-[calc(100vh-6rem)] overflow-hidden">
      <div className="flex items-center gap-4">
        <Link href="/playlists" className={cn(buttonVariants({ variant: "outline", size: "icon" }), "shrink-0")}>
          <ChevronLeft className="h-4 w-4" />
        </Link>
      </div>

      <PlaylistBuilder initialPlaylist={playlist} />
    </div>
  );
}
