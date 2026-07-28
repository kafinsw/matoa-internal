# Matoa Internal

Sistem pelaporan kendala outlet & dashboard manajemen untuk **MatoaGroup**.

Live: [https://matoagroup.com/internal](https://matoagroup.com/internal)

---

## Struktur Repo

```
matoa-internal/
├── frontend/          # React + Vite — form laporan kendala (mobile-first)
├── backend/           # Next.js — dashboard manajemen & API proxy
└── README.md
```

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, Vite 8, React Router 7 |
| Dashboard | Next.js 16, React 19 |
| PHP API | PHP (Docker, port 4002) |
| Database | MySQL 5.7 (Docker) |
| Server | Nginx + PM2 (Ubuntu) |

---

## Frontend (`/frontend`)

Form laporan kendala outlet — diakses teknisi ME & GA via HP.

**Fitur:**
- Pilih outlet → auto-generate Tiket Info (kode + tanggal + jam)
- Geolocation GPS otomatis
- Upload foto dengan geotag
- Step progress (Lokasi → Kategori → Kendala → Submit)
- Detect device info (Browser/Device) → kirim ke DB
- Responsive mobile-first, breakpoint 375px / 465px / 600px

**Setup dev:**
```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_BASE_URL
npm run dev
```

**Build:**
```bash
npm run build
# output → frontend/dist/
```

**Env:**
```
VITE_API_BASE_URL=/php-api
```

---

## Backend / Dashboard (`/backend`)

Dashboard Next.js untuk monitoring laporan, status tiket, SLA tracking.

**Fitur:**
- Feed laporan real-time (polling 5s)
- Filter by status, tipe (ME/GA), outlet
- SLA deadline tracking + alert over_sla
- Proxy API ke PHP Docker (`/internal/api/*` → `http://localhost:4002/php-api/*`)

**Setup dev:**
```bash
cd backend
npm install
cp .env.example .env   # set PHP_API_BASE_URL
npm run dev
# → http://localhost:3000/internal/dashboard
```

**Build:**
```bash
npm run build
pm2 restart backend-internal
```

**Env:**
```
PHP_API_BASE_URL=http://localhost:4002/php-api
```

---

## Deploy ke Server

**Full deploy (pull + backend + frontend):**
```bash
cd /home/siddiq/internal/matoa-internal && git pull && cd backend && npm run build && pm2 restart backend-internal && cd ../frontend && npm run build
```

**Frontend only:**
```bash
cd /home/siddiq/internal/matoa-internal && git pull && cd frontend && npm run build
```

**Backend only:**
```bash
cd /home/siddiq/internal/matoa-internal && git pull && cd backend && npm run build && pm2 restart backend-internal
```

**Nginx routing:**
```
/internal/     → Next.js :3000
/php-api/      → PHP Docker :4002
/              → WordPress :4001
```

---

## Status Tiket

| Status | Keterangan |
|---|---|
| `dijadwalkan` | Default, belum dikerjakan |
| `sedang_dikerjakan` | Teknisi on-site |
| `selesai_dikerjakan` | Selesai, menunggu verifikasi |
| `terverifikasi` | Verified oleh PIC |
| `tunggu_barang` | Hold, barang belum ada |
| `barang_diproses` | Barang sedang diproses |
| `barang_ready` | Barang tersedia, siap dikerjakan |
| `over_sla` | Melewati deadline SLA |

---

## Kontribusi

Branch dari `main`, PR ke `main`. Jangan push langsung ke `main`.

```bash
git checkout -b feat/nama-fitur
git push -u origin feat/nama-fitur
```
