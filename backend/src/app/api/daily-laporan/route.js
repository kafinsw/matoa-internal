import { NextResponse } from 'next/server';
const PHP = process.env.PHP_API_BASE_URL || 'http://localhost:4002/php-api';

export async function GET(req) {
  const s = req.nextUrl.searchParams;
  const qs = new URLSearchParams();
  ['page','limit','outlet_id','search','date_from','date_to'].forEach(k => {
    if (s.get(k)) qs.set(k, s.get(k));
  });
  const r = await fetch(`${PHP}/daily-laporan?${qs}`, { cache: 'no-store' });
  const d = await r.json();
  return NextResponse.json(d);
}
