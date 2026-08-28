# Lupio — MVP Specification

## 1. Overview

**Lupio** adalah aplikasi berbasis web untuk menjalankan live streaming YouTube 24/7 menggunakan video pre-recorded.

Konsep utama:

> Upload video → buat playlist → hubungkan YouTube → pilih jadwal → Start Stream → server menjalankan live secara otomatis.

Aplikasi dirancang agar user tidak perlu membuka OBS atau menyalakan komputer terus-menerus.

## Product Name

**Lupio**

Tagline awal:

> Stream. Loop. Stay Live.

Positioning:

> Platform untuk menjalankan video pre-recorded sebagai live stream 24/7 secara otomatis dari cloud.

---

## Development Strategy — Frontend First

Untuk tahap awal, **Lupio difokuskan ke frontend terlebih dahulu**.

Tujuannya:

- mematangkan UI/UX
- memastikan flow aplikasi nyaman digunakan
- menentukan struktur halaman
- menguji navigation dan user journey
- membuat semua state penting dengan mock data
- memastikan komponen reusable sebelum backend dibuat

Pada fase frontend, aplikasi **belum membutuhkan database, FFmpeg, Redis, atau YouTube API**.

Semua data menggunakan:

```text
Static Mock Data
Local State
LocalStorage bila diperlukan
Fake Loading State
Fake Stream Status
```

Backend baru dibangun setelah:

```text
✓ Design system stabil
✓ Semua halaman utama selesai
✓ Create Stream flow selesai
✓ Media Library flow selesai
✓ Playlist flow selesai
✓ Schedule flow selesai
✓ Responsive layout selesai
✓ Empty/loading/error states selesai
```

Urutan pengembangan:

```text
PHASE 1
FRONTEND
 ↓
UI/UX VALIDATION
 ↓
PHASE 2
BACKEND
 ↓
STREAMING ENGINE
 ↓
PRODUCTION MVP
```

---

## 2. MVP Goals

Pengembangan Lupio dibagi menjadi dua milestone utama.

### Frontend MVP

Target pertama:

- Login UI
- Dashboard
- Streams page
- Create Stream wizard
- Media Library
- Playlist Manager
- Schedule
- Channels
- Logs
- Settings
- Responsive desktop/tablet
- Loading state
- Empty state
- Error state
- Mock stream controls
- Mock server metrics
- Mock realtime status

Fokus:

> Membuat seluruh pengalaman penggunaan Lupio terasa seperti produk jadi sebelum backend dihubungkan.

### Functional MVP

Setelah frontend matang:

- Upload video pre-recorded
- Media Library terhubung storage
- Membuat playlist
- Loop playlist tanpa batas
- Menjalankan beberapa stream secara bersamaan
- Input YouTube RTMPS URL dan Stream Key
- Start / Stop / Restart stream
- Scheduler
- Auto restart jika proses FFmpeg berhenti
- Monitoring status stream
- Monitoring CPU, RAM, storage, dan network
- Stream logs
- Streaming worker

Fokus:

> Stabil menjalankan beberapa YouTube Live dari satu server.

---

## 3. Non-Goals V1

Belum perlu dibuat pada MVP:

- Facebook Live
- Twitch
- Instagram Live
- Kick
- Billing / Subscription
- Team Management
- Advanced Analytics
- AI
- 4K Streaming
- Video Editor
- OAuth YouTube otomatis
- Mobile App

---

# 4. Frontend Stack

Recommended frontend stack:

```text
Next.js
React
TypeScript
Tailwind CSS
shadcn/ui
Lucide Icons
```

Optional:

```text
Framer Motion
React Hook Form
Zod
```

Untuk fase frontend, API dibuat sebagai abstraction/mock:

```text
src/
  lib/
    mock-data/
    services/
```

Contoh:

```text
streamService.getStreams()
mediaService.getMedia()
playlistService.getPlaylists()
```

Pada awal development, service membaca mock data.

