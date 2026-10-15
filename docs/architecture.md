# Arsitektur Sistem go-chat

Dokumen ini menjelaskan arsitektur tingkat tinggi dari **go-chat**, mencakup model konkurensi backend berbasis Go goroutines/channels serta penerapan *Clean Architecture* pada frontend React.

---

## 1. Desain Arsitektur Keseluruhan

Sistem go-chat mengadopsi model *client-server hybrid* (REST API untuk operasi transaksional/data historis, dan WebSocket untuk komunikasi dua arah secara *realtime*).

```
                      ┌──────────────────────────────────────────┐
                      │             React Frontend               │
                      │  (Zustand Stores + WebSocket Service)    │
                      └─────────────┬──────────────────┬─────────┘
                                    │                  │
                         HTTP REST  │                  │  WebSocket
                     (JWT Bearer)   │                  │  (?token=JWT)
                                    ▼                  ▼
                      ┌──────────────────────────────────────────┐
                      │             Go Backend                   │
                      │ ┌────────────────┐    ┌────────────────┐ │
                      │ │ REST Handlers  │    │  WebSocket Hub │ │
                      │ └───────┬────────┘    └───────┬────────┘ │
                      └─────────┼─────────────────────┼──────────┘
                                │                     │
                                └──────────┬──────────┘
                                           ▼
                               ┌──────────────────────┐
                               │  PostgreSQL Database │
                               └──────────────────────┘
```

---

## 2. Backend: Model Konkurensi Hub-and-Spoke

Alih-alih menyebarkan *mutex lock* di berbagai handler, backend mengimplementasikan prinsip Go: **"Do not communicate by sharing memory; instead, share memory by communicating"**.

### Struktur Komponen Hub (`backend/internal/ws/hub.go`)

`Hub` berjalan sebagai **single central goroutine** (`hub.Run()`) yang mengatur seluruh siklus hidup koneksi WebSocket melalui buffered Go channels:

```go
type Hub struct {
    clients          map[*Client]bool            // Semua koneksi aktif
    userClients      map[string]map[*Client]bool // userID -> set of clients (multi-tab support)
    rooms            map[string]map[*Client]bool // roomID -> set of clients
    Register         chan *Client
    Unregister       chan *Client
    Broadcast        chan broadcastMsg           // Broadcast ke room tertentu
    BroadcastMembers chan memberBroadcastMsg     // Broadcast ke seluruh anggota room di background
    SendUser         chan userMsg                // Kirim event privat ke user tertentu
    roomRepo         *room.Repository
}
```

### Alur Pesan & Notifikasi

1. **Pengiriman Pesan Chat:**
   - Klien mengirim payload `{"type": "chat", "room_id": "...", "content": "..."}` via WebSocket.
   - `client.ReadPump()` memvalidasi membership dan memanggil `hub.SaveMessageAsync()`.
   - Penyimpanan ke PostgreSQL dijalankan dalam goroutine terpisah (*fire-and-forget* non-blocking).
   - Hub memanggil `BroadcastMembers`: seluruh perangkat/tab aktif milik anggota room akan menerima payload pesan, memicu penambahan jumlah unread secara *realtime* bagi anggota yang sedang tidak membuka room tersebut.

2. **Notifikasi Pembuatan Direct Message (DM):**
   - User memanggil endpoint `POST /api/rooms/dm`.
   - Handler membuat atau mengambil room DM yang ada, lalu memanggil `hub.SendToUser(targetUserID, payload)`.
   - Event `room_created` terkirim langsung ke koneksi target user sehingga daftar DM di layarnya bertambah tanpa perlu refresh.

3. **Client Read & Write Pumps:**
   - Setiap koneksi memiliki dua goroutine: `ReadPump` (membaca pesan dari koneksi WS) dan `WritePump` (menulis pesan dari buffered channel `c.send` ke socket dengan batas waktu deadline).

---

## 3. Frontend: Clean Architecture

Frontend React dibangun dengan arsitektur berlapis (*layered architecture*) yang memisahkan aturan bisnis, akses data, dan antarmuka pengguna:

```
┌────────────────────────────────────────────────────────┐
│  Features & UI Components (Pages, Modals, Forms)       │
├────────────────────────────────────────────────────────┤
│  Zustand Stores (auth.store, room.store, chat.store)   │
├────────────────────────────────────────────────────────┤
│  Use Cases (auth.usecase, room.usecase)                │
├────────────────────────────────────────────────────────┤
│  Repository Interfaces (auth, room, user contracts)    │
├────────────────────────────────────────────────────────┤
│  Infrastructure (HTTP fetch client, WebSocket service) │
├────────────────────────────────────────────────────────┤
│  Core Entities (User, Room, Message, ExploreRoom)      │
└────────────────────────────────────────────────────────┘
```

### Aturan Arsitektur:
- **Dependency Inversion:** Lapisan UI dan Store tidak bergantung langsung pada implementasi jaringan (`fetch`/`WebSocket`), melainkan melalui Use Cases dan Repositories.
- **Single Source of Truth:** Status autentikasi, daftar room aktif, pesan chat, dan badge unread dikelola oleh Zustand store terpisah yang reaktif.
- **Persistent Shell:** Layout halaman otentikasi (`AuthLayout`) dan workspace chat (`RoomsLayout`) memisahkan container tetap dan area konten dinamis (`<Outlet />`) untuk menjaga stabilitas visual.

---

## 4. Struktur Direktori Proyek

```
go-chat/
├── backend/
│   ├── cmd/ atau main.go          # Entry point & inisialisasi routing HTTP/WS
│   ├── go.mod & go.sum
│   ├── .env.example               # Template environment variables
│   ├── migrations/                # Skema migrasi SQL (001_*, 002_*, 003_*)
│   └── internal/
│       ├── auth/                  # JWT auth, hashing bcrypt, middleware
│       ├── config/                # Parsing variabel lingkungan (.env)
│       ├── ctxkey/                # Context keys untuk request context
│       ├── db/                    # Inisialisasi pool PostgreSQL & auto-migration
│       ├── room/                  # Repository & HTTP handlers room, DM, explore, pesan
│       ├── user/                  # Repository & HTTP handlers profil & pencarian user
│       └── ws/                    # WebSocket Hub, Client pumps, dan upgrade handler
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts             # Konfigurasi Vite & path alias (@/ -> src/)
│   ├── .env.example               # Template env variable frontend (API & WS URLs)
│   └── src/
│       ├── app/                   # App root, React Router, guards autentikasi
│       ├── components/            # Komponen UI primitif kustom (Button, Input)
│       ├── core/                  # Entities, repositori port, dan use cases
│       ├── features/              # UI feature-driven
│       │   ├── auth/              # Halaman Login, Register, dan AuthLayout
│       │   ├── chat/              # ChatPage, MessageList, MessageInput, MessageBubble
│       │   └── rooms/             # Sidebar RoomList, RoomItem, ExploreModal, UserSearch
│       ├── icons/                 # SVG logo & ikon kustom
│       ├── infrastructure/        # HTTP fetch client & WebSocket client
│       ├── store/                 # Zustand state stores (auth, room, chat)
│       └── styles/                # global.css & variabel Neo-Brutalism tokens
│
└── docs/                          # Dokumentasi arsitektur, API, DB, dan frontend
```
