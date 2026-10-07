# go-chat

Platform chat realtime berbasis Go backend + Vite React Bun frontend.

## Struktur Project

```
go-chat/
├── backend/    # Go API server
├── frontend/   # Vite + React + Bun (coming soon)
└── docs/
```

## Dokumentasi

- [Backend Design](docs/design.md) — arsitektur, skema DB, REST API, WebSocket protocol
- [Frontend Design](docs/frontend-design.md) — sprint plan, clean architecture, design system, brutalism

## Tech Stack

- **Backend:** Go `net/http`, gorilla/websocket, PostgreSQL, JWT
- **Frontend:** Vite + React + Bun, Zustand, Iconoir, CSS Modules

## Prerequisites

- Go 1.21+
- PostgreSQL (running, dengan database sudah dibuat)
- Bun (untuk frontend)

## Cara Menjalankan

```bash
# 1. Salin env dan isi nilainya
cp backend/.env.example backend/.env

# 2. Edit backend/.env
# DB_URL=postgres://user:pass@localhost:5432/gochat?sslmode=disable
# JWT_SECRET=changeme
# PORT=8080

# 3. Jalankan dari dalam folder backend (migrasi otomatis berjalan saat startup)
cd backend
go run main.go
```

Server berjalan di `http://localhost:8080`.

### Frontend

```bash
cd frontend
bun install
bun run dev   # http://localhost:5173
```
