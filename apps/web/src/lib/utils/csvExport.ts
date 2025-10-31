import { downloadCSV } from '@/lib/utils/csvParser';

// CSV Export utility functions for different entities
export const exportNPDData = (npdData: any[], organizationName: string) => {
  const headers = [
    'Nomor NPD',
    'Judul',
    'Jenis',
    'Nomor Sub Kegiatan',
    'Sub Kegiatan',
    'Tanggal',
    'Status',
    'Tahun',
    'Dibuat Oleh',
    'Diubah Oleh',
    'Diubah Pada',
    'Diverifikasi Oleh',
    'Diverifikasi Pada',
    'Finalisasi Oleh',
    'Finalisasi Pada',
    'Catatan',
    'Total Nilai',
    'File Lampiran'
  ];

  const csvData = npdData.map(npd => ({
    'Nomor NPD': npd.documentNumber || '',
    'Judul': npd.title || '',
    'Jenis': npd.jenis || '',
    'Nomor Sub Kegiatan': npd.subkegiatan?.kode || '',
    'Sub Kegiatan': npd.subkegiatan?.nama || '',
    'Tanggal': npd.createdAt ? new Date(npd.createdAt).toLocaleDateString('id-ID') : '',
    'Status': npd.status || '',
    'Tahun': npd.tahun || '',
    'Dibuat Oleh': npd.createdBy?.name || '',
    'Diubah Oleh': npd.updatedBy?.name || '',
    'Diubah Pada': npd.updatedAt ? new Date(npd.updatedAt).toLocaleDateString('id-ID') : '',
    'Diverifikasi Oleh': npd.verifiedBy?.name || '',
    'Diverifikasi Pada': npd.verifiedAt ? new Date(npd.verifiedAt).toLocaleDateString('id-ID') : '',
    'Finalisasi Oleh': npd.finalizedBy?.name || '',
    'Finalisasi Pada': npd.finalizedAt ? new Date(npd.finalizedAt).toLocaleDateString('id-ID') : '',
    'Catatan': npd.catatan || '',
    'Total Nilai': npd.lines?.reduce((sum, line) => sum + line.jumlah, 0) || 0,
    'File Lampiran': npd.attachments?.map(att => att.namaFile).join('; ') || ''
  }));

  downloadCSV(csvData, headers, `npd-data-${organizationName}-${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportRKAData = (rkaData: any[], organizationName: string) => {
  const headers = [
    'Kode Program',
    'Nama Program',
    'Kode Kegiatan',
    'Nama Kegiatan',
    'Kode Sub Kegiatan',
    'Nama Sub Kegiatan',
    'Tahun Anggaran',
    'Total Pagu Program',
    'Realisasi Program',
    'Status Program',
    'Jumlah Akun',
    'Indikator Output',
    'Target Output',
    'Indikator Hasil',
    'Target Hasil',
    'Satuan'
  ];

  const csvData = rkaData.map(rka => ({
    'Kode Program': rka.programKode || '',
    'Nama Program': rka.programNama || '',
    'Kode Kegiatan': rka.kegiatanKode || '',
    'Nama Kegiatan': rka.kegiatanNama || '',
    'Kode Sub Kegiatan': rka.subkegiatanKode || '',
    'Nama Sub Kegiatan': rka.subkegiatanNama || '',
    'Tahun Anggaran': rka.fiscalYear || '',
    'Total Pagu Program': rka.totalPaguProgram || 0,
    'Realisasi Program': rka.totalRealisasiProgram || 0,
    'Status Program': rka.statusProgram || '',
    'Jumlah Akun': rka.jumlahAkun || 0,
    'Indikator Output': rka.indikatorOutput || '',
    'Target Output': rka.targetOutput || 0,
    'Indikator Hasil': rka.indikatorHasil || 0,
    'Target Hasil': rka.targetHasil || 0,
    'Satuan': rka.satuanIndikator || ''
  }));

  downloadCSV(csvData, headers, `rka-data-${organizationName}-${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportSP2DData = (sp2dData: any[], organizationName: string) => {
  const headers = [
    'No SP2D',
    'No SPM',
    'No NPD Terkait',
    'Nomor SP2D',
    'Tanggal SP2D',
    'Nilai Cair',
    'Tahun',
    'Dibuat Oleh',
    'Catatan'
  ];

  const csvData = sp2dData.map(sp2d => ({
    'No SP2D': sp2d.noSP2D || '',
    'No SPM': sp2d.noSPM || '',
    'No NPD Terkait': sp2d.npdId || '',
    'Nomor SP2D': sp2d.noSP2D || '',
    'Tanggal SP2D': sp2d.tglSP2D ? new Date(sp2d.tglSP2D).toLocaleDateString('id-ID') : '',
    'Nilai Cair': sp2d.nilaiCair || 0,
    'Tahun': sp2d.tahun || '',
    'Dibuat Oleh': sp2d.createdBy?.name || '',
    'Catatan': sp2d.catatan || ''
  }));

  downloadCSV(csvData, headers, `sp2d-data-${organizationName}-${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportPerformanceData = (performanceData: any[], organizationName: string) => {
  const headers = [
    'Kode Sub Kegiatan',
    'Nama Sub Kegiatan',
    'Nama Indikator',
    'Target',
    'Realisasi',
    'Satuan',
    'Persentase Capaian',
    'Tahun',
    'Periode',
    'File Bukti',
    'Status Approval',
    'Dibuat Oleh',
    'Diapproval Oleh'
  ];

  const csvData = performanceData.map(perf => ({
    'Kode Sub Kegiatan': perf.subkegiatanKode || '',
    'Nama Sub Kegiatan': perf.subkegiatanNama || '',
    'Nama Indikator': perf.indikatorNama || '',
    'Target': perf.target || 0,
    'Realisasi': perf.realisasi || 0,
    'Satuan': perf.satuan || '',
    'Persentase Capaian': perf.target > 0 ? ((perf.realisasi / perf.target) * 100).toFixed(2) : '0',
    'Tahun': perf.tahun || '',
    'Periode': perf.periode || '',
    'File Bukti': perf.buktiFile || '',
    'Status Approval': perf.approvalStatus || '',
    'Dibuat Oleh': perf.createdBy?.name || '',
    'Diapproval Oleh': perf.diapprovalBy?.name || ''
  }));

  downloadCSV(csvData, headers, `performance-data-${organizationName}-${new Date().toISOString().split('T')[0]}.csv`);
};

export const exportAccountsData = (accountsData: any[], organizationName: string) => {
  const headers = [
    'Kode Akun',
    'Uraian',
    'Program',
    'Kegiatan',
    'Sub Kegiatan',
    'Tahun Anggaran',
    'Pagu Tahun',
    'Realisasi Tahun',
    'Sisa Pagu',
    'Satuan',
    'Volume',
    'Harga Satuan',
    'Status'
  ];

  const csvData = accountsData.map(account => ({
    'Kode Akun': account.kode || '',
    'Uraian': account.uraian || '',
    'Program': account.programNama || '',
    'Kegiatan': account.kegiatanNama || '',
    'Sub Kegiatan': account.subkegiatanNama || '',
    'Tahun Anggaran': account.fiscalYear || '',
    'Pagu Tahun': account.paguTahun || 0,
    'Realisasi Tahun': account.realisasiTahun || 0,
    'Sisa Pagu': account.sisaPagu || 0,
    'Satuan': account.satuan || '',
    'Volume': account.volume || 0,
    'Harga Satuan': account.hargaSatuan || 0,
    'Status': account.status || ''
  }));

  downloadCSV(csvData, headers, `accounts-data-${organizationName}-${new Date().toISOString().split('T')[0]}.csv`);
};

// Batch export function for combined reports
export const exportCombinedReport = (
  npdData: any[],
  rkaData: any[],
  sp2dData: any[],
  performanceData: any[],
  organizationName: string
) => {
  const timestamp = new Date().toISOString().split('T')[0];

  // Generate separate CSV files
  exportNPDData(npdData, organizationName);
  exportRKAData(rkaData, organizationName);
  exportSP2DData(sp2dData, organizationName);
  exportPerformanceData(performanceData, organizationName);

  return {
    timestamp,
    files: [
      `npd-data-${organizationName}-${timestamp}.csv`,
      `rka-data-${organizationName}-${timestamp}.csv`,
      `sp2d-data-${organizationName}-${timestamp}.csv`,
      `performance-data-${organizationName}-${timestamp}.csv`
    ]
  };
};