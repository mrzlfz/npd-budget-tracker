
# PRD — Aplikasi Nota Pencairan Dana (NPD) & Pelacakan Realisasi/Kinerja RKA
*(Versi: 1.0 • Tanggal: 28 Okt 2025 • Zona Waktu: Asia/Jakarta)*

## 0. Ringkasan
Aplikasi web multi-tenant untuk OPD/SKPD yang memungkinkan:
- Membuat **Nota Pencairan Dana (NPD)** dari **RKA Sub Kegiatan** (akun belanja 5.xx) sekaligus validasi pagu→realisasi→sisa.
- Mengaitkan **SPM/SP2D** untuk mengakumulasi realisasi keuangan.
- Melacak **kinerja** (output/hasil) per sub kegiatan sesuai indikator RKA, dengan unggah bukti.
- Dashboard real-time **Realisasi vs Pagu**, status NPD, dan capaian kinerja.

## 1. Sasaran Produk
- **Akurat**: Menjamin NPD tidak melebihi sisa pagu akun.
- **Transparan**: Riwayat status dan audit setiap perubahan.
- **Real-time**: Data berubah langsung tercermin di UI.
- **Siap audit**: Dokumen NPD PDF + lampiran rapi, referensi SP2D terekam.

### 1.1 Non-Sasaran (v1)
- Integrasi langsung ke SIPD/BUD (hanya referensi & impor manual/CSV).
- Modul akuntansi penuh (jurnal, neraca) di luar cakupan.

## 2. Persona & Peran
- **Admin OPD**: Kelola organisasi, pengguna, peran, template dokumen.
- **PPTK/PPK**: Buat & ajukan NPD, unggah lampiran, isi log kinerja.
- **Bendahara Pengeluaran**: Verifikasi, finalisasi NPD; input SPM/SP2D.
- **Verifikator Internal**: Cek kelengkapan & kepatuhan NPD.
- **Auditor/Viewer**: Baca & unduh laporan, tanpa ubah data.

## 3. Lingkup & Use Case Utama
1) **RKA Explorer** — Jelajah hirarki Program → Kegiatan → Sub Kegiatan → Akun (5.xx).  
2) **NPD Builder** — Buat NPD (UP/GU/TU/LS) dari akun-akun sub kegiatan + lampiran.  
3) **Verifikasi & Finalisasi** — Alur status Draft → Diajukan → Diverifikasi → Final (terkunci).  
4) **SPM/SP2D & Realisasi** — Rekam SPM/SP2D, otomatis update realisasi akun.  
5) **Kinerja** — Catat realisasi indikator, unggah bukti; lacak % capaian.  
6) **Dashboard & Laporan** — Realisasi vs Pagu, status NPD, capaian indikator; ekspor PDF/CSV.  

## 4. User Stories (dikelompokkan per epik)

### Epik A — Auth, Organisasi & RBAC
- **A1** — *Sebagai Admin*, saya ingin membuat **Organisasi (OPD)** dan mengundang pengguna agar data terisolasi per OPD.  
  **AC**: Create/Invite OK; anggota OPD hanya lihat data org-nya; pergantian org di UI.  
- **A2** — *Sebagai Admin*, saya ingin menetapkan **role** (admin, pptk, bendahara, verifikator, viewer) agar akses sesuai tugas.  
  **AC**: Middleware memblokir akses rute/aksi yang tidak berwenang; log audit role changes.

### Epik B — RKA & Indikator
- **B1** — *Sebagai Admin/PPTK*, saya ingin **impor/entri RKA** (program/kegiatan/subkegiatan/akun 5.xx, pagu, indikator) agar menjadi sumber NPD.  
  **AC**: Struktur RKA tersimpan; akun memiliki `paguTahun`; indikator memiliki target & satuan.  
- **B2** — *Sebagai PPTK*, saya ingin melihat **sisa pagu per akun** secara real-time saat menyusun NPD.  
  **AC**: Tabel menampilkan pagu, realisasi, sisa; peringatan jika melebihi sisa.

