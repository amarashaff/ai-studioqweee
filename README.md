# QWEN AI Studio — Vercel Deployment

App ini sudah diadaptasi untuk di-deploy ke **Vercel** via GitHub.  
Proxy server lokal (`proxy-server.js`) digantikan oleh **Vercel Serverless Function** di `/api/proxy.js`.

---

## 📁 Struktur File

```
qwen-studio/
├── index.html          ← Frontend app (tidak berubah tampilannya)
├── api/
│   └── proxy.js        ← Vercel Serverless Function (ganti proxy-server.js)
├── vercel.json         ← Konfigurasi routing Vercel
└── README.md
```

---

## 🚀 Cara Deploy ke Vercel via GitHub

### Langkah 1 — Upload ke GitHub

1. Buat repository baru di GitHub (contoh: `qwen-studio`)
2. Upload semua file ke repository tersebut:
   - `index.html`
   - `api/proxy.js`
   - `vercel.json`
   - `README.md`

Atau via terminal:
```bash
git init
git add .
git commit -m "Initial deploy"
git remote add origin https://github.com/USERNAME/qwen-studio.git
git push -u origin main
```

### Langkah 2 — Import ke Vercel

1. Buka [vercel.com](https://vercel.com) → Login
2. Klik **"Add New Project"**
3. Import repository GitHub yang sudah dibuat
4. Framework Preset: pilih **"Other"**
5. Klik **Deploy**

### Langkah 3 — Set Environment Variable ⚠️ WAJIB

Setelah deploy, API key harus diset sebagai environment variable:

1. Di Vercel Dashboard → pilih project → **Settings**
2. Klik **Environment Variables**
3. Tambahkan:
   - **Name:** `DASHSCOPE_API_KEY`
   - **Value:** `sk-75257e9a0891498197e494ff0f637f9b` (API key Anda)
   - **Environment:** Production, Preview, Development ✓ semua
4. Klik **Save**
5. Klik **Redeploy** (di tab Deployments) agar env var aktif

---

## 🔒 Keamanan

- API key **tidak** ada di dalam kode HTML lagi — aman untuk repo publik
- Serverless function hanya meneruskan request ke `dashscope-intl.aliyuncs.com`
- Host lain akan di-block (HTTP 403)

---

## 🖥️ Penggunaan Lokal (Opsional)

Jika masih ingin test di lokal, `proxy-server.js` lama tetap bisa digunakan:
```bash
node proxy-server.js
# Buka: http://localhost:3456
```

Atau install Vercel CLI untuk test serverless function secara lokal:
```bash
npm i -g vercel
vercel dev
# Buka: http://localhost:3000
```

---

## ❓ Troubleshooting

| Masalah | Solusi |
|---|---|
| Badge merah "API ERROR" | Cek env var `DASHSCOPE_API_KEY` di Vercel Settings |
| Error 401 dari API | API key salah atau expired |
| Error 403 | Host tidak diizinkan (bug di proxy) |
| Function timeout | Video generation memang lama (1-5 menit), normal |
