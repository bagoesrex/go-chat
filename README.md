# go-chat

Live: [go-chat-rex.vercel.app](https://go-chat-rex.vercel.app)

Platform chat realtime berperforma tinggi dengan backend **Go**, frontend **React + Vite**, dan desain bertema **Neo-Brutalism**.

---

## Fitur Utama

- **Realtime 1-on-1 Direct Messaging (DM):** Percakapan privat antar 2 pengguna dengan notifikasi pembuatan room instan via WebSocket.
- **Channels & Explore:** Saluran publik untuk komunitas dengan fitur penjelajahan (*explore modal*) dan bergabung langsung (*one-click join*).
- **Sidebar Terorganisir:** Pengelompokan Channels dan Direct Messages dalam dropdown accordion terpisah.
- **Indikator Unread Realtime:** Badge jumlah pesan yang belum dibaca per room dan indikator pill agregat saat kategori sedang ditutup.
- **Batch Mark as Read:** Menandai seluruh pesan dalam room sebagai terbaca secara otomatis saat room dibuka.
- **Status Kehadiran (Presence):** Indikator status online/offline pengguna secara realtime.
- **Desain Neo-Brutalism:** Estetika tegas dengan border 2px solid, hard box-shadow 4px, palet kontras tinggi, dan tipografi dual-font (Inter + JetBrains Mono).
- **Transisi Halus & Bebas Glitch:** Menggunakan *persistent layout* untuk mencegah layout shift dan isolasi transisi scoped hanya pada viewport pesan.

---

## Tech Stack

| Lapisan | Teknologi |
|---|---|
| **Backend** | Go 1.21+ (`net/http` stdlib, `gorilla/websocket`, `golang-jwt/jwt/v5`, `bcrypt`) |
| **Database** | PostgreSQL 14+ (`github.com/lib/pq`) |
| **Frontend** | React 19, TypeScript, Vite 8, Zustand 5, Iconoir React, CSS Modules |
| **Package Manager** | Bun atau npm / pnpm |

---

## Dokumentasi Lengkap

Dokumentasi arsitektur dan spesifikasi teknis mendalam tersedia di folder [`docs/`](docs/):

- [**Indeks Dokumentasi**](docs/README.md)
- [**Arsitektur Sistem**](docs/architecture.md) — Model konkurensi goroutine Hub-and-Spoke & Clean Architecture frontend.
- [**Spesifikasi API & WebSocket**](docs/api.md) — Referensi lengkap endpoint REST API dan format frame WebSocket.
- [**Desain Database**](docs/database.md) — Skema tabel PostgreSQL, optimasi indeks, dan kueri kalkulasi unread.
- [**Frontend & Design System**](docs/frontend.md) — Desain tokens Neo-Brutalism, Zustand store, dan transisi layout.

---

## Prasyarat Sistem

- **Go** versi 1.21 ke atas
- **PostgreSQL** aktif (buat database kosong, misal: `gochat`)
- **Bun** (direkomendasikan) atau **Node.js** (v18+)

---

## Panduan Instalasi & Menjalankan

### 1. Setup Backend

1. Masuk ke direktori backend dan salin template environment:
   ```bash
   cd backend
   cp .env.example .env
   ```
2. Sesuaikan konfigurasi di `backend/.env`:
   ```env
   PORT=8080
   DB_URL=postgres://postgres:postgres@localhost:5432/gochat?sslmode=disable
   JWT_SECRET=rahasia_super_aman_ganti_di_produksi
   CLIENT_ORIGIN=http://localhost:5173
   ```
3. Jalankan server (migrasi skema database dijalankan otomatis saat startup):
   ```bash
   go run main.go
   ```
   *Backend akan berjalan di `http://localhost:8080`.*

### 2. Setup Frontend

1. Buka terminal baru, masuk ke direktori frontend, dan salin template environment:
   ```bash
   cd frontend
   cp .env.example .env
   ```
2. Pastikan `frontend/.env` telah terkonfigurasi:
   ```env
   VITE_API_URL=http://localhost:8080
   VITE_WS_URL=ws://localhost:8080
   ```
3. Pasang dependensi dan jalankan server pengembang:
   ```bash
   # Menggunakan Bun
   bun install
   bun run dev

   # Atau menggunakan npm
   npm install
   npm run dev
   ```
   *Frontend dapat diakses di `http://localhost:5173`.*

---

## Struktur Direktori

```
go-chat/
├── backend/                  # REST API & WebSocket server (Go)
│   ├── cmd/ atau main.go     # Entry point & routing
│   ├── internal/             # Domain logic (auth, room, user, ws, db, config)
│   ├── migrations/           # Skema SQL PostgreSQL
│   └── .env.example          # Template konfigurasi backend
│
├── frontend/                 # Client UI (Vite + React)
│   ├── src/                  # Clean Architecture (core, infrastructure, store, features)
│   └── .env.example          # Template konfigurasi frontend
│
├── docs/                     # Dokumentasi arsitektur dan API terstruktur
│   ├── README.md             # Indeks dokumen
│   ├── architecture.md       # Desain arsitektur
│   ├── api.md                # Spesifikasi REST & WebSocket
│   ├── database.md           # Skema database & indeks
│   └── frontend.md           # Standar Neo-Brutalism & state
│
└── AGENTS.md                 # Panduan dan aturan untuk AI Coding Agents
```
