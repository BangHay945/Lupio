"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Playlist, mockMedia, MediaItem } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, GripVertical, Trash2, Save, FileVideo, Clock, ListVideo } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { apiService } from "@/lib/services/api";

interface PlaylistBuilderProps {
  initialPlaylist?: Playlist;
}

interface SortablePlaylistItemProps {
  item: MediaItem;
  index: number;
  totalItems: number;
  onMoveItem: (index: number, direction: "up" | "down") => void;
  onRemoveItem: (index: number) => void;
}

function SortablePlaylistItem({
  item,
  index,
  totalItems,
  onMoveItem,
  onRemoveItem,
}: SortablePlaylistItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-md border bg-card shadow-sm group transition-shadow ${
        isDragging ? "ring-2 ring-primary shadow-lg" : ""
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none p-1 rounded hover:bg-muted/60"
        title="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="h-10 w-16 bg-muted rounded flex items-center justify-center shrink-0 border">
        <FileVideo className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={item.filename}>
          {item.filename}
        </p>
        <p className="text-xs text-muted-foreground">Duration: {item.duration}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex flex-col">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onMoveItem(index, "up")}
            disabled={index === 0}
          >
            ▲
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onMoveItem(index, "down")}
            disabled={index === totalItems - 1}
          >
            ▼
          </Button>
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemoveItem(index)}
        className="shrink-0 text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function PlaylistBuilder({ initialPlaylist }: PlaylistBuilderProps) {
  const router = useRouter();
  const [name, setName] = useState(initialPlaylist?.name || "New Playlist");
  const [playlistItems, setPlaylistItems] = useState<MediaItem[]>(initialPlaylist?.mediaItems || []);
  const [availableMedia, setAvailableMedia] = useState<MediaItem[]>(mockMedia);
  const [search, setSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function loadMedia() {
      try {
        const real = await apiService.getMedia();
        if (Array.isArray(real) && real.length > 0) setAvailableMedia(real);
      } catch (e) {
        console.error(e);
      }
    }
    loadMedia();
  }, []);

  const filteredMedia = availableMedia.filter(
    (item) =>
      item.filename.toLowerCase().includes(search.toLowerCase()) &&
      !playlistItems.find((pi) => pi.id === item.id)
  );

  const addItem = (item: MediaItem) => {
    setPlaylistItems((prev) => [...prev, item]);
  };

  const removeItem = (index: number) => {
    setPlaylistItems((prev) => {
      const newItems = [...prev];
      newItems.splice(index, 1);
      return newItems;
    });
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      setPlaylistItems((prev) => arrayMove(prev, index, index - 1));
    } else if (direction === "down" && index < playlistItems.length - 1) {
      setPlaylistItems((prev) => arrayMove(prev, index, index + 1));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPlaylistItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          return arrayMove(items, oldIndex, newIndex);
        }
        return items;
      });
    }
  };

  const handleSave = async () => {
    try {
      await apiService.savePlaylist({
        id: initialPlaylist?.id,
        name,
        mediaItems: playlistItems,
        itemCount: playlistItems.length,
        totalDuration: `${playlistItems.length * 15}m`,
        createdAt: new Date().toISOString().split("T")[0],
      });

      (toast as any)({
        title: "Playlist Saved",
        description: `"${name}" saved to database.`,
        type: "success",
      });
      router.push("/playlists");
    } catch (err: any) {
      (toast as any)({ title: "Error", description: err.message, type: "error" });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Media Library Panel */}
      <Card className="lg:col-span-1 h-[calc(100vh-12rem)] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle>Media Library</CardTitle>
          <CardDescription>Click + to add items to your playlist</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0 px-4 pb-4">
          <div className="space-y-2">
            {filteredMedia.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No available media found.</p>
            ) : (
              filteredMedia.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center shrink-0">
                      <FileVideo className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" title={item.filename}>
                        {item.filename}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" /> {item.duration}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => addItem(item)}
                    className="shrink-0 text-primary"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Playlist Builder Panel */}
      <Card className="lg:col-span-2 h-[calc(100vh-12rem)] flex flex-col border-primary/20 bg-primary/5">
        <CardHeader className="pb-3 flex flex-row items-start justify-between">
          <div className="space-y-1.5 flex-1 mr-4">
            <CardTitle>Playlist Editor</CardTitle>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg font-semibold bg-transparent border-t-0 border-x-0 border-b-2 rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
            />
            <CardDescription className="flex items-center gap-2 mt-2">
              <span>{playlistItems.length} items</span>
              <span>•</span>
              <span>Total Duration: ~{playlistItems.length * 45} mins</span>
            </CardDescription>
          </div>
          <Button onClick={handleSave} className="shrink-0 bg-primary text-primary-foreground">
            <Save className="mr-2 h-4 w-4" /> Save Playlist
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto">
          {playlistItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg bg-background">
              <ListVideo className="h-12 w-12 mb-4 text-muted-foreground/50" />
              <p>Your playlist is empty.</p>
              <p className="text-sm">Add media from the library on the left.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={playlistItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {playlistItems.map((item, index) => (
                    <SortablePlaylistItem
                      key={item.id}
                      item={item}
                      index={index}
                      totalItems={playlistItems.length}
                      onMoveItem={moveItem}
                      onRemoveItem={removeItem}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

