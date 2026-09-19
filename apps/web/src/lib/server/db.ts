import fs from "fs";
import path from "path";
import crypto from "crypto";
import { 
  mockStreams, mockMedia, mockPlaylists, mockChannels, 
  Stream, MediaItem, Playlist, Channel, ScheduleRule, UserAccount, ApiKey 
} from "../mock-data";

export interface LogItem {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  source: string;
  message: string;
}

export interface SettingsData {
  serverName: string;
  language: string;
  ffmpegPath: string;
  hardwareAccel: string;
  threadCount: number;
  defaultResolution: string;
  globalBitrate: string;
  reconnectDelay: number;
  telegramBotToken?: string;
  telegramChatId?: string;
  discordWebhookUrl?: string;
  enableWebhooks?: boolean;
  backupMediaId?: string;
  globalWatermarkText?: string;
  // Feature 2: Auto Healing Watchdog Settings
  enableAutoHealing?: boolean;
  maxWatchdogRetries?: number;
  // Feature 4: Audio Normalizer (EBU R128) Settings
  enableAudioNormalizer?: boolean;
  loudnessLevel?: string;

  // General Settings - Server & Time
  timezone?: string;
  timeFormat?: string;
  publicServerUrl?: string;

  // General Settings - Interface & Localization
  defaultTheme?: string;
  defaultLandingPage?: string;

  // General Settings - Storage & System Policies
  mediaStoragePath?: string;
  maxUploadSizeMb?: number;
  logRetentionDays?: number;
  clearTempSegmentsOnStop?: boolean;
}

interface DBData {
  streams: Stream[];
  media: MediaItem[];
  playlists: Playlist[];
  channels: Channel[];
  logs: LogItem[];
  settings: SettingsData;
  scheduleRules: ScheduleRule[];
  users: UserAccount[];
  apiKeys: ApiKey[];
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");
const DB_TMP_PATH = path.join(DATA_DIR, "db.json.tmp");

let inMemoryCache: DBData | null = null;

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

const initialData: DBData = {
  streams: mockStreams,
  media: mockMedia,
  playlists: mockPlaylists,
  channels: mockChannels,
  logs: [
    {
      id: "log_init",
      timestamp: new Date().toISOString(),
      level: "info",
      source: "system",
      message: "Lupio backend engine database initialized with 24/7 features.",
    },
  ],
  settings: {
    serverName: "Lupio Production Node 1",
    language: "English",
    ffmpegPath: "ffmpeg",
    hardwareAccel: "None (CPU Only)",
    threadCount: 4,
    defaultResolution: "1080p",
    globalBitrate: "8000",
    reconnectDelay: 10,
    telegramBotToken: "",
    telegramChatId: "",
    discordWebhookUrl: "",
    enableWebhooks: true,
    backupMediaId: "",
    globalWatermarkText: "",
    enableAutoHealing: true,
    maxWatchdogRetries: 3,
    enableAudioNormalizer: true,
    loudnessLevel: "-16 LUFS (EBU R128)",
    timezone: "Asia/Jakarta",
    timeFormat: "24h",
    publicServerUrl: "http://localhost:3000",
    defaultTheme: "dark",
    defaultLandingPage: "dashboard",
    mediaStoragePath: "storage/media",
    maxUploadSizeMb: 5000,
    logRetentionDays: 14,
    clearTempSegmentsOnStop: true,
  },
  scheduleRules: [
    {
      id: "rule_1",
      streamName: "Rain Sleep 24/7",
      startTime: "06:00",
      endTime: "18:00",
      playlistId: "pl_1",
      playlistName: "Rain & Chill Beats",
      active: true,
    },
    {
      id: "rule_2",
      streamName: "Rain Sleep 24/7",
      startTime: "18:00",
      endTime: "06:00",
      playlistId: "pl_2",
      playlistName: "Night Lofi Stream",
      active: true,
    },
  ],
  users: [
    {
      id: "usr_admin",
      name: "Admin Operator",
      email: "admin@lupio.local",
      role: "Admin",
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0],
    },
    {
      id: "usr_operator",
      name: "Studio Operator 1",
      email: "operator1@lupio.local",
      role: "Operator",
      status: "Active",
      createdAt: new Date().toISOString().split("T")[0],
    },
  ],
  apiKeys: [
    {
      id: "key_primary",
      name: "OBS Remote Automation Key",
      key: "lup_live_sec_984f1a23c89b",
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: "Just now",
    },
  ],
};

