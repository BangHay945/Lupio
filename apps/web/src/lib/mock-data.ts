export type StreamStatus = "LIVE" | "OFFLINE" | "STARTING" | "RESTARTING" | "SCHEDULED" | "ERROR";

export interface Stream {
  id: string;
  name: string;
  channelName: string;
  playlistName: string;
  channelId?: string;
  playlistId?: string;
  status: StreamStatus;
  resolution: string;
  fps: number;
  bitrate: string;
  uptime: string;
  restartCount: number;
  currentVideo?: string;
  multiChannelIds?: string[];
  watermarkText?: string;
  tickerText?: string;
  enableOverlay?: boolean;
  backupMediaId?: string;
  transitionEffect?: string;
  maxDurationHours?: number; // 0 or undefined for 24/7 non-stop
  manualStop?: boolean; // true = user explicitly stopped, block all auto-restarts
  logoWatermarkPath?: string; // Path to PNG logo file
  logoPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  enableDigitalClock?: boolean; // Show realtime digital clock overlay
  clockPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  clockTimezone?: string; // e.g. "Asia/Jakarta", "Asia/Makassar", "UTC", etc.
  clockShowLabel?: boolean; // true = append timezone label (e.g. "WIB")
}

export interface SystemMetrics {
  activeStreams: number;
  offlineStreams: number;
  cpuUsage: number; // percentage
  ramUsed: number; // in GB
  ramTotal: number; // in GB
  storageUsed: number; // in GB
  storageTotal: number; // in GB
  uploadBandwidth: number; // in Mbps
}

export interface MediaItem {
  id: string;
  filename: string;
  title?: string;
  description?: string;
  duration: string; // HH:MM:SS
  size: string; // e.g. "450 MB"
  uploadDate: string;
  type: "video" | "audio";
  thumbnail?: string;
  filepath?: string;
  resolution?: string;
}

export interface Playlist {
  id: string;
  name: string;
  itemCount: number;
  totalDuration: string;
  createdAt?: string;
  mediaItems?: MediaItem[];
  transitionEffect?: string;
  isShuffled?: boolean;
}

export interface Channel {
  id: string;
  name: string;
  platform: "YouTube" | "Twitch" | "Facebook" | "Custom";
  rtmpUrl: string;
  streamKey: string;
  status?: "Active" | "Inactive" | "Error";
  isDefault?: boolean;
}

export interface ScheduleRule {
  id: string;
  streamId?: string;
  streamName?: string;
  startTime: string; // e.g. "08:00"
  endTime: string;   // e.g. "18:00"
  playlistId: string;
  playlistName: string;
  active: boolean;
  action?: "switch" | "start" | "stop";
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Operator";
  status: "Active" | "Inactive";
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed?: string;
}

export interface ScheduleEvent {
  id: string;
  title: string;
  startTime: string; // ISO String
  endTime: string; // ISO String
  playlistId: string;
  channelId: string;
  status: "Scheduled" | "Live" | "Completed";
}

export const mockSystemMetrics: SystemMetrics = {
  activeStreams: 3,
  offlineStreams: 2,
  cpuUsage: 42,
  ramUsed: 5.8,
  ramTotal: 16,
  storageUsed: 82,
  storageTotal: 200,
  uploadBandwidth: 28,
};

export const mockStreams: Stream[] = [
  {
    id: "str_1",
    name: "Rain Sleep 24/7",
    channelName: "Sleep Channel",
    playlistName: "Rain Sleep",
    status: "LIVE",
    resolution: "1080p",
    fps: 30,
    bitrate: "8 Mbps",
    uptime: "17h 42m",
    restartCount: 1,
    currentVideo: "Rain Window.mp4",
  },
  {
    id: "str_2",
    name: "Quran Night",
    channelName: "Channel B",
    playlistName: "Murottal Night",
    status: "LIVE",
    resolution: "720p",
    fps: 30,
    bitrate: "4 Mbps",
    uptime: "2h 15m",
    restartCount: 0,
    currentVideo: "Surah Al-Baqarah.mp4",
  },
  {
    id: "str_3",
    name: "Lofi Beats Study",
    channelName: "Lofi Girl Clone",
    playlistName: "Lofi Playlist 1",
    status: "ERROR",
    resolution: "1080p",
    fps: 30,
    bitrate: "8 Mbps",
    uptime: "0m",
    restartCount: 5,
    currentVideo: "lofi-track-01.mp4",
  },
  {
    id: "str_4",
    name: "Gaming Highlights",
    channelName: "Gaming Channel",
    playlistName: "Highlights 2024",
    status: "OFFLINE",
    resolution: "1080p",
    fps: 60,
    bitrate: "12 Mbps",
    uptime: "0m",
    restartCount: 0,
  }
];