### Epik C — NPD Builder & Validasi
- **C1** — *Sebagai PPTK*, saya ingin membuat **NPD** (UP/GU/TU/LS) dari beberapa akun sehingga dapat mencairkan dana sesuai kebutuhan.  
  **AC**: Nomor NPD unik per OPD/tahun; baris akun menyertakan uraian & jumlah; total ≤ sisa.  
- **C2** — *Sebagai PPTK*, saya ingin **mengunggah lampiran** (RAB/BAST/Kontrak, dll) sesuai SOP.  
  **AC**: Jenis lampiran wajib per jenis NPD terperiksa; tidak bisa submit tanpa lampiran minimum.  
- **C3** — *Sebagai PPTK*, saya ingin **preview & ekspor PDF NPD**.  
  **AC**: PDF mencantumkan OPD, nomor/tanggal, rincian akun, total, paraf/ttd tempat.

### Epik D — Alur Verifikasi & Finalisasi
- **D1** — *Sebagai PPTK*, saya ingin **mengajukan** NPD (Draft → Diajukan) agar masuk antrean verifikasi.  
  **AC**: Status berubah; notifikasi ke bendahara/verifikator.  
- **D2** — *Sebagai Verifikator/Bendahara*, saya ingin **memverifikasi** kelengkapan & pagu.  
  **AC**: Checklist lampiran; catatan verifikasi; status → Diverifikasi.  
- **D3** — *Sebagai Bendahara*, saya ingin **memfinalisasi** NPD sehingga terkunci dari perubahan.  
  **AC**: Status Final; aksi edit terblok; audit log tercatat.

### Epik E — SPM/SP2D & Realisasi
- **E1** — *Sebagai Bendahara*, saya ingin menambahkan **nomor/tanggal SP2D & nilai cair** agar realisasi tercatat.  
  **AC**: Realisasi otomatis terdistribusi ke akun-akun NPD; dashboard terbarui.  
- **E2** — *Sebagai Auditor/Viewer*, saya ingin melihat **riwayat pencairan** per akun dan per NPD.  
  **AC**: Tabel histori SP2D dengan filter tanggal/jenis NPD.

### Epik F — Kinerja (Indikator)
- **F1** — *Sebagai PPTK*, saya ingin mencatat **realisasi indikator** (output/hasil) dan unggah bukti.  
  **AC**: % capaian = realisasi/target; tautan bukti dapat diunduh.  
- **F2** — *Sebagai Pimpinan*, saya ingin melihat **ringkasan capaian** per sub kegiatan & periode (TW/bulan).  
  **AC**: Grafik/tren indikator; filter periode.

### Epik G — Dashboard, Laporan & Audit
- **G1** — *Sebagai Pimpinan*, saya ingin **Dashboard** Realisasi vs Pagu per sub kegiatan/akun.  
  **AC**: Grafik Recharts responsif, kartu KPI; filter tahun & sumber dana.  
- **G2** — *Sebagai Admin*, saya ingin **audit log** untuk setiap perubahan status/data.  
  **AC**: Tabel audit (siapa, apa, kapan, sebelum/sesudah); ekspor CSV.

## 5. Persyaratan Fungsional
1. Nomor NPD **unik** per organisasi & tahun.  
2. Validasi **pagu vs realisasi** per akun; tolak jika melebihi **sisa**.  
3. Status flow **Draft → Diajukan → Diverifikasi → Final**; hanya role tertentu yang boleh transisi.  
4. **SPM/SP2D** menambah agregasi realisasi; perubahan bersifat audit-able.  
5. **PDF NPD** sesuai template yang dapat dikonfigurasi per OPD.  
6. **Lampiran** tersimpan dengan metadata (jenis, checksum).  
7. **Zona waktu**: Asia/Jakarta; **mata uang**: IDR.

## 6. Persyaratan Non-Fungsional
- **Kinerja**: Rendering < 200ms untuk tabel 100 baris; chart < 500ms.  
- **Reaktivitas**: Update UI < 1s setelah commit data.  
- **Keamanan**: RBAC ketat; audit log immutable; TTL sesi sesuai kebijakan.  
- **Reliability**: Target 99.9% uptime; backup & restore tersedia.  
- **Aksesibilitas**: Kontras & keyboard navigation memadai (WCAG AA).