Nanti saat backend siap, implementasi service diganti ke REST API tanpa perlu merombak komponen UI.

---

# 5. Design Direction

Lupio menggunakan visual:

```text
Modern SaaS
Minimal
Dark-friendly
Clean dashboard
High information density
Rounded cards
Subtle borders
Clear live status
```

Suggested default theme:

```text
Background:
Neutral / charcoal

Primary:
Modern violet / indigo

Success:
Live green

Danger:
Red

Warning:
Amber
```

Status badge:

```text
LIVE        ●
OFFLINE     ○
STARTING    ◌
SCHEDULED   ◷
ERROR       !
```

Prioritas:

```text
Readability
Hierarchy
Fast navigation
Minimal distraction
```

---

# 6. Frontend Route Structure

```text
/login

/dashboard

/streams
/streams/new
/streams/:id

/media

/playlists
/playlists/new
/playlists/:id

/schedule

/channels

/logs

/settings
```

App shell:

```text
Sidebar
Topbar
Main Content
Global Toast
Modal Layer
```

---

# 7. Frontend Mock Data

Sebelum backend tersedia, gunakan mock types:

```ts
type StreamStatus =
  | "LIVE"
  | "OFFLINE"
  | "STARTING"
  | "RESTARTING"
  | "SCHEDULED"
  | "ERROR"
```

Mock entities:

```text
Streams
Media
Playlists
Channels
Schedules
Logs
Server Stats
```

Contoh stream:

```text
Rain Sleep 24/7

Status:
LIVE

Channel:
Sleep Channel

Playlist:
Rain Sleep

Resolution:
1080p30

Uptime:
17h 42m
```

Actions pada fase frontend:

```text
Start
Stop
Restart
Delete
Duplicate
Edit
```

Semua action hanya mengubah mock/local state.

---

# 8. Frontend Development Order

## Step 1 — Foundation

- Next.js project
- Tailwind
- shadcn/ui
- TypeScript
- App shell
- Sidebar
- Topbar
- Theme tokens
- Typography
- Buttons
- Inputs
- Cards
- Tables
- Dialog
- Dropdown
- Toast

## Step 2 — Dashboard

Build:

- KPI cards
- active stream cards
- resource monitoring cards
- recent logs
- quick action
- empty state

## Step 3 — Streams

Build:

- stream list
- filters
- status
- stream detail
- mock start
- mock stop
- mock restart

## Step 4 — Create Stream

Build full wizard:

```text
Basic
Content
Channel
Output
Schedule
Review
```

## Step 5 — Media Library

Build:

- grid/list toggle
- upload modal
- processing state
- ready state
- error state
- media details

## Step 6 — Playlists

Build:

- create playlist
- add media
- remove media
- reorder media
- sequential/shuffle
- loop toggle

## Step 7 — Schedule

Build:

- calendar/list view
- start time
- stop time
- repeat rule
- scheduled badge

## Step 8 — Channels

Build:

- add YouTube channel
- manual RTMPS
- masked stream key
- edit/delete

## Step 9 — Logs

Build:

- filter by stream
- filter by level
- realtime-style mock feed

## Step 10 — Settings

Build:

- profile
- appearance
- stream defaults
- storage placeholder
- server placeholder

## Step 11 — Responsive & UX Polish

Validate:

```text
Desktop
Laptop
Tablet
Mobile basic support
```

Add:

```text
Skeleton
Empty State
Error State
Confirmation Dialog
Toast
Keyboard Accessibility
```

---

# 9. User Flow

```text
LOGIN
  ↓
DASHBOARD
  ↓
UPLOAD MEDIA
  ↓
CREATE PLAYLIST
  ↓
CREATE STREAM
  ↓
INPUT YOUTUBE STREAM KEY
  ↓
SET SCHEDULE
  ↓
START STREAM
  ↓
FFMPEG WORKER
  ↓
YOUTUBE LIVE
  ↓
AUTO LOOP
```

---