export const mockMedia: MediaItem[] = [
  { id: "m_1", filename: "Rain_Window_Loop.mp4", duration: "01:00:00", size: "850 MB", uploadDate: "2023-10-01", type: "video" },
  { id: "m_2", filename: "Surah_Al_Baqarah.mp4", duration: "02:15:30", size: "1.2 GB", uploadDate: "2023-10-02", type: "video" },
  { id: "m_3", filename: "Lofi_Track_01.mp4", duration: "00:03:45", size: "45 MB", uploadDate: "2023-10-03", type: "video" },
  { id: "m_4", filename: "Lofi_Track_02.mp4", duration: "00:04:12", size: "52 MB", uploadDate: "2023-10-03", type: "video" },
  { id: "m_5", filename: "Nature_Sounds.mp4", duration: "00:30:00", size: "400 MB", uploadDate: "2023-10-05", type: "video" },
  { id: "m_6", filename: "Highlights_Gaming.mp4", duration: "00:15:00", size: "200 MB", uploadDate: "2023-10-08", type: "video" },
];

export const mockPlaylists: Playlist[] = [
  {
    id: "p_1",
    name: "Rain Sleep",
    itemCount: 1,
    totalDuration: "01:00:00",
    createdAt: "2023-10-01",
    mediaItems: [mockMedia[0]],
  },
  {
    id: "p_2",
    name: "Lofi Playlist 1",
    itemCount: 2,
    totalDuration: "00:07:57",
    createdAt: "2023-10-04",
    mediaItems: [mockMedia[2], mockMedia[3]],
  },
  {
    id: "p_3",
    name: "Murottal Night",
    itemCount: 1,
    totalDuration: "02:15:30",
    createdAt: "2023-10-02",
    mediaItems: [mockMedia[1]],
  },
];

export const mockChannels: Channel[] = [
  {
    id: "ch_1",
    name: "Sleep Channel",
    platform: "YouTube",
    rtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
    streamKey: "live2-xxxx-yyyy-zzzz",
    status: "Active",
  },
  {
    id: "ch_2",
    name: "Murottal Network",
    platform: "YouTube",
    rtmpUrl: "rtmp://a.rtmp.youtube.com/live2",
    streamKey: "live2-1234-5678-90ab",
    status: "Active",
  },
  {
    id: "ch_3",
    name: "Lofi Girl Clone",
    platform: "Twitch",
    rtmpUrl: "rtmp://live-sin.twitch.tv/app",
    streamKey: "live_xxxxxxxxxxxxxx",
    status: "Error",
  },
];

// Today's date for relative scheduling
const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

export const mockScheduleEvents: ScheduleEvent[] = [
  {
    id: "evt_1",
    title: "Morning Lofi Session",
    startTime: new Date(today.setHours(8, 0, 0, 0)).toISOString(),
    endTime: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
    playlistId: "p_2",
    channelId: "ch_3",
    status: "Completed",
  },
  {
    id: "evt_2",
    title: "Rain Sleep Marathon",
    startTime: new Date(today.setHours(20, 0, 0, 0)).toISOString(),
    endTime: new Date(tomorrow.setHours(6, 0, 0, 0)).toISOString(),
    playlistId: "p_1",
    channelId: "ch_1",
    status: "Scheduled",
  },
  {
    id: "evt_3",
    title: "Daily Murottal",
    startTime: new Date(today.setHours(18, 0, 0, 0)).toISOString(),
    endTime: new Date(today.setHours(20, 15, 0, 0)).toISOString(),
    playlistId: "p_3",
    channelId: "ch_2",
    status: "Live",
  },
];