export function readDB(): DBData {
  ensureDirectoryExists();
  if (!fs.existsSync(DB_PATH)) {
    inMemoryCache = initialData;
    writeDB(initialData);
    return initialData;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    const result: DBData = {
      ...initialData,
      ...parsed,
      settings: { ...initialData.settings, ...(parsed.settings || {}) },
      scheduleRules: parsed.scheduleRules || initialData.scheduleRules,
      users: parsed.users || initialData.users,
      apiKeys: parsed.apiKeys || initialData.apiKeys,
    };
    inMemoryCache = result;
    return result;
  } catch (err) {
    console.error("Error reading DB JSON:", err);
    // CRITICAL: Prevent total data loss. Do NOT wipe DB to initialData on read glitch!
    try {
      const backupPath = path.join(DATA_DIR, `db.json.corrupted.${Date.now()}`);
      if (fs.existsSync(DB_PATH)) {
        fs.copyFileSync(DB_PATH, backupPath);
        console.warn(`Saved corrupted DB copy to ${backupPath}`);
      }
    } catch (bErr) {
      console.error("Failed to backup corrupted DB:", bErr);
    }

    // Return in-memory cache if available to protect active state
    if (inMemoryCache) {
      console.warn("Using last valid in-memory cache instead of resetting to initialData.");
      return inMemoryCache;
    }
    return initialData;
  }
}

export function writeDB(data: DBData): void {
  ensureDirectoryExists();
  inMemoryCache = data;
  try {
    // Atomic file write: write to temporary file first, then atomic rename
    const content = JSON.stringify(data, null, 2);
    fs.writeFileSync(DB_TMP_PATH, content, "utf-8");
    fs.renameSync(DB_TMP_PATH, DB_PATH);
  } catch (err) {
    console.error("Atomic write failed, using direct write fallback:", err);
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    } catch (fallbackErr) {
      console.error("Fatal error writing to DB:", fallbackErr);
    }
  }
}