# Main Navigation

```text
Dashboard
Streams
Media
Playlists
Schedule
Channels
Logs
Settings
```

---

# Dashboard

Dashboard menampilkan kondisi streaming secara keseluruhan.

## Summary Cards

- Active Streams
- Offline Streams
- CPU Usage
- RAM Usage
- Storage Usage
- Upload Bandwidth

Contoh:

```text
Active Streams      3
Offline Streams     2

CPU                 42%
RAM                 5.8 GB / 16 GB
Storage             82 GB / 200 GB
Upload              28 Mbps
```

## Active Stream Cards

Setiap stream menampilkan:

- Stream name
- Channel
- Status
- Current video
- Playlist
- Resolution
- Bitrate
- Uptime
- Restart count

Actions:

- Manage
- Stop
- Restart

---

# Streams Page

Menampilkan semua stream.

## Stream Status

```text
LIVE
STARTING
STOPPING
OFFLINE
ERROR
SCHEDULED
```

## Stream Card

```text
Rain Sleep 24/7

Status:
LIVE

Channel:
Sleep Channel

Playlist:
Rain Sleep

Output:
1080p30

Uptime:
17h 42m

Restart:
1

[ Manage ]
[ Restart ]
[ Stop ]
```

---

# Create Stream

Gunakan wizard sederhana.

## Step 1 — Basic Information

Fields:

```text
Stream Name
Description
```

Example:

```text
Stream Name:
Rain Sleep 24/7
```

---

## Step 2 — Content

Options:

```text
Single Video
Playlist
```

Jika playlist:

```text
Playlist:
Rain Sleep

Playback:
Sequential
Shuffle

Loop:
Forever
Play Once
```

Default:

```text
Sequential
Loop Forever
```

---

## Step 3 — YouTube Destination

Fields:

```text
Channel Name
RTMPS URL
Stream Key
```

Example:

```text
RTMPS URL:
rtmps://a.rtmps.youtube.com/live2

Stream Key:
••••••••••••••••
```

Stream key harus:

- encrypted di database
- tidak ditampilkan secara default
- dapat diganti

---

## Step 4 — Output

MVP presets:

```text
720p30
1080p30
```

Fields:

```text
Resolution
FPS
Video Bitrate
Audio Bitrate
```

Recommended preset:

```text
1080p
30 FPS
8–10 Mbps
AAC 128 kbps
```

---

## Step 5 — Schedule

Options:

```text
Start Now
Scheduled
```

Schedule fields:

```text
Start Date
Start Time
Stop Time
Repeat
```

Repeat:

```text
Never
Daily
Monday–Friday
Every Day
Custom
```

---

## Step 6 — Review

Show:

```text
Stream Name
Channel
Playlist
Resolution
Schedule
Loop Mode
```

Actions:

```text
Save
Start Stream
```

---

# Media Library

Media Library digunakan untuk menyimpan video.

## Media Item

Fields:

```text
ID
Filename
Original Filename
File Size
Duration
Width
Height
FPS
Video Codec
Audio Codec
Status
Created At
```

Status:

```text
UPLOADING
ANALYZING
PROCESSING
READY
ERROR
```

Example:

```text
Rain Window.mp4

1920 × 1080
30 FPS
H.264
AAC
02:03:12
8.2 GB

STREAM READY
```

---

# Media Analyzer

Setelah upload:

```text
Upload
 ↓
FFprobe
 ↓
Analyze Video
 ↓
Compatible?
```

Jika compatible:

```text
READY
```

Jika tidak:

```text
NEEDS OPTIMIZATION
```

---

# Media Optimization

Target format:

```text
Container:
MP4

Video:
H.264

Audio:
AAC

FPS:
Constant Frame Rate

Resolution:
720p / 1080p
```

Flow:

```text
Original Video
      ↓
   FFmpeg
      ↓
Optimized Video
      ↓
Media Library
```

Video hanya dikonversi sekali.

---

# Playlist

