# go-chat Documentation

Selamat datang di dokumentasi resmi arsitektur dan teknis **go-chat**.

go-chat adalah platform chat realtime performa tinggi dengan backend berbasis **Go** dan frontend berbasis **React + Vite** yang mengusung desain **Neo-Brutalism**.

---

## Daftar Dokumentasi

| Dokumen | Deskripsi |
|---|---|
| [**Arsitektur Sistem**](architecture.md) | Desain menyeluruh sistem, model konkurensi Go (*Hub-and-Spoke*), Clean Architecture frontend, dan struktur folder. |
| [**Spesifikasi API & WebSocket**](api.md) | Daftar lengkap endpoint REST API, format otentikasi JWT, serta spesifikasi protokol event WebSocket dua arah. |
| [**Desain Database**](database.md) | Skema DDL PostgreSQL (`users`, `rooms`, `room_members`, `messages`, `message_reads`), indexing, dan sistem migrasi. |
| [**Frontend & Design System**](frontend.md) | Standar Neo-Brutalism, panduan warna & tipografi, arsitektur Zustand Store, dan penanganan transisi bebas glitch. |

---

## Ringkasan Fitur Utama

- **Realtime 1-on-1 Direct Messages:** Notifikasi instan saat DM baru dibuat, username partner teresolusi dinamis di SQL.
- **Channels & Explore:** Pemisahan Channels publik dan DMs di sidebar, modal penjelajahan room (*explore*) dan bergabung langsung (*join*).
- **Indikator Unread Realtime:** Badge jumlah pesan belum dibaca per room dan pill agregat ketika kategori tertutup (*collapsed*).
- **Batch Mark as Read:** Otomatis menandai seluruh pesan sebagai terbaca begitu room dibuka.
- **Tampilan Neo-Brutalism:** Kontras tinggi, border 2px solid, hard box-shadow 4px, font pairing Inter + JetBrains Mono.
- **Konfigurasi Fleksibel:** Bebas hardcode dengan file `.env` untuk backend dan frontend.