## 7. Arsitektur & Stack
- **UI**: Next.js 15 (App Router) + React 19 + Mantine 8 + Recharts 3.  
- **State**: Redux Toolkit (state UI) + TanStack Query v5 (server state) + React Hook Form v7 + Zod.  
- **Backend**: Convex (DB realtime, queries/mutations/actions).  
- **Auth**: Clerk (Organizations, sessions, social login).  
- **API**: Hono (route API & render PDF).  
- **Konfigurasi**: T3 Env (env typesafe).

### 7.1 Model Data (koleksi utama)
- `orgs(clerkOrgId, name, kodeOpd)`  
- `users(clerkUserId, orgId, roles[])`  
- `rka_programs(orgId, kode, nama)` → `rka_kegiatans` → `rka_subkegiatans` (indikator[])  
- `rka_accounts(orgId, subKegId, kode, uraian, paguTahun)`  
- `npd_headers(orgId, subKegId, jenis, nomor, tanggal, status, tahun, createdBy, catatan?)`  
- `npd_lines(npdId, accountId, uraian, jumlah)`  
- `sp2d_refs(npdId, noSPM?, noSP2D, tglSP2D, nilaiCair)`  
- `realizations(accountId, totalCair)`  
- `performance_logs(subKegId, indikatorNama, target, realisasi, satuan, periode, buktiURL?, keterangan?)`  
- `attachments(npdId, jenis, url, checksum?)`  
- `audit_logs(orgId, actorUserId, action, entity{table,id}, before?, after?, at)`

### 7.2 Indeks Penting
- `npd_headers`: by_org_status, by_org_tahun, by_org_nomor  
- `npd_lines`: by_npd  
- `realizations`: by_account  
- `rka_*`: by_org, by_org_kode/by_subkeg, dll.  
- `performance_logs`: by_subkeg + search index `keterangan`

### 7.3 API (Hono) — contoh
- `POST /api/npd/:id/pdf` → render & kembalikan PDF.  
- `GET /api/reports/realisasi?tahun=2025` → rekap realisasi per sub kegiatan/akun.  
- `POST /api/import/rka` → impor CSV/XLSX (queued action).

## 8. UI & Navigasi (wireframe high-level)
- **Dashboard**: Kartu KPI, BarChart LineChart (Recharts), filter tahun/OPD.  
- **RKA Explorer**: Tabel hierarki; detail sub kegiatan (indikator, pagu, akun).  
- **NPD Builder**: Form (RHF + Zod), tabel baris akun, hitung sisa pagu realtime, lampiran, preview PDF.  
- **Verifikasi**: Daftar NPD diajukan; panel cek kelengkapan; tombol Final.  
- **SP2D**: Form SPM/SP2D; histori realisasi.  
- **Kinerja**: Form log indikator; tabel capaian; bukti.  
- **Pengaturan**: Template PDF, role, organisasi.

## 9. Validasi & Aturan Bisnis
- Total `npd_lines.jumlah` untuk setiap accountId pada NPD ≤ **sisa pagu** akun.  
- NPD **Final** → read-only; pembatalan hanya oleh Admin via prosedur khusus.  
- Lampiran **wajib** per jenis NPD (konfigurabel).  
- `SP2D.nilaiCair` didistribusi proporsional ke `npd_lines` saat update `realizations`.  
- Audit log pada create/submit/verify/finalize/edit.

## 10. Laporan & Ekspor
- **PDF NPD** per dokumen.  
- **CSV rekap** realisasi per akun/periode; **CSV audit log**.  
- **PDF Laporan** realisasi & kinerja per triwulan.

## 11. Keamanan & Kepatuhan
- Multi-tenant berbasis **Clerk Organizations**; filter `orgId` pada semua query.  
- Enforce RBAC pada rute & server actions.  
- Simpan checksum lampiran; verifikasi konten.  
- Timestamp konsisten Asia/Jakarta; format IDR.  
- Cadangan data & retensi sesuai kebijakan OPD.

