# go-chat — Design Document

Platform chat realtime berbasis Go, dipadukan dengan frontend Vite + React + Bun.
Tujuan: **learning project** — memahami WebSocket, goroutine, JWT, dan PostgreSQL di Go.

---

## Stack

| Komponen | Pilihan |
|---|---|
| HTTP server | `net/http` stdlib (no framework) |
| WebSocket | `github.com/gorilla/websocket` |
| Database | PostgreSQL |
| DB driver | `github.com/lib/pq` |
| Auth | JWT via `github.com/golang-jwt/jwt/v5` |
| Env config | `github.com/joho/godotenv` |
| Password | `golang.org/x/crypto/bcrypt` |

---

## Arsitektur: Hub-and-Spoke

```
HTTP request → JWT middleware → handler → repository (DB)
WS connect   → ws/handler → Hub.Register(client) → goroutine loop
WS message   → client.reader → Hub.broadcast channel → client.writer → semua member room
```

Hub adalah **single goroutine** yang menerima semua event via Go channels.
Idiomatik Go: "share memory by communicating", bukan mutex di mana-mana.

---

## Struktur Direktori

```
go-chat/
├── main.go                        # entry point, wire semua komponen
├── go.mod
├── .env                           # DB_URL, JWT_SECRET, PORT
├── docs/
│   └── design.md                  # file ini
├── internal/
│   ├── config/
│   │   └── config.go              # load env vars
│   ├── db/
│   │   └── db.go                  # koneksi PostgreSQL, run migrations
│   ├── auth/
│   │   ├── handler.go             # POST /api/auth/register, POST /api/auth/login
│   │   ├── middleware.go          # JWT validation middleware
│   │   └── service.go             # bcrypt hash, generate/verify JWT
│   ├── user/
│   │   └── repository.go          # CRUD user
│   ├── room/
│   │   ├── handler.go             # REST endpoints untuk rooms & messages
│   │   └── repository.go          # CRUD room, message history (cursor pagination)
│   └── ws/
│       ├── hub.go                 # Hub goroutine: register/unregister, broadcast, presence
│       ├── client.go              # Client: reader + writer goroutines per koneksi
│       └── handler.go             # GET /ws — upgrade HTTP → WebSocket
└── migrations/
    ├── 001_users.sql
    ├── 002_rooms.sql
    └── 003_messages.sql
```

---

## Skema Database

### users
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### rooms & room_members
```sql
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    is_dm BOOLEAN DEFAULT FALSE,   -- TRUE = direct message antara 2 user
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE room_members (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (room_id, user_id)
);
```

### messages & message_reads
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE message_reads (
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (message_id, user_id)
);

-- Index untuk query histori pesan (pagination by time)
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
```

> **Catatan:** DM dimodel sebagai room biasa dengan `is_dm=TRUE` dan 2 member — tidak perlu tabel terpisah.

---

## REST API Endpoints

Semua endpoint `/api/*` kecuali auth membutuhkan header `Authorization: Bearer <token>`.

```
POST /api/auth/register              { username, email, password } → { user, token }
POST /api/auth/login                 { email, password }           → { user, token }

GET  /api/rooms                      → list rooms yang user adalah member
POST /api/rooms                      { name }           → buat public channel
POST /api/rooms/dm                   { target_user_id } → buat/get DM room
GET  /api/rooms/:id/messages         ?before=<uuid>&limit=50 → histori pesan (cursor pagination)

GET  /api/users/me                   → profil user yang login
GET  /api/users/search               ?q=<username> → cari user

GET  /ws                             ?token=<jwt> → upgrade ke WebSocket
```

> **JWT di WebSocket** lewat query param karena browser tidak bisa set custom header pada WS upgrade request.

---

## WebSocket Protocol

Semua pesan berformat JSON.

### Client → Server

```json
{ "type": "join",    "room_id": "<uuid>" }
{ "type": "leave",   "room_id": "<uuid>" }
{ "type": "message", "room_id": "<uuid>", "content": "Halo!" }
{ "type": "read",    "room_id": "<uuid>", "message_id": "<uuid>" }
```

### Server → Client

```json
{ "type": "message",  "room_id": "<uuid>", "message": { "id": "<uuid>", "sender": { "id": "<uuid>", "username": "alice" }, "content": "Halo!", "created_at": "..." } }
{ "type": "read",     "room_id": "<uuid>", "message_id": "<uuid>", "user_id": "<uuid>" }
{ "type": "presence", "user_id": "<uuid>", "username": "alice", "status": "online" }
{ "type": "error",    "message": "not a member of this room" }
```

### Hub flow untuk event `message`
1. `client.readPump` terima JSON → parse → kirim ke `hub.broadcast` channel
2. Hub goroutine: simpan ke DB (goroutine terpisah, fire-and-forget) → fan-out ke semua `*Client` yang join room itu
3. `client.writePump` drain `send` channel → kirim ke WS conn

### Presence
- Saat client connect → Hub broadcast `{"type":"presence","status":"online"}` ke semua room member-nya
- Saat client disconnect → Hub broadcast `{"type":"presence","status":"offline"}`

---

## CORS

Backend mengizinkan origin Vite dev server:

```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

---

## Verifikasi End-to-End

1. `go run main.go` — server start tanpa error
2. `POST /api/auth/register` → dapat JWT
3. `POST /api/rooms` → dapat room ID
4. Connect 2x `wscat -c "ws://localhost:8080/ws?token=<jwt>"`
5. `{"type":"join","room_id":"<id>"}` dari keduanya
6. `{"type":"message","room_id":"<id>","content":"test"}` dari client 1 → client 2 terima broadcast
7. `GET /api/rooms/:id/messages` → histori muncul
8. Frontend Vite: `new WebSocket("ws://localhost:8080/ws?token=...")` → connect sukses