Playlist terdiri dari beberapa media.

Example:

```text
Rain Sleep

1. Rain Window.mp4       02:00:00
2. Heavy Rain.mp4        01:30:00
3. Rain Cabin.mp4        03:00:00
4. Thunder Rain.mp4      02:45:00

Total:
09:15:00
```

Options:

```text
Sequential
Shuffle

Loop Playlist
ON / OFF
```

---

# Channels

Untuk MVP channel dibuat manual.

Fields:

```text
Channel Name
Platform
RTMPS URL
Stream Key
```

Example:

```text
Channel:
Sleep Channel

Platform:
YouTube

RTMPS:
rtmps://a.rtmps.youtube.com/live2

Stream Key:
Encrypted
```

Future version:

```text
Connect YouTube
```

menggunakan Google OAuth + YouTube API.

---

# Streaming Engine

Streaming engine menggunakan FFmpeg.

Architecture:

```text
Dashboard
   ↓
API
   ↓
Stream Manager
   ↓
Queue
   ↓
Worker
   ↓
FFmpeg
   ↓
YouTube RTMPS
```

---

# Stream Worker

Setiap stream memiliki worker sendiri.

Example:

```text
stream-worker-001
stream-worker-002
stream-worker-003
```

Setiap worker mengelola:

```text
Playlist
FFmpeg Process
Stream Status
Heartbeat
Logs
Auto Recovery
```

---

# FFmpeg Process

Basic flow:

```text
Playlist
   ↓
Concat Input
   ↓
FFmpeg
   ↓
RTMPS
   ↓
YouTube
```

Target:

```text
Video:
H.264

Audio:
AAC

Protocol:
RTMPS
```

---

# Stream Manager

Stream Manager bertugas untuk:

- Start worker
- Stop worker
- Restart worker
- Detect crash
- Track PID
- Save status
- Save logs
- Update uptime

Pseudo-flow:

```text
START STREAM

Create Worker
    ↓
Create Playlist File
    ↓
Spawn FFmpeg
    ↓
Save PID
    ↓
STREAMING
```

Stop:

```text
STOP
 ↓
SIGTERM
 ↓
Wait
 ↓
SIGKILL if needed
 ↓
OFFLINE
```

---

# Auto Recovery

Heartbeat:

```text
Worker
  ↓
FFmpeg alive?
  ↓
Yes → continue

No
 ↓
Increment restart_count
 ↓
Restart FFmpeg
 ↓
Save error log
```

Recommended:

```text
Max Retry:
5

Retry Delay:
10 seconds
```

Setelah retry gagal:

```text
Status:
ERROR
```

---

# Scheduler

Scheduler berjalan di backend.

Examples:

```text
Rain Sleep

Start:
20:00

Stop:
06:00

Repeat:
Daily
```

Flow:

```text
Scheduler
 ↓
Check Jobs
 ↓
Start Stream
 ↓
Streaming
 ↓
Stop Time
 ↓
Stop Stream
```

---

# Logs

Log types:

```text
INFO
WARNING
ERROR
FFMPEG
SYSTEM
```

Example:

```text
20:00:00 INFO Stream starting
20:00:02 INFO FFmpeg started
20:00:06 INFO Connected to YouTube
03:15:22 WARNING Connection unstable
03:15:28 ERROR FFmpeg stopped
03:15:38 INFO Auto restart
03:15:43 INFO Stream recovered
```

---

# Server Monitoring

Metrics:

```text
CPU Usage
RAM Usage
Disk Usage
Network Upload
Active Workers
FFmpeg Processes
```

Dashboard refresh:

```text
5–10 seconds
```

---

# Recommended Full Stack

> Untuk fase pertama, hanya bagian **Frontend** yang dikerjakan. Bagian backend di bawah adalah target integrasi setelah UI selesai.

## Frontend

```text
Next.js
React
Tailwind CSS
```

Optional:

```text
shadcn/ui
Lucide Icons
```