## 12. Monitoring & Telemetri
- Metrik: % NPD Final tanpa revisi, Waktu Draft→Final, % realisasi vs pagu, % capaian indikator.  
- Logging server (API latency, error rate), health check.  
- Event audit untuk aktivitas kritikal.

## 13. Kriteria Penerimaan (end-to-end contoh)
- **Membuat NPD**: Saat menambah baris melebihi sisa pagu, sistem menolak dan menampilkan error.  
- **Finalisasi**: Setelah Final, tombol edit nonaktif; audit log mencatat aksi.  
- **SP2D**: Input SP2D mengubah dashboard Realisasi vs Pagu dalam ≤ 1 detik.  
- **Kinerja**: % capaian dihitung otomatis dan tampil pada dashboard periode terkait.

## 14. Rencana Implementasi (Roadmap & Sprint)

### Sprint 0 — Fondasi (3–5 hari)
- Inisialisasi repo monorepo (opsional), konfigurasi ESLint/Prettier, CI (GitHub Actions).  
- Setup Next.js 15 + Mantine + Clerk + Convex + TanStack Query + RTK + RHF + Zod + T3 Env.  
- Scaffold layout, theming, proteksi halaman (middleware) & switcher organisasi.

### Sprint 1 — Data RKA & Navigasi (1–2 minggu)
- Skema Convex `orgs/users/rka_*` + indeks.  
- Halaman RKA Explorer (tabel hierarki, detail sub kegiatan).  
- Impor CSV sederhana untuk RKA (server action + validasi Zod).  
- Seed data contoh & uji performa query.

### Sprint 2 — NPD Builder (1–2 minggu)
- Skema `npd_headers/npd_lines/attachments` + validasi server.  
- Form NPD (RHF + Zod); kalkulasi sisa pagu realtime; unggah lampiran.  
- Penomoran NPD otomatis; Draft → Ajukan; audit log.

### Sprint 3 — Verifikasi & Finalisasi (4–7 hari)
- Daftar NPD per status; panel verifikasi; status ke **diverifikasi** & **final**.  
- Lock dokumen; audit log transisi; notifikasi (opsional).

### Sprint 4 — SP2D & Realisasi (1 minggu)
- Skema `sp2d_refs/realizations` + distribusi proporsional.  
- Form SPM/SP2D; histori; dashboard Realisasi vs Pagu.

### Sprint 5 — Kinerja & Dashboard (1 minggu)
- Skema `performance_logs`; halaman kinerja; unggah bukti.  
- Dashboard: KPI & grafik Recharts; filter periode/OPD.  
- Laporan PDF/CSV dasar.

### Sprint 6 — PDF Template & Hardening (4–7 hari)
- Template **PDF NPD** (HTML→PDF) via Hono route.  
- Setting template per OPD; watermark & tanda tangan (opsional).  
- Hardening: Zod schema, error boundary, loading states.

### Sprint 7 — QA, Dokumentasi & Rilis (3–5 hari)
- UAT skenario lengkap; perbaikan bug prioritas tinggi.  
- Dokumentasi admin & pengguna; runbook backup-restore.  
- Rilis v1.0 + rencana iterasi berikutnya.

## 15. Rencana Teknis (Detail Pelaksanaan)

### 15.1 Struktur Proyek (ringkas)
```
apps/web (Next.js)
  app/
    (app)/dashboard, rka, npd, kinerja, pengaturan
  components/
  lib/ (client Convex, hooks TanStack Query, utils currency/date-id)
  styles/
packages/shared
  env/ (T3 Env)
convex/
  schema.ts
  rka.ts, npd.ts, sp2d.ts, performance.ts, audit.ts
hono/
  index.ts (routes: /api/pdf, /api/reports, /api/import)
```

