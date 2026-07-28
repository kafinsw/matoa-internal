import { NextResponse } from 'next/server';
const API = process.env.PHP_API_BASE_URL || 'http://localhost/matoa_internal/api';

export async function POST(request) {
  try {
    const body = await request.json();
    const r = await fetch(`${API}/laporan/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    const d = await r.json();
    return NextResponse.json(d);
  } catch (e) {
    return NextResponse.json({ ok: false, message: e.message }, { status: 500 });
  }
}