export const db = {
  getStreams: (): Stream[] => readDB().streams,
  getStreamById: (id: string): Stream | undefined => readDB().streams.find((s) => s.id === id),
  saveStreams: (streams: Stream[]) => {
    const data = readDB();
    data.streams = streams;
    writeDB(data);
  },
  saveStream: (stream: Partial<Stream>): Stream => {
    const data = readDB();
    const list = data.streams;
    let saved: Stream;
    if (stream.id) {
      const idx = list.findIndex((s) => s.id === stream.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...stream };
        saved = list[idx];
      } else {
        saved = stream as Stream;
        list.push(saved);
      }
    } else {
      saved = {
        id: `str_${Date.now()}`,
        name: stream.name || "New Stream",
        channelName: stream.channelName || "YouTube",
        playlistName: stream.playlistName || "Single File",
        status: stream.status || "OFFLINE",
        resolution: stream.resolution || "1080p",
        fps: stream.fps || 30,
        bitrate: stream.bitrate || "8000 Kbps",
        uptime: "0m",
        restartCount: 0,
        ...stream,
      } as Stream;
      list.push(saved);
    }
    data.streams = list;
    writeDB(data);
    return saved;
  },
  deleteStream: (id: string): boolean => {
    const data = readDB();
    data.streams = data.streams.filter((s) => s.id !== id);
    writeDB(data);
    return true;
  },

  getMedia: (): MediaItem[] => readDB().media,
  saveMedia: (mediaList: MediaItem[]) => {
    const data = readDB();
    data.media = mediaList;
    writeDB(data);
  },
  deleteMedia: (id: string): boolean => {
    const data = readDB();
    data.media = data.media.filter((m) => m.id !== id);
    writeDB(data);
    return true;
  },

  getPlaylists: (): Playlist[] => readDB().playlists,
  savePlaylists: (playlists: Playlist[]) => {
    const data = readDB();
    data.playlists = playlists;
    writeDB(data);
  },
  savePlaylist: (playlist: Partial<Playlist>): Playlist => {
    const data = readDB();
    const list = data.playlists;
    let saved: Playlist;
    if (playlist.id) {
      const idx = list.findIndex((p) => p.id === playlist.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...playlist };
        saved = list[idx];
      } else {
        saved = playlist as Playlist;
        list.push(saved);
      }
    } else {
      saved = {
        id: `pl_${Date.now()}`,
        name: playlist.name || "New Playlist",
        itemCount: playlist.itemCount || 0,
        totalDuration: playlist.totalDuration || "00:00:00",
        createdAt: new Date().toISOString().split("T")[0],
        ...playlist,
      } as Playlist;
      list.push(saved);
    }
    data.playlists = list;
    writeDB(data);
    return saved;
  },
  deletePlaylist: (id: string): boolean => {
    const data = readDB();
    data.playlists = data.playlists.filter((p) => p.id !== id);
    writeDB(data);
    return true;
  },

  getChannels: (): Channel[] => readDB().channels,
  saveChannels: (channels: Channel[]) => {
    const data = readDB();
    data.channels = channels;
    writeDB(data);
  },
  saveChannel: (channel: Partial<Channel>): Channel => {
    const data = readDB();
    const list = data.channels;
    let saved: Channel;
    if (channel.id) {
      const idx = list.findIndex((c) => c.id === channel.id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...channel };
        saved = list[idx];
      } else {
        saved = channel as Channel;
        list.push(saved);
      }
    } else {
      saved = {
        id: `ch_${Date.now()}`,
        name: channel.name || "New Channel",
        platform: channel.platform || "YouTube",
        rtmpUrl: channel.rtmpUrl || "rtmp://a.rtmp.youtube.com/live2",
        streamKey: channel.streamKey || "",
        status: "Active",
        ...channel,
      } as Channel;
      list.push(saved);
    }
    data.channels = list;
    writeDB(data);
    return saved;
  },
  deleteChannel: (id: string): boolean => {
    const data = readDB();
    data.channels = data.channels.filter((c) => c.id !== id);
    writeDB(data);
    return true;
  },

  getLogs: (): LogItem[] => readDB().logs,
  addLog: (level: "info" | "warn" | "error", source: string, message: string) => {
    const data = readDB();
    const newLog: LogItem = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      source,
      message,
    };
    data.logs.unshift(newLog);
    if (data.logs.length > 200) data.logs = data.logs.slice(0, 200);
    writeDB(data);
  },
  clearLogs: () => {
    const data = readDB();
    data.logs = [];
    writeDB(data);
  },

  getSettings: (): SettingsData => readDB().settings,
  updateSettings: (newSettings: Partial<SettingsData>) => {
    const data = readDB();
    data.settings = { ...data.settings, ...newSettings };
    writeDB(data);
    return data.settings;
  },

  // Feature 1: Time-Based Schedule Rules
  getScheduleRules: (): ScheduleRule[] => readDB().scheduleRules || [],
  saveScheduleRule: (rule: Partial<ScheduleRule>): ScheduleRule => {
    const data = readDB();
    const rules = data.scheduleRules || [];
    let saved: ScheduleRule;
    if (rule.id) {
      rules.forEach((r, idx) => {
        if (r.id === rule.id) {
          rules[idx] = { ...r, ...rule } as ScheduleRule;
          saved = rules[idx];
        }
      });
    } else {
      saved = {
        id: `rule_${Date.now()}`,
        streamName: rule.streamName || "All Streams",
        startTime: rule.startTime || "00:00",
        endTime: rule.endTime || "23:59",
        playlistId: rule.playlistId || "",
        playlistName: rule.playlistName || "Default Playlist",
        active: rule.active !== undefined ? rule.active : true,
      };
      rules.push(saved);
    }
    data.scheduleRules = rules;
    writeDB(data);
    return saved!;
  },
  deleteScheduleRule: (id: string): boolean => {
    const data = readDB();
    data.scheduleRules = (data.scheduleRules || []).filter((r) => r.id !== id);
    writeDB(data);
    return true;
  },

  // Feature 6: Users & API Keys
  getUsers: (): UserAccount[] => readDB().users || [],
  saveUser: (user: Partial<UserAccount>): UserAccount => {
    const data = readDB();
    const users = data.users || [];
    let saved: UserAccount;
    if (user.id) {
      users.forEach((u, idx) => {
        if (u.id === user.id) {
          users[idx] = { ...u, ...user } as UserAccount;
          saved = users[idx];
        }
      });
    } else {
      saved = {
        id: `usr_${Date.now()}`,
        name: user.name || "New Operator",
        email: user.email || "operator@lupio.local",
        role: user.role || "Operator",
        status: user.status || "Active",
        createdAt: new Date().toISOString().split("T")[0],
      };
      users.push(saved);
    }
    data.users = users;
    writeDB(data);
    return saved!;
  },
  deleteUser: (id: string): boolean => {
    const data = readDB();
    data.users = (data.users || []).filter((u) => u.id !== id);
    writeDB(data);
    return true;
  },

  getApiKeys: (): ApiKey[] => readDB().apiKeys || [],
  createApiKey: (name: string): ApiKey => {
    const data = readDB();
    const keys = data.apiKeys || [];
    const randHex = crypto.randomBytes(16).toString("hex");
    const newKey: ApiKey = {
      id: `key_${Date.now()}`,
      name: name || "Default API Key",
      key: `lup_live_sec_${randHex}`,
      createdAt: new Date().toISOString().split("T")[0],
      lastUsed: "Never",
    };
    keys.push(newKey);
    data.apiKeys = keys;
    writeDB(data);
    return newKey;
  },
  deleteApiKey: (id: string): boolean => {
    const data = readDB();
    data.apiKeys = (data.apiKeys || []).filter((k) => k.id !== id);
    writeDB(data);
    return true;
  },
};