---

## Backend

Recommended:

```text
Node.js
NestJS
```

Alternative:

```text
Next.js API
```

NestJS lebih cocok jika aplikasi akan berkembang menjadi SaaS.

---

## Database

```text
PostgreSQL
```

ORM:

```text
Prisma
```

---

## Queue

```text
Redis
BullMQ
```

Digunakan untuk:

```text
Stream Jobs
Media Optimization
Scheduled Tasks
Retries
```

---

## Streaming

```text
FFmpeg
FFprobe
```

---

## Container

```text
Docker
```

Recommended:

```text
Docker Compose
```

MVP belum perlu Kubernetes.

---

## Reverse Proxy

```text
Nginx
```

---

# Suggested Project Structure

```text
lupio/

apps/

  web/
    Next.js Frontend

    src/
      app/
      components/
      features/
      lib/
        mock-data/
        services/
      hooks/
      types/

  api/
    NestJS API
    # Dibuat setelah frontend matang

services/

  stream-worker/
    FFmpeg Worker

  media-worker/
    Video Processing

packages/

  database/
    Prisma

  shared/
    Types

  config/

docker/
```

---

# Database Schema

Main tables:

```text
users

channels

media

playlists

playlist_items

streams

stream_sessions

schedules

stream_logs
```

---

## Users Table

```text
id
name
email
password_hash
created_at
updated_at
```

---

## Channels Table

```text
id
user_id
name
platform
rtmps_url
stream_key_encrypted
created_at
updated_at
```

---

## Media Table

```text
id
user_id
name
file_path
file_size
duration
width
height
fps
video_codec
audio_codec
status
created_at
updated_at
```

---

## Playlists Table

```text
id
user_id
name
play_mode
loop_enabled
created_at
updated_at
```

---

## Playlist Items Table

```text
id
playlist_id
media_id
position
created_at
```

---

## Streams Table

```text
id
user_id
channel_id
playlist_id

name

status

resolution
fps
video_bitrate
audio_bitrate

loop_enabled
shuffle_enabled

restart_count

created_at
updated_at
```

---

## Stream Sessions

Menyimpan histori setiap live.

```text
id
stream_id

started_at
ended_at

status
exit_code

restart_count
```

---

## Schedules

```text
id
stream_id

start_time
stop_time

timezone

repeat_type

enabled
```

---

## Stream Logs

```text
id
stream_id

level
message

created_at
```

---

# REST API

## Authentication

```text
POST /auth/login
POST /auth/logout
GET  /auth/me
```

---

## Media

```text
GET    /media
POST   /media/upload
GET    /media/:id
DELETE /media/:id

POST /media/:id/analyze
POST /media/:id/optimize
```

---

## Playlist

```text
GET    /playlists
POST   /playlists
GET    /playlists/:id
PATCH  /playlists/:id
DELETE /playlists/:id
```

Playlist items:

```text
POST   /playlists/:id/items
DELETE /playlists/:id/items/:itemId
PATCH  /playlists/:id/reorder
```

---

## Channels

```text
GET    /channels
POST   /channels
PATCH  /channels/:id
DELETE /channels/:id
```

---

## Streams

```text
GET    /streams
POST   /streams

GET    /streams/:id
PATCH  /streams/:id
DELETE /streams/:id
```

Controls:

```text
POST /streams/:id/start
POST /streams/:id/stop
POST /streams/:id/restart
```

---

## Stream Logs

```text
GET /streams/:id/logs
```

---

## Server

```text
GET /server/health
GET /server/stats
```

---

# WebSocket Events

Untuk realtime dashboard.

Events:

```text
stream.status.changed
stream.started
stream.stopped
stream.error

server.stats

media.processing
media.ready
```

---

# Stream States

```text
OFFLINE

STARTING

LIVE

RESTARTING

STOPPING

ERROR
```

State flow:

```text
OFFLINE
 ↓
STARTING
 ↓
LIVE
 ↓
STOPPING
 ↓
OFFLINE
```

