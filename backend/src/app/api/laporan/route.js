import { NextResponse } from 'next/server';

const API_BASE = 'http://localhost:4002/php-api';

const SLA_HOURS = { L1: 24, L2: 72, L3: 120 };

function toWIBString(dt) {
  if (!dt) return null;
  const s = dt.replace(' ', 'T');
  // PHP already appends +07:00 via utc_to_wib(); don't double-append
  return /[+Z]/.test(s) ? s : s + '+07:00';
}

function transform(row) {
  const level = row.level || null;
  const createdAt = row.created_at || null;
  const isGA = ['selesai_dikerjakan', 'terverifikasi'].includes(row.status);
  const statusLabel = row.status ?? '—';

  const slaHours = level ? (SLA_HOURS[level] ?? null) : null;
  // created_at dari MySQL sudah WIB (db.php SET time_zone='+07:00')
  // Parse sebagai WIB, format balik ke WIB string (jangan pakai toISOString yg UTC)
  const slaDeadline = level && createdAt && slaHours
    ? (() => {
        const base = new Date(createdAt.replace(' ', 'T') + '+07:00');
        const deadline = new Date(base.getTime() + slaHours * 3600000);
        // format ke WIB string tanpa convert ke UTC
        return new Date(deadline.getTime()).toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace('T', ' ');
      })()
    : null;

  return {
    id: row.id,
    tiket_id: row.tiket_id,
    tipe: isGA ? 'GA' : 'ME',
    outlet_kode: row.outlet_kode ?? '-',
    outlet_nama: row.outlet_nama ?? '-',
    keterangan: row.keterangan ?? '—',
    status: statusLabel,
    status_raw: row.status,
    tim_type: row.tim_type ?? null,
    tim_name: row.tim_name ?? null,
    kategori: row.kategori ?? null,
    level,
    total_kendala: parseInt(row.total_kendala) || 0,
    created_at: toWIBString(createdAt),
    raw_created_at: toWIBString(createdAt),
    sla_hours: slaHours,
    sla_deadline: slaDeadline,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') || 1;
  const limit = searchParams.get('limit') || 20;
  const filter = searchParams.get('filter') || '';

  try {
    const params = new URLSearchParams({ page, limit, ...(filter && { filter }) });
    const res = await fetch(`${API_BASE}/laporan/list?${params}`);
    const data = await res.json();

    if (!data.ok) return NextResponse.json(data);

    return NextResponse.json({
      ...data,
      data: (data.data || []).map(transform),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
