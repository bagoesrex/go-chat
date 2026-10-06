# go-chat

Platform chat realtime berbasis Go backend + Vite React Bun frontend.

## Dokumentasi

- [Design Document](docs/design.md) — arsitektur, skema DB, REST API, WebSocket protocol

## Tech Stack

- **Backend:** Go `net/http`, gorilla/websocket, PostgreSQL, JWT
- **Frontend:** Vite + React + Bun

## Prerequisites

- Go 1.21+
- PostgreSQL (running, dengan database sudah dibuat)

## Cara Menjalankan

```bash
# 1. Salin env dan isi nilainya
cp .env.example .env

# 2. Edit .env
# DB_URL=postgres://user:pass@localhost:5432/gochat?sslmode=disable
# JWT_SECRET=changeme
# PORT=8080

# 3. Jalankan (migrasi otomatis berjalan saat startup)
go run main.go
```

Server berjalan di `http://localhost:8080`.
