# Spesifikasi REST API & WebSocket Protocol

Dokumen ini mendefinisikan seluruh antarmuka HTTP REST API dan protokol WebSocket yang tersedia di **go-chat**.

---

## 1. Konvensi Umum

- **Base URL REST:** `http://localhost:8080` (dapat disesuaikan via `VITE_API_URL` dan `PORT`)
- **Base URL WebSocket:** `ws://localhost:8080/ws` (dapat disesuaikan via `VITE_WS_URL`)
- **Format Pertukaran Data:** JSON (`Content-Type: application/json; charset=utf-8`)
- **Autentikasi REST:** Header HTTP `Authorization: Bearer <jwt_token>` (wajib untuk seluruh endpoint kecuali `/api/auth/*`)
- **Autentikasi WebSocket:** Query parameter `?token=<jwt_token>` pada request handshake koneksi awal.

---

## 2. Endpoint REST API

### A. Autentikasi (`/api/auth`)

#### 1. Registrasi Akun Baru
- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Request Body:**
  ```json
  {
    "username": "alice",
    "email": "alice@example.com",
    "password": "secretpassword"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "user": {
      "id": "c1f7b822-1234-4b95-a123-abcdef123456",
      "username": "alice",
      "email": "alice@example.com",
      "created_at": "2026-10-15T10:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: Format JSON tidak valid atau field kosong.
  - `409 Conflict`: Username atau email telah digunakan.

#### 2. Login
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Request Body:**
  ```json
  {
    "email": "alice@example.com",
    "password": "secretpassword"
  }
  ```
- **Response (200 OK):** Sama dengan response registrasi.
- **Error Responses:**
  - `401 Unauthorized`: Email atau password salah.

---

### B. Pengguna (`/api/users`)

#### 1. Profil Pengguna Saat Ini
- **Method:** `GET`
- **Path:** `/api/users/me`
- **Response (200 OK):**
  ```json
  {
    "id": "c1f7b822-1234-4b95-a123-abcdef123456",
    "username": "alice",
    "email": "alice@example.com",
    "created_at": "2026-10-15T10:00:00Z"
  }
  ```

#### 2. Pencarian Pengguna
- **Method:** `GET`
- **Path:** `/api/users/search?q=bob`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "d2e8c933-5678-4c86-b234-fedcba654321",
      "username": "bob",
      "email": "bob@example.com",
      "created_at": "2026-10-15T10:05:00Z"
    }
  ]
  ```

---

### C. Rooms & Channels (`/api/rooms`)

#### 1. Daftar Room Pengguna (Channels & DMs)
Mengambil semua room di mana user adalah anggotanya, lengkap dengan kalkulasi jumlah pesan belum dibaca (`unread_count`).
- **Method:** `GET`
- **Path:** `/api/rooms`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "e3f9d044-9012-4d77-c345-0987654321fe",
      "name": "general",
      "is_dm": false,
      "created_by": "c1f7b822-1234-4b95-a123-abcdef123456",
      "created_at": "2026-10-15T10:10:00Z",
      "unread_count": 0
    },
    {
      "id": "f4a0e155-3456-4e88-d456-1098765432ba",
      "name": "bob",
      "is_dm": true,
      "created_by": "c1f7b822-1234-4b95-a123-abcdef123456",
      "created_at": "2026-10-15T10:15:00Z",
      "unread_count": 3
    }
  ]
  ```
  *(Catatan: Untuk DM, backend otomatis meresolusi nama room menjadi username partner bicara).*

#### 2. Membuat Public Channel Baru
- **Method:** `POST`
- **Path:** `/api/rooms`
- **Request Body:**
  ```json
  { "name": "backend-dev" }
  ```
- **Response (200 OK):** Objek `Room` yang baru dibuat.

#### 3. Membuat atau Mengambil Room DM
- **Method:** `POST`
- **Path:** `/api/rooms/dm`
- **Request Body:**
  ```json
  { "target_user_id": "d2e8c933-5678-4c86-b234-fedcba654321" }
  ```
- **Response (200 OK):** Objek `Room` DM. Jika DM belum pernah ada, backend otomatis mengirimkan event WebSocket `room_created` ke target user secara realtime.

#### 4. Menjelajahi Public Rooms (Explore)
- **Method:** `GET`
- **Path:** `/api/rooms/explore`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "e3f9d044-9012-4d77-c345-0987654321fe",
      "name": "general",
      "created_by": "c1f7b822-1234-4b95-a123-abcdef123456",
      "created_at": "2026-10-15T10:10:00Z",
      "member_count": 12,
      "is_joined": true
    },
    {
      "id": "a1b2c3d4-0000-4000-8000-111122223333",
      "name": "design-system",
      "created_by": "d2e8c933-5678-4c86-b234-fedcba654321",
      "created_at": "2026-10-15T10:20:00Z",
      "member_count": 4,
      "is_joined": false
    }
  ]
  ```