Crash:

```text
LIVE
 ↓
RESTARTING
 ↓
LIVE
```

Jika gagal:

```text
RESTARTING
 ↓
ERROR
```

---

# Security

Stream Key:

```text
AES encrypted
```

Never:

```text
Plain text database
```

API:

```text
Authentication
Rate limiting
Validation
Authorization
```

Uploads:

```text
Validate extension
Validate MIME
Maximum file size
FFprobe validation
```

---

# Storage

MVP:

```text
Local VPS Storage
```

Directory:

```text
/data/media
/data/optimized
/data/playlists
/data/logs
```

Future:

```text
S3
Cloudflare R2
Backblaze B2
MinIO
```

---

# UI Pages

## Login

```text
/login
```

## Dashboard

```text
/dashboard
```

## Streams

```text
/streams
/streams/new
/streams/:id
```

## Media

```text
/media
```

## Playlist

```text
/playlists
/playlists/new
/playlists/:id
```

## Schedule

```text
/schedule
```

## Channels

```text
/channels
```

## Logs

```text
/logs
```

## Settings

```text
/settings
```

---

# Dashboard Wireframe

```text
┌──────────────────────────────────────────────────────────┐
│ Lupio                         User          │
├─────────────┬────────────────────────────────────────────┤
│ Dashboard   │                                            │
│ Streams     │ Active Streams     CPU      RAM            │
│ Media       │      3             42%      5.8GB          │
│ Playlists   │                                            │
│ Schedule    │ ----------------------------------------   │
│ Channels    │                                            │
│ Logs        │ Rain Sleep 24/7                 LIVE       │
│ Settings    │ YouTube • Channel A                        │
│             │ Playlist: Rain Sleep                       │
│             │ Uptime: 17h 42m                            │
│             │                                            │
│             │ [Manage] [Restart] [Stop]                  │
│             │                                            │
│             │ ----------------------------------------   │
│             │                                            │
│             │ Quran Night                     LIVE       │
│             │ YouTube • Channel B                        │
│             │                                            │
│             │ [Manage] [Restart] [Stop]                  │
│             │                                            │
│             │                    + Create Stream         │
└─────────────┴────────────────────────────────────────────┘
```

---

# Create Stream Wireframe

```text
CREATE STREAM

Step 1
Basic

Name:
Rain Sleep 24/7


Step 2
Content

Playlist:
Rain Sleep

Loop:
ON

Playback:
Sequential


Step 3
YouTube

Channel:
Sleep Channel

RTMPS:
rtmps://...

Stream Key:
••••••••••••


Step 4
Output

1080p
30fps
8 Mbps


Step 5
Schedule

Start:
Now


[ CREATE & START ]
```

---

# Deployment Architecture

```text
Internet
   ↓
Nginx
   ↓
Frontend / API
   ↓
PostgreSQL
   ↓
Redis
   ↓
Stream Manager
   ↓
Worker Containers
   ↓
FFmpeg
   ↓
YouTube
```

---

# Docker Services

Suggested:

```text
nginx

web

api

postgres

redis

stream-worker

media-worker
```

---

# Environment Variables

Example:

```env
DATABASE_URL=

REDIS_URL=

JWT_SECRET=

STREAM_KEY_ENCRYPTION_KEY=

MEDIA_DIR=/data/media

OPTIMIZED_MEDIA_DIR=/data/optimized

LOG_DIR=/data/logs
```

Never commit `.env`.

---

# Development Phases

## Phase A — Frontend MVP

### A1 — Foundation

- Next.js
- Tailwind
- shadcn/ui
- App shell
- Design system
- Mock service layer

### A2 — Core Screens

- Login
- Dashboard
- Streams
- Stream Detail
- Create Stream wizard

### A3 — Content Screens

- Media Library
- Playlists
- Channels

### A4 — Operations Screens

- Schedule
- Logs
- Settings

