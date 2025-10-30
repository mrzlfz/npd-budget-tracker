# Panduan Pengguna NPD Tracker

## Daftar Isi

1. [Pendahuluan](#pendahuluan)
2. [Login dan Autentikasi](#login-dan-autentikasi)
3. [Dashboard](#dashboard)
4. [Manajemen RKA](#manajemen-rka)
5. [Manajemen NPD](#manajemen-npd)
6. [Tracking SP2D](#tracking-sp2d)
7. [Laporan dan Performance](#laporan-dan-performance)
8. [Manajemen Pengguna](#manajemen-pengguna)

## Pendahuluan

NPD Tracker adalah aplikasi web yang dirancang untuk membantu organisasi pemerintah (OPD/SKPD) dalam mengelola Nota Pencairan Dana (NPD) dan melacak realisasi anggaran terhadap RKA (Rencana Kerja dan Anggaran).

### Fitur Utama

- **Multi-tenant**: Dukungan untuk banyak organisasi dengan data yang terisolasi
- **Workflow NPD**: Proses approval dari draft hingga final
- **Integrasi SP2D**: Tracking pembayaran
- **Performance Tracking**: Realisasi anggaran vs perencanaan
- **Role-based Access Control**: Akses sesuai peran pengguna

## Login dan Autentikasi

1. Buka aplikasi di browser
2. Klik tombol "Login"
3. Pilih organisasi Anda dari dropdown
4. Masukkan email dan password
5. Klik "Sign In"

### Peran Pengguna

- **Admin OPD**: Akses penuh ke semua fitur
- **PPTK/PPK**: Kelola RKA dan NPD
- **Bendahara Pengeluaran**: Verifikasi NPD, kelola SP2D
- **Verifikator Internal**: Verifikasi dan approve NPD
- **Auditor/Viewer**: Akses read-only

## Dashboard

Dashboard memberikan gambaran umum status anggaran dan NPD:

### Komponen Dashboard

1. **KPI Cards**
   - Total NPD
   - NPD Berhasil
   - Total Pagu Anggaran
   - Realisasi Anggaran
   - Tingkat Utilisasi

2. **Grafik Realisasi Bulanan**
   - Perbandingan target vs realisasi per bulan
   - Warna hijau: target tercapai
   - Warna merah: di bawah target

3. **Breakdown Anggaran**
   - Persentase alokasi per kategori:
     - Belanja Pegawai (40%)
     - Belanja Barang & Jasa (30%)
     - Belanja Modal (20%)
     - Belanja Tak Terduga (10%)

4. **Status NPD**
   - Selesai
   - Dalam Proses
   - Draft

## Manajemen RKA

RKA (Rencana Kerja dan Anggaran) adalah dokumen perencanaan anggaran tahunan.

### Membuat RKA Baru

1. Klik menu "RKA" di sidebar
2. Klik tombol "Tambah RKA"
3. Isi form:
   - Tahun Anggaran
   - Program
   - Kegiatan
   - Sub-kegiatan
   - Rekening
   - Jumlah Anggaran
4. Klik "Simpan"

### Mengelola RKA

- **Edit**: Klik ikon edit pada baris RKA
- **Hapus**: Klik ikon hapus (hanya RKA draft)
- **Export**: Klik tombol "Export" untuk download PDF/Excel
- **Filter**: Gunakan filter untuk mencari RKA spesifik

### Status RKA

- **Draft**: Belum diajukan
- **Diajukan**: Menunggu verifikasi
- **Disetujui**: Sudah diverifikasi dan disetujui
- **Ditolak**: Ada revisi yang diperlukan

## Manajemen NPD

NPD (Nota Pencairan Dana) adalah dokumen untuk pencairan dana.

### Membuat NPD Baru

1. Klik menu "NPD" di sidebar
2. Klik tombil "Buat NPD Baru"
3. Pilih RKA terkait
4. Isi form:
   - Nomor NPD
   - Tanggal
   - Uraian
   - Jumlah Dana
   - Lampiran (opsional)
5. Klik "Simpan Draft"

### Workflow NPD

1. **Draft** (PPTK)
   - Pembuatan dokumen NPD
   - Bisa diedit dan dihapus

2. **Diajukan** (PPTK → Bendahara)
   - Pengajuan untuk verifikasi
   - Tidak bisa diedit

3. **Diverifikasi** (Bendahara)
   - Pengecekan kelengkapan dokumen
   - Bisa approve atau reject

4. **Final** (Admin/Verifikator)
   - Persetujuan akhir
   - Siap untuk pembayaran

### Upload Dokumen

- Format yang didukung: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG
- Maksimal ukuran: 10MB per file
- Maksimal 5 file per NPD

## Tracking SP2D

SP2D (Surat Perintah Pencairan Dana) adalah dokumen pembayaran dari KPPN.

### Membuat SP2D

1. Pilih NPD yang akan dibayarkan
2. Klik "Buat SP2D"
3. Isi informasi:
   - Nomor SP2D
   - Tanggal
   - Bank tujuan
   - Nomor rekening
4. Upload bukti transfer
5. Klik "Simpan"

### Status SP2D

- **Draft**: Belum diverifikasi
- **Diajukan**: Menunggu verifikasi
- **Diverifikasi**: Sudah dicek bendahara
- **Selesai**: Pembayaran selesai

## Laporan dan Performance

### Laporan Tersedia

1. **Laporan Realisasi Anggaran**
   - Periode: Bulanan/Triwulanan/Semesteran/Tahunan
   - Format: PDF/Excel
   - Filter: Program, Kegiatan, Status

2. **Laporan Performance**
   - Perbandingan target vs realisasi
   - Grafik dan tabel
   - Export ke PDF

3. **Audit Trail**
   - Log semua aktivitas
   - Filter oleh user dan tanggal

### Performance Metrics

- **Efisiensi Anggaran**: Realisasi/Pagu × 100%
- **Kecepatan Proses**: Rata-rata waktu approval
- **Kepatuhan**: Persentase dokumen lengkap

## Manajemen Pengguna (Admin Only)

### Menambah Pengguna

1. Klik menu "Admin" → "Pengguna"
2. Klik "Tambah Pengguna"
3. Isi data:
   - Nama Lengkap
   - Email
   - Peran (Role)
   - Organisasi
4. Klik "Simpan"

### Mengelola Organisasi

1. Klik menu "Admin" → "Organisasi"
2. Edit informasi organisasi
3. Konfigurasi template PDF
4. Atur signature settings

### Pengaturan Sistem

- Konfigurasi email notifications
- Setting backup otomatis
- Konfigurasi role permissions

## Tips dan Best Practices

### Security

- Gunakan password yang kuat
- Logout setelah selesai menggunakan aplikasi
- Jangan share credentials dengan orang lain

### Data Management

- Backup data secara berkala
- Validasi data sebelum submit
- Gunakan format file yang sesuai

### Workflow Optimization

- Submit dokumen lengkap untuk mempercepat approval
- Monitor status dokumen secara berkala
- Gunakan filter untuk mencari dokumen spesifik

## Troubleshooting

### Masalah Umum

1. **Tidak bisa login**
   - Periksa email dan password
   - Pastikan organisasi sudah dipilih
   - Hubungi admin jika akun terkunci

2. **Dokumen tidak tersimpan**
   - Periksa koneksi internet
   - Pastikan semua field required terisi
   - Cek ukuran file upload

3. **Tidak bisa approve**
   - Pastikan memiliki permission
   - Check dokumen status
   - Contact admin untuk permission

### Contact Support

Email: support@npd-tracker.go.id
Phone: (021) 1234-5678
Helpdesk: Senin - Jumat, 08:00 - 16:00 WIB

---

*Versi 1.0 - Terakhir diperbarui: 30 Oktober 2024*