#### 5. Bergabung ke Public Room
- **Method:** `POST`
- **Path:** `/api/rooms/{id}/join`
- **Response (200 OK):** Objek `Room` yang berhasil digabungi.

#### 6. Menandai Room Telah Terbaca (Batch Mark as Read)
Menandai semua pesan di room tersebut sebagai telah terbaca oleh user yang memanggil.
- **Method:** `POST`
- **Path:** `/api/rooms/{id}/read`
- **Response (204 No Content)**

#### 7. Histori Pesan Chat (Cursor Pagination)
- **Method:** `GET`
- **Path:** `/api/rooms/{id}/messages?before=<message_id>&limit=50`
- **Query Params:**
  - `before` (opsional): ID pesan untuk paginasi mundur ke masa lalu.
  - `limit` (opsional, default: `50`): Jumlah maksimum pesan per halaman.
- **Response (200 OK):**
  ```json
  [
    {
      "id": "11111111-2222-3333-4444-555555555555",
      "room_id": "e3f9d044-9012-4d77-c345-0987654321fe",
      "sender": {
        "id": "d2e8c933-5678-4c86-b234-fedcba654321",
        "username": "bob",
        "email": "bob@example.com",
        "created_at": "2026-10-15T10:05:00Z"
      },
      "content": "Halo semua!",
      "created_at": "2026-10-15T10:30:00Z"
    }
  ]
  ```

---

## 3. Protokol WebSocket

- **Handshake Endpoint:** `GET /ws?token=<jwt_token>`
- **Format Frame:** JSON teks.

### A. Pesan Klien → Server

| Tipe Event | Payload | Keterangan |
|---|---|---|
| `join` | `{"type": "join", "room_id": "<uuid>"}` | Masuk ke antrian broadcast aktif room tertentu saat membuka tab chat. |
| `leave` | `{"type": "leave", "room_id": "<uuid>"}` | Keluar dari antrian broadcast aktif room saat berpindah chat. |
| `chat` | `{"type": "chat", "room_id": "<uuid>", "content": "Pesan..."}` | Mengirim pesan ke dalam room. |
| `read` | `{"type": "read", "room_id": "<uuid>", "message_id": "<uuid>"}` | Menandai pesan spesifik telah dibaca (read receipt). |

### B. Pesan Server → Klien

#### 1. Pesan Baru Masuk (`message`)
```json
{
  "type": "message",
  "room_id": "e3f9d044-9012-4d77-c345-0987654321fe",
  "message": {
    "id": "11111111-2222-3333-4444-555555555555",
    "room_id": "e3f9d044-9012-4d77-c345-0987654321fe",
    "sender": {
      "id": "d2e8c933-5678-4c86-b234-fedcba654321",
      "username": "bob",
      "email": "bob@example.com",
      "created_at": "2026-10-15T10:05:00Z"
    },
    "content": "Halo dunia!",
    "created_at": "2026-10-15T10:35:00Z"
  }
}
```

#### 2. Notifikasi Room Baru / Realtime DM (`room_created`)
Dikirimkan secara spesifik ke target user ketika ada room DM baru yang dibuat oleh partner bicara.
```json
{
  "type": "room_created",
  "room": {
    "id": "f4a0e155-3456-4e88-d456-1098765432ba",
    "name": "alice",
    "is_dm": true,
    "created_by": "c1f7b822-1234-4b95-a123-abcdef123456",
    "created_at": "2026-10-15T10:36:00Z",
    "unread_count": 0
  }
}
```

#### 3. Status Kehadiran (`presence`)
```json
{
  "type": "presence",
  "user_id": "d2e8c933-5678-4c86-b234-fedcba654321",
  "username": "bob",
  "status": "online"
}
```
*(Status bernilai `"online"` saat terhubung, atau `"offline"` saat koneksi terputus).*

#### 4. Tanda Pesan Terbaca (`read`)
```json
{
  "type": "read",
  "room_id": "e3f9d044-9012-4d77-c345-0987654321fe",
  "message_id": "11111111-2222-3333-4444-555555555555",
  "user_id": "c1f7b822-1234-4b95-a123-abcdef123456"
}
```

#### 5. Pesan Error (`error`)
```json
{
  "type": "error",
  "message": "not a member of this room"
}
```
