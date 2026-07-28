import { NextResponse } from 'next/server';

const API_BASE = 'http://localhost:4002/php-api';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const days = searchParams.get('days') || '0';
  try {
    const res = await fetch(`${API_BASE}/laporan/stats?days=${days}`, { cache: 'no-store' });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
