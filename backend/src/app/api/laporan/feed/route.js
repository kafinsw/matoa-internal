import { NextResponse } from 'next/server';
const API = process.env.PHP_API_BASE_URL || 'http://localhost:4002/php-api';
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter') || 'all';
  const limit  = searchParams.get('limit')  || '50';
  const page   = searchParams.get('page')   || '1';
  const search = searchParams.get('search') || '';
  const type   = searchParams.get('type')   || '';
  const status = searchParams.get('status') || '';
  try {
    const url = `${API}/laporan/feed?filter=${filter}&limit=${limit}&page=${page}${type?`&type=${type}`:''}${status?`&status=${encodeURIComponent(status)}`:''}${search?`&search=${encodeURIComponent(search)}`:''}`; 
    const r = await fetch(url, { cache: 'no-store' });
    const d = await r.json();
    return NextResponse.json(d);
  } catch(e) { return NextResponse.json({ ok: false, data: [] }, { status: 500 }); }
}
