"use client";

import { useEffect, useState } from "react";
import { Playlist } from "@/lib/mock-data";
import { Button, buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, ListVideo, Clock, MoreHorizontal, Pencil, Play, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { apiService } from "@/lib/services/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useLanguage } from "@/lib/i18n/language-context";

export default function PlaylistsPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Delete confirm dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; playlist: Playlist | null }>({
    open: false,
    playlist: null,
  });

  const loadPlaylists = async () => {
    try {
      const real = await apiService.getPlaylists();
      if (Array.isArray(real)) setPlaylists(real);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlaylists();
  }, []);

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.playlist) return;
    const pl = deleteConfirm.playlist;
    try {
      await apiService.deletePlaylist(pl.id);
      setPlaylists((prev) => prev.filter((p) => p.id !== pl.id));
      (toast as any)({ title: "Playlist Deleted", description: `"${pl.name}" removed.`, type: "info" });
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    } finally {
      setDeleteConfirm({ open: false, playlist: null });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-end">
        <Link
          href={`/playlists/new`}
          className={cn(
            buttonVariants({ variant: "default" }),
            "bg-emerald-500 hover:bg-emerald-600 text-black font-bold gap-2 rounded-full h-10 px-5 shadow-sm text-xs transition-all hover:scale-[1.02]"
          )}
        >
          <Plus className="h-4 w-4 stroke-[2.5]" /> {t("action.createPlaylist")}
        </Link>
      </div>

      {!loading && playlists.length === 0 ? (
        <div className="empty-state-wrapper text-center py-16 px-6 rounded-3xl w-full">
          <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 flex items-center justify-center mx-auto mb-4 text-emerald-500 shadow-xs">
            <ListVideo className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h3 className="text-base font-bold text-foreground">{t("playlist.empty")}</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-6 max-w-sm mx-auto leading-relaxed">
            {t("playlist.emptyDesc")}
          </p>
          <Link
            href="/playlists/new"
            className="inline-flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-black font-bold h-10 px-6 rounded-full shadow-sm gap-2 text-xs transition-all hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" /> {t("action.createPlaylist")}
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.title")}</TableHead>
                <TableHead>{t("table.items")}</TableHead>
                <TableHead>{t("table.duration")}</TableHead>
                <TableHead>{t("table.created")}</TableHead>
                <TableHead className="text-right">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground animate-pulse text-xs">
                    {t("dash.loading")}
                  </TableCell>
                </TableRow>
              ) : (
                playlists.map((playlist) => (
                  <TableRow key={playlist.id}>
                    <TableCell className="font-semibold">
                      <Link href={`/playlists/${playlist.id}`} className="hover:underline text-foreground flex items-center">
                        <ListVideo className="mr-2 h-4 w-4 text-emerald-400" />
                        {playlist.name}
                      </Link>
                    </TableCell>
                    <TableCell>{playlist.itemCount} {t("table.items")}</TableCell>
                    <TableCell className="flex items-center">
                      <Clock className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                      {playlist.totalDuration}
                    </TableCell>
                    <TableCell>{playlist.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-black/5 dark:hover:bg-white/10 h-8.5 w-8.5 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 border-slate-200 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 p-2 rounded-2xl shadow-xl space-y-1">
                          <DropdownMenuItem
                            className="menu-pill-item cursor-pointer"
                            onClick={() => router.push(`/playlists/${playlist.id}`)}
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5 text-zinc-400" /> {t("action.edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="menu-pill-item cursor-pointer"
                            onClick={() => router.push(`/streams`)}
                          >
                            <Play className="mr-2 h-3.5 w-3.5 text-emerald-400" /> {t("action.start")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="menu-pill-item cursor-pointer text-red-500 dark:text-red-400 hover:bg-red-500/10 hover:text-red-500"
                            onClick={() => setDeleteConfirm({ open: true, playlist })}
                          >
                            <Trash className="h-3.5 w-3.5 mr-2 text-red-500 dark:text-red-400" /> {t("action.delete")}
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
      )}

      {/* Delete Confirmation Popup Modal */}
      {deleteConfirm.playlist && (
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
          title="Delete Playlist"
          description={`Are you sure you want to delete playlist "${deleteConfirm.playlist.name}"?`}
          confirmLabel="Delete Playlist"
          variant="destructive"
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
