# QWEN AI Studio — Panduan Setup

## ⚠️ Kenapa perlu proxy server?

Browser secara default **memblokir request langsung** ke server pihak ketiga
(seperti `dashscope-intl.aliyuncs.com`) karena kebijakan CORS.
Proxy server kecil ini berjalan di komputer Anda dan meneruskan request
ke Qwen API tanpa dibatasi CORS.

---

## 🖥️ Cara Menjalankan (Desktop / Laptop)

### 1. Pastikan Node.js sudah terinstall
Buka terminal/command prompt, ketik:
```
node -v
```
Jika muncul versi (misal `v18.0.0`), Node.js sudah ada.
Jika belum, download di: https://nodejs.org

### 2. Letakkan kedua file di folder yang sama
```
📁 folder-anda/
   ├── ai-studio.html
   └── proxy-server.js
```

### 3. Jalankan proxy server
Buka terminal di folder tersebut, lalu ketik:
```
node proxy-server.js
```
Anda akan melihat:
```
╔══════════════════════════════════════╗
║     QWEN AI Studio — Proxy Ready     ║
╠══════════════════════════════════════╣
║  Buka browser: http://localhost:3456  ║
╚══════════════════════════════════════╝
```

### 4. Buka di browser
Buka: **http://localhost:3456**

> Jangan tutup terminal selama menggunakan app.
> Tekan `Ctrl+C` untuk menghentikan server.

---

## 📱 Cara Akses dari HP (di jaringan WiFi yang sama)

1. Jalankan proxy di komputer seperti di atas
2. Cari IP komputer Anda:
   - Windows: `ipconfig` → cari IPv4 Address
   - Mac/Linux: `ifconfig` atau `ip addr`
3. Buka di HP: `http://192.168.x.x:3456`
   (ganti dengan IP komputer Anda)

---

## 🔧 Troubleshooting

| Masalah | Solusi |
|---|---|
| `node: command not found` | Install Node.js dari nodejs.org |
| `EADDRINUSE: port 3456` | Port sudah dipakai, edit `PORT` di proxy-server.js |
| Badge merah "PROXY OFFLINE" | Pastikan `node proxy-server.js` sudah berjalan |
| `Failed to fetch` di browser | Buka via `http://localhost:3456`, bukan buka file langsung |
| Error 401 dari API | Cek API key di ai-studio.html |

---

## 📝 Catatan

- Proxy hanya meneruskan request ke `dashscope-intl.aliyuncs.com` — aman
- API key tersimpan di file HTML, **jangan share file ini secara publik**
- Video generation membutuhkan waktu 1–5 menit, jangan tutup tab
