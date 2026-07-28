// Vite proxy: lewat /api → XAMPP Apache (HTTP). Tidak ada mixed content karena semua lewat origin yang sama.
const API_BASE_URL = '/api';

export async function apiRequest(path, options = {}) {
  const endpoint = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok || (typeof payload === 'object' && payload?.ok === false)) {
    const message = typeof payload === 'object' && payload?.message
      ? payload.message
      : `Request API gagal (HTTP ${response.status})`;
    throw new Error(message);
  }

  return payload;
}

export const api = {
  health: () => apiRequest('/health'),
  dbTest: () => apiRequest('/db-test'),

  // Outlets
  getOutlets: () => apiRequest('/outlets'),

  // SLA
  getSlaLevels: () => apiRequest('/sla-levels'),

  // Katalog Gejala
  getKatalogGejala: () => apiRequest('/katalog-gejala'),

  // Laporan Kendala
  getLaporanList: (page = 1, limit = 20) => apiRequest(`/laporan/list?page=${page}&limit=${limit}`),
  getKelompokSistem: () => apiRequest('/laporan/kelompok-sistem'),
  getKeluhan: () => apiRequest('/laporan/keluhan'),
  getOutletList: () => apiRequest('/laporan/outlet-list'),
  nextTicketId: () => apiRequest('/laporan/next-ticket-id'),
  submitLaporan: (data) => apiRequest('/laporan/store', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Jadwal Rutin
  getLaporanPerbaikan: () => apiRequest('/laporan-perbaikan'),
};
