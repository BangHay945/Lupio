import { Stream, MediaItem, Playlist, Channel, SystemMetrics } from "../mock-data";

export const apiService = {
  // Streams
  getStreams: async (): Promise<Stream[]> => {
    try {
      const res = await fetch("/api/streams", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch streams");
      return await res.json();
    } catch {
      return [];
    }
  },

  createStream: async (data: any): Promise<Stream> => {
    const res = await fetch("/api/streams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create stream");
    return await res.json();
  },

  controlStream: async (id: string, action: "start" | "stop" | "restart"): Promise<{ success: boolean; message: string }> => {
    const res = await fetch(`/api/streams/${id}/${action}`, { method: "POST" });
    return await res.json();
  },

  updateStream: async (id: string, data: Partial<Stream>): Promise<Stream> => {
    const res = await fetch(`/api/streams/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update stream");
    return await res.json();
  },

  deleteStream: async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/streams/${id}`, { method: "DELETE" });
    return res.ok;
  },

  getStreamStats: async (id: string): Promise<any> => {
    try {
      const res = await fetch(`/api/streams/${id}/stats`, { cache: "no-store" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  updateMedia: async (id: string, data: Partial<MediaItem>): Promise<MediaItem> => {
    const res = await fetch(`/api/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update media metadata");
    return await res.json();
  },

  // Media
  getMedia: async (): Promise<MediaItem[]> => {
    try {
      const res = await fetch("/api/media", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch media");
      return await res.json();
    } catch {
      return [];
    }
  },

  uploadMedia: async (file: File): Promise<MediaItem> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: formData });
    if (!res.ok) throw new Error("Failed to upload media");
    return await res.json();
  },

  importMediaFromUrl: async (url: string, filename?: string): Promise<MediaItem> => {
    const res = await fetch("/api/media/import-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, filename }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to import media from URL");
    }
    return data;
  },

  deleteMedia: async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/media/${id}`, { method: "DELETE" });
    return res.ok;
  },

  // Playlists
  getPlaylists: async (): Promise<Playlist[]> => {
    try {
      const res = await fetch("/api/playlists", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch playlists");
      return await res.json();
    } catch {
      return [];
    }
  },

  savePlaylist: async (data: any): Promise<Playlist> => {
    const res = await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save playlist");
    return await res.json();
  },

  deletePlaylist: async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/playlists/${id}`, { method: "DELETE" });
    return res.ok;
  },

  // Channels
  getChannels: async (): Promise<Channel[]> => {
    try {
      const res = await fetch("/api/channels", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch channels");
      return await res.json();
    } catch {
      return [];
    }
  },

  saveChannel: async (data: any): Promise<Channel> => {
    const res = await fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save channel");
    return await res.json();
  },

  updateChannel: async (id: string, data: Partial<Channel>): Promise<Channel> => {
    const res = await fetch(`/api/channels/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update channel");
    return await res.json();
  },

  deleteChannel: async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/channels/${id}`, { method: "DELETE" });
    return res.ok;
  },

  // Metrics & Logs
  getSystemMetrics: async (): Promise<SystemMetrics> => {
    try {
      const res = await fetch("/api/system/metrics", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return await res.json();
    } catch {
      return {
        activeStreams: 0,
        offlineStreams: 0,
        cpuUsage: 0,
        ramUsed: 0,
        ramTotal: 16,
        storageUsed: 0,
        storageTotal: 200,
        uploadBandwidth: 0,
      };
    }
  },

  getLogs: async (): Promise<any[]> => {
    try {
      const res = await fetch("/api/logs", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch logs");
      return await res.json();
    } catch {
      return [];
    }
  },

  clearLogs: async (): Promise<boolean> => {
    const res = await fetch("/api/logs", { method: "DELETE" });
    return res.ok;
  },

  // Settings
  getSettings: async (): Promise<any> => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch settings");
      return await res.json();
    } catch {
      return {};
    }
  },

  updateSettings: async (data: any): Promise<any> => {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update settings");
    return await res.json();
  },

  // Schedule Rules
  getScheduleRules: async (): Promise<any[]> => {
    try {
      const res = await fetch("/api/schedule/rules", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch schedule rules");
      return await res.json();
    } catch {
      return [];
    }
  },

  saveScheduleRule: async (data: any): Promise<any> => {
    const res = await fetch("/api/schedule/rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save schedule rule");
    return await res.json();
  },

  deleteScheduleRule: async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/schedule/rules?id=${id}`, { method: "DELETE" });
    return res.ok;
  },

  // Users Management
  getUsers: async (): Promise<any[]> => {
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json();
    } catch {
      return [];
    }
  },

  saveUser: async (data: any): Promise<any> => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save user");
    return await res.json();
  },

  deleteUser: async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    return res.ok;
  },

  // API Keys
  getApiKeys: async (): Promise<any[]> => {
    try {
      const res = await fetch("/api/apikeys", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch API keys");
      return await res.json();
    } catch {
      return [];
    }
  },

  createApiKey: async (name: string): Promise<any> => {
    const res = await fetch("/api/apikeys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to create API key");
    return await res.json();
  },

  deleteApiKey: async (id: string): Promise<boolean> => {
    const res = await fetch(`/api/apikeys?id=${id}`, { method: "DELETE" });
    return res.ok;
  },
};
