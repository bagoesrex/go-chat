# Desain & Skema Database

Dokumen ini memuat arsitektur database, skema relasional, optimasi indeks, serta mekanisme migrasi skema di **go-chat**.

---

## 1. Konfigurasi Database

- **DBMS:** PostgreSQL 14+
- **Driver Go:** `github.com/lib/pq`
- **Konfigurasi URL:** Diset lewat variabel lingkungan `DB_URL` di file `.env`.
- **Mekanisme Migrasi:** Otomatis dijalankan saat backend dinyalakan (`db.Migrate()`) dengan membaca berkas-berkas SQL berurutan dari direktori `backend/migrations/`.

---

## 2. Skema Relasional (DDL)

### A. Tabel `users` (`001_users.sql`)
Menyimpan identitas pengguna dan kredensial login yang telah dienkripsi dengan bcrypt.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### B. Tabel `rooms` & `room_members` (`002_rooms.sql`)
Menyimpan daftar channel publik dan ruang percakapan privat (Direct Message).

```sql
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    is_dm BOOLEAN DEFAULT FALSE,   -- TRUE = percakapan 1-on-1 privat
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

> **Prinsip Desain DM:** DM tidak memerlukan tabel terpisah. DM diperlakukan sebagai room dengan `is_dm = TRUE` yang memiliki tepat 2 anggota pada `room_members`. Nama DM ditampilkan secara dinamis di level query sesuai lawan bicara pengguna.

### C. Tabel `messages` & `message_reads` (`003_messages.sql`)
Menyimpan riwayat pesan percakapan dan tanda status pesan yang telah dibaca (*read receipts*).

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
```

---

## 3. Optimasi Indeks & Kueri

### 1. Paginasi Histori Pesan (Cursor Pagination)
```sql
CREATE INDEX idx_messages_room_created ON messages(room_id, created_at DESC);
```
Indeks komposit ini memastikan kueri histori pesan berdasarkan `room_id` dan paginasi waktu `created_at < (SELECT created_at FROM messages WHERE id = $cursor)` berjalan cepat tanpa *full table scan*.

### 2. Penghitungan Jumlah Pesan Belum Dibaca (`unread_count`)
Untuk menampilkan badge *unread* pada sidebar, query mengambil pesan yang bukan dikirim oleh user yang sedang login dan belum memiliki entri di `message_reads`:

```sql
SELECT r.id,
       CASE 
           WHEN r.is_dm = TRUE THEN COALESCE(
               (SELECT u.username FROM room_members other_rm JOIN users u ON u.id = other_rm.user_id
                WHERE other_rm.room_id = r.id AND other_rm.user_id != $1 LIMIT 1),
               r.name
           )
           ELSE r.name
       END AS name,
       r.is_dm, r.created_by, r.created_at,
       COALESCE((
           SELECT COUNT(*)
           FROM messages m
           WHERE m.room_id = r.id
             AND m.sender_id != $1
             AND NOT EXISTS (
                 SELECT 1 FROM message_reads mr 
                 WHERE mr.message_id = m.id AND mr.user_id = $1
             )
       ), 0) AS unread_count
FROM rooms r 
JOIN room_members rm ON r.id = rm.room_id
WHERE rm.user_id = $1 
ORDER BY r.created_at DESC;
```

### 3. Batch Mark as Read
Menandai seluruh pesan di suatu room sebagai telah dibaca secara idempotent:

```sql
INSERT INTO message_reads (message_id, user_id)
SELECT m.id, $2
FROM messages m
WHERE m.room_id = $1 AND m.sender_id != $2
ON CONFLICT DO NOTHING;
```
*(Menggunakan `ON CONFLICT DO NOTHING` berdasarkan `PRIMARY KEY (message_id, user_id)` untuk mencegah duplicate key error saat dipanggil berulang kali).*
