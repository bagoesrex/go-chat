# go-chat — Claude Instructions

## Project Layout

```
go-chat/
├── backend/    # Go API — semua perintah Go dijalankan dari sini
├── frontend/   # Vite + React + Bun (belum ada)
└── docs/
```

## Perintah Backend

Selalu jalankan dari dalam `backend/`:

```bash
cd backend
go build ./...
go test ./...
go run main.go
```

## Commit

- Semantic commit: `feat(scope):`, `fix(scope):`, `chore:`, `docs:`, `refactor:`, `test:`
- Tanpa body, tanpa footer, tanpa `Co-authored-by`
- Commit per task/fitur kecil — jangan tumpuk banyak perubahan dalam satu commit

## Dependency

Jangan tambah dependency Go baru tanpa persetujuan eksplisit.

## Konvensi Kode

- No framework HTTP — stdlib `net/http` only
- Context key di `internal/ctxkey/ctxkey.go` — jangan duplikasi
- Error handler: gunakan `http.Error(w, msg, status)` — jangan custom response writer
