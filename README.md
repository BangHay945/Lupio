# ?? Lupio — 24/7 Live Broadcast Controller & Streaming Management System

Lupio adalah aplikasi manajemen & pengontrol live streaming **24/7 otomatis** berbasis Next.js 16 (App Router), React 19, Tailwind CSS v4, dan engine native FFmpeg. Lupio dirancang khusus untuk memutar playlist video secara otomatis, memisahkan kontrol siaran multi-channel (YouTube, Facebook, Twitch, Custom RTMP), serta menyediakan laporan analitik real-time.

---

## ? Fitur Utama (Key Features)

- ?? **24/7 Continuous RTMP Live Streaming**: Penyiaran nonstop ke berbagai platform (YouTube, Twitch, Facebook Live, TikTok, atau Custom RTMP Server).
- ?? **Drag & Drop Playlist Builder**: Pengaturan urutan pemutaran video secara bebas menggunakan `@dnd-kit`.
- ? **Smart Time-Based Auto-Switcher Rules**: Penjadwalan otomatis perpindahan playlist berdasarkan jam tayang.
- ??? **Watchdog Auto-Healing**: Sistem pemulihan otomatis jika koneksi RTMP terputus atau FFmpeg mengalami masalah.
- ?? **Analytics & Broadcast Reports**: Grafik interaktif Recharts untuk memantau data bandwidth, uptime, FPS, dan ekspor laporan CSV.
- ?? **EBU R128 Audio Normalizer**: Normalisasi volume suara audio secara konstan pada `-16 LUFS`.
- ?? **Modern Light & Dark Mode UI**: Tampilan transparan yang elegan dengan toggle tema instant.
- ?? **Direct Media & Thumbnail Upload**: Unggah file video/gambar secara langsung melalui dashboard.

---

## ?? Persyaratan Sistem (Prerequisites)

Sebelum menginstal, pastikan komputer/server Anda telah terpasang:
- **Node.js**: `v18.0.0` atau versi lebih baru.
- **FFmpeg**: Terpasang di sistem OS (Windows / Linux / macOS).

---

## ?? Panduan Instalasi & Cara Jalankan Aplikasi

### 1. Clone Repositori dari GitHub
```bash
git clone https://github.com/BangHay945/Lupio.git
cd Lupio/apps/web
```

### 2. Instal Dependensi Package
```bash
npm install
```

### 3. Jalankan Mode Pengembang (Development Mode)
```bash
npm run dev
```
Buka browser Anda dan akses: **`http://localhost:3000`**

### 4. Build & Jalankan Mode Produksi (Production Mode)
```bash
npm run build
npm run start
```

---

## ??? Panduan Deploy 24/7 di Server / VPS (Linux Ubuntu)

Untuk menjalankan Lupio secara 24/7 nonstop di background VPS Linux, disarankan menggunakan **PM2 Process Manager**:

```bash
# 1. Install PM2 secara global
sudo npm install -g pm2

# 2. Build proyek di VPS
cd /var/www/Lupio/apps/web
npm run build

# 3. Jalankan aplikasi di background via PM2
pm2 start npm --name "lupio-web" -- start

# 4. Simpan status PM2 agar otomatis jalan saat VPS restart
pm2 save
pm2 startup
```

---

## ?? Struktur Direktori Proyek

```text
LUPIO/
+-- apps/
¦   +-- web/
¦       +-- data/            # Local JSON database (db.json)
¦       +-- public/          # Asset gambar & ikon
¦       +-- src/
¦       ¦   +-- app/         # Page routes Next.js & API routes
¦       ¦   +-- components/  # Layout, dialog, dashboard, & UI widgets
¦       ¦   +-- lib/         # FFmpeg stream manager, services, & utilities
¦       +-- uploads/         # Direktori simpan file media video/thumbnail
+-- README.md
+-- .gitignore
```

---

## ?? Lisensi

Hak Cipta © 2026 **BangHay945**. Hak cipta dilindungi undang-undang.
