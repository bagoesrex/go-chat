# go-chat — Claude Instructions

## Project Layout

```
go-chat/
├── backend/    # Go API — semua perintah Go dijalankan dari sini
├── frontend/   # Vite + React + Bun — semua perintah Bun dijalankan dari sini
└── docs/
    ├── design.md           # backend architecture
    └── frontend-design.md  # frontend sprint plan + design system
```

## Perintah Backend

Selalu jalankan dari dalam `backend/`:

```bash
cd backend
go build ./...
go test ./...
go run main.go
```

## Perintah Frontend

Selalu jalankan dari dalam `frontend/`:

```bash
cd frontend
bun install
bun run dev
bun run build
```

Path alias: `@/` → `src/` (dikonfigurasi di `vite.config.ts`).

## Commit

- Semantic commit: `feat(scope):`, `fix(scope):`, `chore:`, `docs:`, `refactor:`, `test:`
- Tanpa body, tanpa footer, tanpa `Co-authored-by`
- Commit per task/fitur kecil — jangan tumpuk banyak perubahan dalam satu commit

## Dependency

- Go: jangan tambah dependency baru tanpa persetujuan eksplisit
- Frontend: jangan tambah library UI (no shadcn, no MUI, no Chakra) — komponen dibuat sendiri
- Icon: gunakan Iconoir; untuk ikon custom buat SVG di `src/icons/`

## Konvensi Kode

### Backend
- No framework HTTP — stdlib `net/http` only
- Context key di `internal/ctxkey/ctxkey.go` — jangan duplikasi
- Error handler: gunakan `http.Error(w, msg, status)` — jangan custom response writer

### Frontend
- Clean architecture: entities → repositories → usecases → store → features
- Layer bawah tidak boleh import layer atas
- Store tidak import infrastructure langsung — lewat use case
- Styling: CSS Modules + CSS custom properties — tidak ada inline style untuk layout
- Transitions: native CSS / View Transitions API — tidak ada animation library
- Mobile-first: default mobile, `@media (min-width: 768px)` untuk md+
