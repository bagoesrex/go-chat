# Frontend Design Document

Platform chat realtime — React + Vite + Bun, clean architecture, brutalism theme.

---

## Stack

| Komponen | Pilihan |
|---|---|
| Runtime | Bun |
| Bundler | Vite |
| Framework | React 18 |
| State | Zustand |
| Icons | Iconoir (+ custom SVG untuk ikon khusus) |
| Styling | CSS Modules + CSS custom properties (no UI library) |
| Routing | React Router v6 |

---

## Sprint Plan

### Sprint 1 — Foundation + Auth
**Deliverable:** user bisa register, login, logout. JWT tersimpan, dipakai ke semua request.

- Setup project: Vite + React + Bun + TypeScript + path alias
- Clean arch layer: entities, repositories (port), HTTP client
- Auth store (Zustand): token, currentUser, login/logout actions
- Halaman: `/login`, `/register`, redirect ke `/rooms` setelah auth
- Route guard: redirect ke `/login` jika tidak ada token

### Sprint 2 — Room List + Chat View (REST, tanpa realtime)
**Deliverable:** lihat daftar room, buka room, scroll message history, load more (pagination).

- Room store: daftar room, room aktif
- Chat store: messages per room, pagination state
- Layout: mobile stack / md+ sidebar + main area
- Halaman: `/rooms` (list), `/rooms/:id` (chat)
- Message history dari `GET /api/rooms/:id/messages` (REST, `created_at DESC` → reverse untuk render)
- Buat room baru (modal/drawer)

### Sprint 3 — Realtime (WebSocket)
**Deliverable:** kirim pesan realtime, terima broadcast, presence online/offline.

- WS service: connect, reconnect otomatis, dispatch message ke store
- Kirim `join` untuk setiap room yang dibuka
- Terima `message` → append ke chat store
- Terima `presence` → update badge online/offline
- Kirim `read` saat user scroll ke pesan terbaru
- Terima `read` → tampilkan read receipt

### Sprint 4 — DM + User Search
**Deliverable:** cari user, buat DM room, buka percakapan DM.

- Search user: `GET /api/users/search?q=`
- Buat DM: `POST /api/rooms/dm`
- DM room label: tampilkan username partner (bukan nama room `"dm"`)
- Profil sendiri: `GET /api/users/me`

---

## Clean Architecture Layers

```
┌─────────────────────────────────────────────────┐
│  Features / Pages                               │  UI layer
│  (auth/, rooms/, chat/)                         │
├─────────────────────────────────────────────────┤
│  Store (Zustand)                                │  App state
│  auth.store, room.store, chat.store             │
├─────────────────────────────────────────────────┤
│  Use Cases                                      │  Business logic
│  auth.usecase, room.usecase, message.usecase    │
├─────────────────────────────────────────────────┤
│  Repositories (port/interface)                  │  Contracts
│  auth.repository, room.repository               │
├─────────────────────────────────────────────────┤
│  Infrastructure                                 │  Adapters
│  http/client, http/*.api, ws/socket             │
├─────────────────────────────────────────────────┤
│  Entities                                       │  Pure types
│  User, Room, Message                            │
└─────────────────────────────────────────────────┘
```

**Aturan:** layer atas boleh import layer bawah, tidak sebaliknya. Store tidak import infrastructure langsung — lewat use case.

---

## Struktur Direktori

```
frontend/
├── package.json
├── vite.config.ts              (path alias: @/ → src/)
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── app.tsx                 (router root + route guard)
    │
    ├── core/
    │   ├── entities/
    │   │   └── index.ts        (User, Room, Message types)
    │   ├── repositories/
    │   │   ├── auth.repository.ts
    │   │   ├── room.repository.ts
    │   │   └── user.repository.ts
    │   └── usecases/
    │       ├── auth.usecase.ts
    │       ├── room.usecase.ts
    │       └── message.usecase.ts
    │
    ├── infrastructure/
    │   ├── http/
    │   │   ├── client.ts       (fetch wrapper + Bearer header)
    │   │   ├── auth.api.ts
    │   │   ├── room.api.ts
    │   │   └── user.api.ts
    │   └── ws/
    │       └── socket.ts       (WS connect, reconnect, dispatch)
    │
    ├── store/
    │   ├── auth.store.ts
    │   ├── room.store.ts
    │   └── chat.store.ts
    │
    ├── components/             (reusable atoms)
    │   ├── button.tsx
    │   ├── input.tsx
    │   ├── avatar.tsx
    │   └── badge.tsx
    │
    ├── features/
    │   ├── auth/
    │   │   ├── login.page.tsx
    │   │   └── register.page.tsx
    │   ├── rooms/
    │   │   ├── room-list.tsx
    │   │   └── room-item.tsx
    │   └── chat/
    │       ├── chat.page.tsx
    │       ├── message-list.tsx
    │       ├── message-bubble.tsx
    │       └── message-input.tsx
    │
    ├── icons/                  (custom SVG icons)
    │   └── logo.tsx
    │
    └── styles/
        ├── global.css          (CSS custom properties / tokens)
        └── utilities.css       (brutalism utility classes)
```

