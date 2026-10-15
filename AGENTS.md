# go-chat — AI Agent Guidelines

Dokumen ini berisi panduan, konvensi arsitektur, dan aturan pengembangan untuk seluruh AI Coding Agent yang bekerja di repositori **go-chat**.

---

## 1. Tata Letak Proyek (Project Layout)

```
go-chat/
├── backend/                  # Go API & WebSocket server
├── frontend/                 # Vite + React + TypeScript + CSS Modules
├── docs/                     # Dokumentasi arsitektur, API, database, frontend
└── AGENTS.md                 # Berkas panduan ini
```

---

## 2. Perintah Pengembangan (Development Commands)

### A. Backend (Jalankan selalu dari dalam folder `backend/`)

```bash
cd backend

# Menjalankan unit tests
go test ./...

# Memverifikasi kompilasi
go build ./...

# Menjalankan server lokal
go run main.go
```

### B. Frontend (Jalankan selalu dari dalam folder `frontend/`)

```bash
cd frontend

# Memasang dependensi
bun install     # atau: npm install

# Menjalankan linter (wajib lolos sebelum commit)
bun run lint    # atau: npm run lint (oxlint)

# Memverifikasi typecheck dan build produksi
bun run build   # atau: npm run build (tsc -b && vite build)

# Menjalankan dev server
bun run dev     # atau: npm run dev
```

> **Path Alias:** `@/` diarahkan ke `src/` (dikonfigurasi di `vite.config.ts` dan `tsconfig.json`).

---

## 3. Konfigurasi & Variabel Lingkungan (No Hardcoding)

1. **Dilarang Keras Melakukan Hardcode:**
   - Dilarang menaruh port, base URL, URL WebSocket, atau rahasia sensitif (JWT secret, DB URL) langsung di dalam kode.
2. **Penggunaan File `.env`:**
   - Backend membaca konfigurasi via `internal/config/config.go` dari `backend/.env`.
   - Frontend membaca konfigurasi via `import.meta.env` dari `frontend/.env`.
3. **Pembaruan `.env.example`:**
   - Setiap menambahkan variabel konfigurasi baru, **wajib** mencatatnya pada `backend/.env.example` atau `frontend/.env.example` dengan komentar penjelas yang mudah dipahami.
4. **Git Safety:**
   - File `.env` asli tidak boleh di-commit (telah diabaikan di `.gitignore`).

---

## 4. Konvensi Arsitektur & Kode

### A. Backend (Go)
- **No HTTP Framework:** Gunakan pustaka standar `net/http` bawaan Go.
- **Konkurensi Channel-Driven:** Komunikasi antar goroutine WebSocket wajib menggunakan channel Hub (`Broadcast`, `BroadcastMembers`, `SendUser`). Hindari penggunaan mutex manual di luar kebutuhan kritis.
- **Context Keys:** Semua kunci context harus didefinisikan secara terpusat di `internal/ctxkey/ctxkey.go`.
- **Penanganan Error HTTP:** Gunakan `http.Error(w, msg, status)`. Jangan membuat custom response writer sendiri tanpa persetujuan.
- **Penyimpanan Pesan Non-Blocking:** Simpan pesan chat ke database dalam goroutine terpisah (*fire-and-forget*) agar tidak memblokir antrian broadcast Hub.

### B. Frontend (Clean Architecture & React)
- **Struktur Lapisan (Layered Architecture):**
  `Entities` → `Repositories (Interfaces)` → `Use Cases` → `Zustand Stores` → `Features / UI`
- **Aturan Dependensi:** Lapisan atas boleh mengimpor lapisan bawah, tetapi **tidak sebaliknya**.
  - `Entities` tidak boleh mengimpor lapisan mana pun.
  - `Store` tidak boleh mengimpor `infrastructure` secara langsung — wajib melalui `usecase` atau `repository interface`.
- **Tanpa Library UI Eksternal:**
  - Dilarang memasang library komponen UI (misal: shadcn/ui, MUI, Chakra, Tailwind).
  - Seluruh komponen (Button, Input, Modal, Dropdown) dibuat kustom menggunakan **CSS Modules**.
- **Ikonografi:**
  - Gunakan `iconoir-react` untuk ikon standar.
  - Untuk ikon kustom atau logo brand, buat berkas komponen SVG di `src/icons/`.

### C. Standar Desain Neo-Brutalism (Light Mode Only)
- **Visual Tokens:**
  - Border tebal: `2px solid #0D0D0D` (atau `1.5px` untuk elemen kecil).
  - Hard drop-shadow: `4px 4px 0px #0D0D0D` (atau `2px 2px 0px` untuk elemen kecil).
  - Radius: `0px` (persegi tegas tanpa sudut membulat).
- **Tipografi:**
  - `Inter`: Untuk teks pesan obrolan, paragraf, dan isi konten.
  - `JetBrains Mono`: Untuk username (`@user`), nama room (`#room`), timestamp, badge angka, dan status label.
- **Transisi & Stabilitas Layout:**
  - Hindari transisi full-page berbasis skala (`scale()`) atau *fade-out/fade-in* yang membuat garis border tampak kabur atau berkedip.
  - Gunakan *persistent layouts* (`AuthLayout`, `RoomsLayout`) agar frame utama tidak di-unmount saat rute berganti.
  - Isolasi transisi hanya pada viewport pesan (`.viewport`).

---

## 5. Konvensi Git & Commit

- **Format Semantic Commit:**
  `feat(scope): deskripsi singkat`
  `fix(scope): deskripsi singkat`
  `docs: deskripsi singkat`
  `chore: deskripsi singkat`
  `refactor(scope): deskripsi singkat`
  `test: deskripsi singkat`
- **Aturan Commit:**
  - Pesan commit singkat, padat, huruf kecil, tanpa tanda titik di akhir.
  - Tanpa commit body panjang, tanpa footer, tanpa tag `Co-authored-by`.
  - Lakukan commit secara berkala per tugas/milestone kecil yang telah terverifikasi.

---

## 6. Verifikasi Kualitas Sebelum Selesai

Sebelum menyelesaikan tugas atau meminta review pengguna, pastikan:
1. `cd backend && go test ./... && go build ./...` sukses tanpa error.
2. `cd frontend && npm run lint && npm run build` sukses tanpa warning/error.
3. Tidak ada file rahasia `.env` yang masuk ke staging git.
