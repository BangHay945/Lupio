# 📡 Lupio - 24/7 Live Broadcast Controller & Streaming Management System

Lupio adalah aplikasi manajemen & pengontrol live streaming **24/7 otomatis** berbasis Next.js 16 (App Router), React 19, Tailwind CSS v4, dan engine native FFmpeg. Lupio dirancang khusus untuk memutar playlist video secara otomatis, memisahkan kontrol siaran multi-channel (YouTube, Facebook, Twitch, Custom RTMP), serta menyediakan laporan analitik real-time.

---

## ✨ Fitur Utama (Key Features)

- 🔴 **24/7 Continuous RTMP Live Streaming**: Penyiaran nonstop ke berbagai platform (YouTube, Twitch, Facebook Live, TikTok, atau Custom RTMP Server).
- 🎛️ **Drag & Drop Playlist Builder**: Pengaturan urutan pemutaran video secara bebas menggunakan @dnd-kit.
- ⏰ **Smart Time-Based Auto-Switcher Rules**: Penjadwalan otomatis perpindahan playlist berdasarkan jam tayang.
- 🛡️ **Watchdog Auto-Healing**: Sistem pemulihan otomatis jika koneksi RTMP terputus atau FFmpeg mengalami masalah.
- 📊 **Analytics & Broadcast Reports**: Grafik interaktif Recharts untuk memantau data bandwidth, uptime, FPS, dan ekspor laporan CSV.
- 🔊 **EBU R128 Audio Normalizer**: Normalisasi volume suara audio secara konstan pada -16 LUFS.
- 🌓 **Modern Light & Dark Mode UI**: Tampilan transparan elegan dengan toggle tema instan.
- 📁 **Direct Media & Thumbnail Upload**: Unggah file video/gambar secara langsung melalui dashboard.
- 🐳 **Docker & Docker Compose Ready**: Kontainerisasi mandiri lengkap dengan FFmpeg terisolasi dan volume persistensi.

---

## 🐳 Panduan Instalasi & Deploy via Docker (Direkomendasikan)

Menggunakan Docker adalah cara paling cepat, bersih, dan konsisten untuk menjalankan Lupio di server VPS atau komputer lokal tanpa perlu menginstal FFmpeg atau Node.js secara manual di OS host.

### Skenario A: Deploy di Server / VPS (Linux Ubuntu / Debian)

#### 1. Masuk ke VPS & Pasang Docker (Jika belum ada)
`ash
# Update paket & pasang curl + git
sudo apt update && sudo apt install -y git curl

# Pasang Docker resmi otomatis
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
`

#### 2. Clone Repositori Lupio
`ash
git clone https://github.com/BangHay945/Lupio.git
cd Lupio
`

#### 3. Jalankan Lupio
`ash
docker compose up -d --build
`
Akses dashboard di browser Anda:
👉 **http://IP-VPS-ANDA:3000**

---

### Skenario B: Menjalankan di Komputer / Laptop (Windows)

1. Pastikan aplikasi **Docker Desktop** sudah dibuka dan berstatus ** Engine running**.
2. Buka terminal di folder proyek Lupio, lalu jalankan:
   `powershell
   docker compose up -d --build
   `
3. Buka browser di:
   👉 **http://localhost:3000**

---

### Perintah Manajemen Kontainer:

| Kebutuhan | Perintah |
| :--- | :--- |
| **Pantau Log Streaming FFmpeg Real-time** | docker compose logs -f |
| **Periksa Status Kontainer** | docker compose ps |
| **Restart Aplikasi** | docker compose restart |
| **Hentikan Kontainer** | docker compose down |

> [!NOTE]
> Seluruh data database (db.json) dan berkas video yang diunggah (uploads/) disimpan secara persisten di folder host ./apps/web/data dan ./apps/web/uploads, sehingga data Anda tetap aman meskipun kontainer di-update atau di-rebuild.

---

## 💻 Panduan Instalasi Manual (Node.js & PM2)

Jika Anda ingin menjalankan Lupio langsung di lingkungan Node.js host tanpa Docker:

### 1. Persyaratan Sistem
- **Node.js**: 20.0.0 atau versi lebih baru.
- **FFmpeg**: Terpasang di OS sistem (Windows / Linux / macOS).

### 2. Instalasi & Mode Pengembangan
`ash
cd apps/web
npm install
npm run dev
`
Akses di browser: http://localhost:3000

### 3. Build & Jalankan Mode Produksi di VPS (PM2)
`ash
# Install PM2 secara global
npm install -g pm2

# Build produksi
cd apps/web
npm run build

# Jalankan via file konfigurasi PM2 bawaan
npm run pm2:start
`

---

## 📂 Struktur Direktori Proyek

`	ext
LUPIO/
├── Dockerfile               # Konfigurasi Docker multi-stage build + FFmpeg
├── docker-compose.yml       # Orkestrasi Docker dengan volume mount persistensi
├── .dockerignore            # Pengecualian berkas build Docker
├── ecosystem.config.cjs     # Konfigurasi runner proses PM2
├── apps/
│   └── web/
│       ├── data/            # Local JSON database (db.json) & playlist manifest
│       ├── uploads/         # Direktori berkas media video & thumbnail
│       ├── public/          # Aset statis web & preview HLS
│       └── src/
│           ├── app/         # Next.js App Router (Dashboard, Streams, Media, dsb.)
│           ├── components/  # Layout, UI components, & dialogs
│           └── lib/         # Stream manager, FFmpeg engine, & auth services
└── README.md
`

---

## 📄 Lisensi

Hak Cipta © 2026 **BangHay945**. Hak cipta dilindungi undang-undang.