---

## Brutalism Design System

### Token (`global.css`)

```css
:root {
  --bg:        #F5F0E8;           /* off-white warm */
  --fg:        #0A0A0A;           /* near-black */
  --accent:    #FF3B30;           /* bold red */
  --accent-2:  #0057FF;           /* bold blue */
  --muted:     #888;
  --border:    2px solid #0A0A0A;
  --shadow:    4px 4px 0px #0A0A0A;
  --shadow-sm: 2px 2px 0px #0A0A0A;
  --radius:    0px;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
  --font-sans: 'Inter', system-ui, sans-serif;
}
```

### Prinsip Komponen

- Border tebal solid `#0A0A0A`
- Box shadow offset tanpa blur (`var(--shadow)`)
- Hover: `transform: translate(-2px, -2px)` + shadow membesar
- Active/Press: `transform: translate(2px, 2px)` + shadow mengecil → efek "ditekan"
- Background flat — tidak ada gradient
- Tidak ada border-radius

---

## Transitions & Animations (native CSS)

| Efek | Cara |
|---|---|
| Page transition | `View Transitions API` (`document.startViewTransition`) |
| Sidebar slide (mobile) | `transform: translateX` + `transition: 200ms ease` |
| Message masuk | `@keyframes slideUp` — class ditambah saat element mount |
| Presence badge | `transition: background-color 300ms` |
| Button hover/press | `transition: transform 100ms, box-shadow 100ms` |
| Input focus | `transition: box-shadow 150ms` |

---

## Layout & Breakpoints

```
Mobile (default):               md+ (≥768px):
┌────────────────┐              ┌──────────┬────────────────┐
│  Header        │              │          │  Header        │
├────────────────┤              │  Room    ├────────────────┤
│                │              │  List    │                │
│  Chat View     │              │ (240px)  │  Chat View     │
│  atau          │              │          │                │
│  Room List     │              │          │                │
│                │              │          │                │
├────────────────┤              └──────────┴────────────────┘
│  Bottom Nav    │
└────────────────┘
```

Mobile: satu panel aktif, navigasi bawah untuk switch.
md+: sidebar kiri tetap + main area.

---

## Backend Contract Summary (untuk referensi implementasi)

### REST

```
POST /api/auth/register   { username, email, password } → { user, token }
POST /api/auth/login      { email, password }           → { user, token }
GET  /api/users/me                                      → User
GET  /api/users/search    ?q=<str>                      → User[]
GET  /api/rooms                                         → Room[]
POST /api/rooms           { name }                      → Room (201)
POST /api/rooms/dm        { target_user_id }            → Room
GET  /api/rooms/{id}/messages  ?before=<uuid>&limit=50 → Message[]
```

Auth: `Authorization: Bearer <token>` (semua endpoint kecuali auth).

### WebSocket: `GET /ws?token=<jwt>`

Client → Server:
```json
{ "type": "join",    "room_id": "..." }
{ "type": "leave",   "room_id": "..." }
{ "type": "message", "room_id": "...", "content": "..." }
{ "type": "read",    "room_id": "...", "message_id": "..." }
```

Server → Client:
```json
{ "type": "message",  "room_id": "...", "message": Message }
{ "type": "read",     "room_id": "...", "message_id": "...", "user_id": "..." }
{ "type": "presence", "user_id": "...", "username": "...", "status": "online|offline" }
{ "type": "error",    "message": "..." }
```

**Catatan penting:**
- `GET /api/rooms/{id}/messages` → hasil `created_at DESC` (newest first) — frontend perlu reverse sebelum render
- Wajib kirim `join` sebelum bisa terima atau kirim message di sebuah room
- DM room selalu bernama `"dm"` — gunakan `is_dm: true` + username partner untuk label
- WS hanya allow origin `http://localhost:5173`