### A5 — UX Validation

- responsive
- empty states
- loading states
- error states
- confirmation dialogs
- keyboard accessibility
- mock actions

Frontend dianggap selesai ketika seluruh flow dapat didemokan tanpa backend.

---

## Phase B — Backend Foundation

Setelah frontend matang:

- NestJS API
- PostgreSQL
- Prisma
- Redis
- Authentication
- REST API
- WebSocket

---

## Phase C — Media Engine

- Upload
- FFprobe
- Media metadata
- FFmpeg optimization
- Storage

---

## Phase D — Streaming Engine

- Stream Manager
- FFmpeg Worker
- Start
- Stop
- Restart
- Multiple Workers
- Logs

---

## Phase E — Scheduler & Recovery

- Scheduled start
- Scheduled stop
- Repeat rules
- Heartbeat
- Auto restart
- Retry limits

---

## Phase F — Integration

Frontend mock service:

```text
Mock Service
```

diganti menjadi:

```text
REST API / WebSocket
```

tanpa mengubah struktur UI utama.

---

# MVP Success Criteria

## Frontend MVP

Frontend dianggap berhasil jika:

```text
✓ Semua halaman utama tersedia

✓ Navigation konsisten

✓ Create Stream wizard selesai

✓ Stream controls dapat disimulasikan

✓ Media Library dapat disimulasikan

✓ Playlist dapat dibuat dengan mock data

✓ Schedule dapat dibuat dengan mock data

✓ Dashboard terlihat realtime menggunakan mock state

✓ Loading/empty/error states tersedia

✓ Layout responsive

✓ Semua komponen utama reusable
```

## Functional MVP

Functional MVP dianggap berhasil jika:

```text
✓ User dapat upload video

✓ User dapat membuat playlist

✓ User dapat membuat channel YouTube

✓ User dapat membuat stream

✓ Playlist dapat loop

✓ FFmpeg dapat stream ke YouTube

✓ Minimal 3 stream dapat berjalan bersamaan

✓ Stream dapat di-stop

✓ Stream dapat di-restart

✓ Stream otomatis restart setelah crash

✓ Stream dapat dijadwalkan

✓ Dashboard menerima status realtime dari backend
```

---

# Recommended Initial Limit

Untuk V1:

```text
Max active streams:
5

Resolution:
720p / 1080p

FPS:
30

Platforms:
YouTube only

Max upload:
Configurable

Storage:
Local
```

---

# Future Roadmap

## V1.1

```text
YouTube OAuth
YouTube Live API
Better analytics
Stream thumbnails
Email notification
```

## V1.2

```text
Cloud Storage
Object Storage
Multi Server Worker
```

## V2

```text
Facebook Live
Twitch
Kick
Instagram
```

## SaaS

```text
Subscription
Storage quota
Stream quota
Multi-user
Team
Admin Panel
Billing
```

---

# Product Positioning

Simple positioning:

> Run pre-recorded videos as continuous YouTube Live streams directly from the cloud.

Alternative:

> Upload once. Stream 24/7.

Core value:

```text
No OBS
No PC 24/7
Multiple Streams
Automatic Loop
Automatic Recovery
Cloud Controlled
```

---

# MVP Final Scope

The first production-ready MVP should include:

```text
Authentication

Dashboard

Media Library

Media Analyzer

Media Optimization

Playlist Manager

YouTube Channel Manager

Stream Manager

FFmpeg Worker

Multiple Streams

Loop Playback

Scheduler

Auto Recovery

Logs

Server Monitoring
```

---

## Final MVP Flow

```text
Upload
 ↓
Optimize
 ↓
Playlist
 ↓
YouTube Channel
 ↓
Create Stream
 ↓
Start
 ↓
FFmpeg Worker
 ↓
YouTube Live
 ↓
Loop Forever
 ↓
Auto Recovery
```

This is the recommended foundation for building Lupio as a lightweight Gyre-style 24/7 live streaming platform.
