import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { db } from "./db";

export function getFfmpegPath(): string {
  const settings = db.getSettings();
  if (settings.ffmpegPath && fs.existsSync(settings.ffmpegPath)) {
    return settings.ffmpegPath;
  }
  return "ffmpeg";
}

export interface ProbeResult {
  duration: string;
  resolution: string;
  thumbnail?: string;
}

export async function probeMedia(filePath: string, mediaId: string): Promise<ProbeResult> {
  const ffmpegPath = getFfmpegPath();
  const thumbsDir = path.join(process.cwd(), "uploads", "thumbnails");
  if (!fs.existsSync(thumbsDir)) {
    fs.mkdirSync(thumbsDir, { recursive: true });
  }

  const thumbFilename = `${mediaId}.jpg`;
  const thumbFilePath = path.join(thumbsDir, thumbFilename);

  let duration = "00:00:00";
  let resolution = "1080p";
  let thumbnail: string | undefined = undefined;

  // 1. Probe duration & resolution using ffmpeg -i
  try {
    const stderr = await new Promise<string>((resolve) => {
      const child = spawn(/*turbopackIgnore: true*/ ffmpegPath, ["-i", filePath], { stdio: ["ignore", "pipe", "pipe"] });
      let output = "";
      child.stderr?.on("data", (chunk: Buffer) => {
        output += chunk.toString();
      });
      child.on("close", () => resolve(output));
      child.on("error", () => resolve(output));
    });

    // Parse Duration
    const durMatch = stderr.match(/Duration:\s*(\d{2}:\d{2}:\d{2})/);
    if (durMatch) {
      duration = durMatch[1];
    }

    // Parse Resolution
    const resMatch = stderr.match(/Video:.*?,\s*(\d{3,5})x(\d{3,5})/);
    if (resMatch) {
      const width = parseInt(resMatch[1], 10);
      const height = parseInt(resMatch[2], 10);
      if (height >= 2160 || width >= 3840) resolution = "4K";
      else if (height >= 1440 || width >= 2560) resolution = "1440p";
      else if (height >= 1080 || width >= 1920) resolution = "1080p";
      else if (height >= 720 || width >= 1280) resolution = "720p";
      else if (height >= 480) resolution = "480p";
      else resolution = `${width}x${height}`;
    }
  } catch (e) {
    console.error("Error probing media with ffmpeg:", e);
  }

  // 2. Generate thumbnail frame at 1s (or 0s)
  try {
    await new Promise<void>((resolve) => {
      const thumbChild = spawn(
        /*turbopackIgnore: true*/
        ffmpegPath,
        [
          "-ss", "00:00:01",
          "-i", filePath,
          "-vframes", "1",
          "-q:v", "2",
          "-y",
          thumbFilePath,
        ],
        { stdio: ["ignore", "pipe", "pipe"] }
      );
      thumbChild.on("close", () => resolve());
      thumbChild.on("error", () => resolve());
    });

    if (fs.existsSync(thumbFilePath)) {
      thumbnail = `/api/media/${mediaId}/thumbnail`;
    }
  } catch (e) {
    console.error("Error generating thumbnail with ffmpeg:", e);
  }

  return {
    duration,
    resolution,
    thumbnail,
  };
}

export function parseDurationToSeconds(durationStr: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(":").map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
}

export function formatSecondsToDuration(totalSec: number): string {
  if (totalSec <= 0) return "00:00:00";
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = Math.floor(totalSec % 60);

  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `00:${pad(minutes)}:${pad(seconds)}`;
}
