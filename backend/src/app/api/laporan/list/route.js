import { NextResponse } from 'next/server';
const API = process.env.PHP_API_BASE_URL || 'http://localhost:4002/php-api';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page      = searchParams.get('page')      || '1';
  const limit     = searchParams.get('limit')     || '20';
  const outlet_id = searchParams.get('outlet_id') || '';
  const user_id   = searchParams.get('user_id')   || '';
  try {
    const params = new URLSearchParams({ page, limit });
    if (outlet_id) params.set('outlet_id', outlet_id);
    if (user_id)   params.set('user_id', user_id);
    const r = await fetch(`${API}/laporan/feed?${params}`, { cache: 'no-store' });
    const d = await r.json();
    return NextResponse.json({
      ok: d.ok,
      data: d.data || [],
      total_pages: d.pagination?.pages || 1,
      total: d.pagination?.total || 0,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, data: [] }, { status: 500 });
  }
}