### 15.2 Environment Variables (T3 Env)
- **Server**: `CLERK_SECRET_KEY`, `CONVEX_DEPLOYMENT`  
- **Client**: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_CONVEX_URL`

### 15.3 Pola Data Fetching
- **TanStack Query**: Query key per org/tahun; invalidasi setelah mutate.  
- **Convex client**: gunakan queries subscribable untuk realtime.  
- **Redux Toolkit**: state UI (filter, sort, panel terbuka).

### 15.4 Validasi Dua Arah
- **Zod** schema bersama (shared) → dipakai di RHF resolver & server mutation.  
- Error dari server dirender sebagai alert/toast di UI.

### 15.5 PDF Rendering
- Hono route menghasilkan HTML → PDF (wkhtmltopdf/Playwright/Resvg—pilih 1).  
- Template dengan token (logo OPD, nomor, tanggal, tabel akun, tanda tangan).

### 15.6 QA & Testing
- **Unit**: util jumlah/sisa, nomor NPD, distribusi SP2D.  
- **Integration**: submit→verify→final flow; impor RKA; lampiran.  
- **E2E**: Playwright (login Clerk dummy, buat NPD, finalisasi, input SP2D).  
- **Perf**: Lighthouse & React profiler; target TTI < 2.5 s.

## 16. Risiko & Mitigasi
- **Variasi format NPD** → Template per OPD; variabel header/kop.  
- **Data SP2D eksternal** → Impor CSV & endpoint publik; rencana integrasi tahap 2.  
- **Kelola peran kompleks** → RBAC granular, audit, migrasi role teruji.

## 17. Backlog (pasca v1)
- Integrasi **SSO enterprise** per organisasi (SAML/OIDC).  
- Role & izin granular per menu/aksi.  
- Agregasi multi-tahun & forecasting.  
- Integrasi notifikasi (email/WA) status NPD.

---

## 18. TODO Plan (Komprehensif)

### Proyek & Konfigurasi
- [ ] Inisialisasi monorepo (opsional) & CI pipeline
- [ ] Setup Next.js + Mantine + Clerk + Convex + TanStack Query + RTK + RHF + Zod + T3 Env
- [ ] Theming, layout, navigasi, proteksi rute

### Data & Backend (Convex)
- [ ] Implement `schema.ts` dan indeks
- [ ] Queries: daftar sub kegiatan, akun, sisa pagu; NPD per status; rekap realisasi
- [ ] Mutations: create/submit/verify/finalize NPD; add lines; upload lampiran
- [ ] Mutations: input SPM/SP2D + distribusi ke `realizations`
- [ ] Actions/HTTP: impor CSV RKA; generate PDF

### UI Halaman
- [ ] Dashboard (KPI + Recharts)
- [ ] RKA Explorer (tabel hierarki + detail)
- [ ] NPD Builder (RHF + Zod + upload)
- [ ] Verifikasi (list + panel checklist)
- [ ] SP2D (form + histori)
- [ ] Kinerja (form log + tabel % capaian)
- [ ] Pengaturan (template PDF, role)

### Validasi & Keamanan
- [ ] RBAC per role & organisasi; guard server & client
- [ ] Zod resolver di form + validasi server-side
- [ ] Audit log pada semua aksi penting

### Laporan & Ekspor
- [ ] Template PDF NPD per OPD
- [ ] CSV rekap realisasi & audit log
- [ ] PDF laporan triwulan

### Testing & Rilis
- [ ] Unit, Integration, E2E (Playwright)
- [ ] Perf & aksesibilitas (Lighthouse, axe)
- [ ] Dokumen admin & user guide
- [ ] UAT & rilis v1.0

---

## 19. Lampiran Teknis (Snippet)

**Distribusi SP2D proporsional (konsep)**  
`nilaiCair` * (jumlah baris / total jumlah semua baris) → akumulasi ke `realizations.totalCair` per `accountId`.

**Query sisa pagu**  
`paguTahun - realizations.totalCair` ditampilkan real-time di form NPD Builder.

---

**Selesai.** Dokumen ini dapat dijadikan dasar implementasi langsung (sprint-by-sprint), dan diperbarui seiring umpan balik UAT.
