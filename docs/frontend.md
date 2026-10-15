# Frontend & Design System

Dokumen ini menjelaskan implementasi antarmuka pengguna (UI), sistem desain **Neo-Brutalism**, manajemen state dengan Zustand, serta strategi transisi visual di **go-chat**.

---

## 1. Sistem Desain: Neo-Brutalism (Light Mode)

go-chat menerapkan gaya visual **Neo-Brutalism** murni yang mengutamakan kontras tinggi, garis struktural tegas, bayangan fisik (*hard drop shadows*), dan tidak menggunakan komponen bawaan library generik (no shadcn/MUI).

### Design Tokens (`frontend/src/styles/global.css`)

```css
:root {
  --bg:           #F7F4EE;            /* Krem netral bertekstur titik */
  --surface:      #FFFFFF;            /* Putih kartu utama */
  --surface-alt:  #EFE9DE;            /* Krem kontras untuk hover & badge */
  --fg:           #0D0D0D;            /* Hitam pekat untuk teks & border */
  --accent:       #FF3333;            /* Merah tegas untuk unread & status penting */
  --accent-2:     #0052FF;            /* Biru elektrik untuk status aktif & highlight */
  --accent-green: #10B981;            /* Hijau neon untuk status online */
  --muted:        #64748B;            /* Abu-abu teks sekunder */

  --border:       2px solid #0D0D0D;  /* Border hitam tebal standar */
  --border-sm:    1.5px solid #0D0D0D;/* Border elemen kecil */
  --shadow:       4px 4px 0px #0D0D0D;/* Hard drop-shadow standar */
  --shadow-sm:    2px 2px 0px #0D0D0D;/* Hard drop-shadow tombol kecil & input */
  --radius:       0px;                /* Nol border radius untuk kesan tegas */

  --font-sans:    'Inter', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
}
```

### Tipografi Dual-Font
- **`Inter`:** Digunakan untuk elemen teks yang membutuhkan keterbacaan tinggi (*high legibility*), seperti isi pesan percakapan, paragraf, dan label tombol.
- **`JetBrains Mono`:** Digunakan untuk semua atribut teknis/metadata: nama pengguna (`@username`), saluran (`#channel`), badge unread, timestamp, status badge, dan label form.

---

## 2. Arsitektur State Management (Zustand)

State aplikasi dibagi menjadi 3 modul store terisolasi di direktori `src/store/`:

### A. `auth.store.ts`
- Menyimpan status autentikasi: `token`, `user`, dan `loading`.
- Menyimpan token ke `localStorage` dan menyinkronkan koneksi WebSocket saat user login/logout.

### B. `room.store.ts`
- Menyimpan daftar `rooms: Room[]` dan `activeRoomId: string | null`.
- Menangani pembaruan realtime:
  - `upsertRoom(room)`: Menyisipkan atau memperbarui room baru (misal saat menerima event `room_created`).
  - `incrementUnread(roomId)`: Menambahkan +1 ke `unread_count` ketika pesan masuk untuk room yang tidak sedang aktif.
  - `clearUnread(roomId)`: Mereset `unread_count` menjadi `0` begitu pengguna membuka room terkait.

### C. `chat.store.ts`
- Menyimpan riwayat pesan per room: `messages: Record<string, Message[]>`.
- Menangani paginasi cursor (`fetchMessages`) dan penambahan pesan baru instan (`appendMessage`) dari socket broadcast.

---

## 3. Desain Layout & Transisi Bebas Glitch

### A. Persistent `AuthLayout` (`frontend/src/features/auth/auth.layout.tsx`)
Untuk mencegah *layout shift*, hilangnya bayangan kartu (*drop-shadow clipping*), dan efek *fade-in* yang mengganggu saat user berpindah antara halaman `/login` dan `/register`:
- Komponen pembungkus `.page`, `.card`, dan `.brand` dibuat persisten di `AuthLayout`.
- Konten formulir (`<Outlet />`) berganti seketika di dalam frame kartu tanpa me-remount kartu utama.
- Bayangan kartu `4px 4px 0px #0D0D0D` tetap menempel stabil 100% tanpa ada frame yang terpotong.

### B. Scoped View Transitions pada Chat Viewport
- Transisi saat berpindah antar channel/DM **hanya diisolasi pada area viewport pesan** (`chat.module.css` via keyframe `chatEntrance`).
- Sidebar, header navigasi, dan input box tetap statis dan tidak dirender ulang sehingga interaksi mengetik tidak terputus.

### C. Transisi Smooth Error Banner
- Kotak pesan error form dibungkus menggunakan CSS Grid transisi:
  ```css
  .errorWrapper {
    display: grid;
    grid-template-rows: 0fr;
    opacity: 0;
    margin-top: -1.1rem;
    transition: grid-template-rows 180ms cubic-bezier(0.16, 1, 0.3, 1),
                opacity 140ms ease,
                margin-top 180ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .errorWrapper.errorVisible {
    grid-template-rows: 1fr;
    opacity: 1;
    margin-top: 0;
  }
  ```
- Tombol submit meluncur secara halus (*smooth glide*) ke bawah tanpa menyebabkan elemen di atasnya melompat secara kasar.

---

## 4. Alur Sinkronisasi WebSocket di Klien (`socket.ts`)

1. **Auto-connect & Reconnect:** Klien otomatis terhubung saat `auth.store` memiliki token valid dan melakukan auto-reconnect jika koneksi internet terputus.
2. **Kategori Aktif & Unread Tracking:**
   ```ts
   if (data.type === 'message') {
     useChatStore.getState().appendMessage(data.room_id, data.message)
     const currentActive = useRoomStore.getState().activeRoomId
     const currentUserId = useAuthStore.getState().user?.id
     if (data.room_id !== currentActive && data.message.sender.id !== currentUserId) {
       useRoomStore.getState().incrementUnread(data.room_id)
     }
   }
   ```
3. **Pembersihan Unread:** Saat komponen `ChatPage` aktif:
   ```ts
   useRoomStore.getState().setActive(id)
   useRoomStore.getState().clearUnread(id)
   roomApi.markAsRead(id).catch(() => {})
   ```
