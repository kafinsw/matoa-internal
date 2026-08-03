import { NextResponse } from 'next/server';

const API_BASE = process.env.PHP_API_BASE_URL || 'http://localhost:4002/php-api';

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/katalog-gejala`, { cache: 'no-store' });
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.error('[catalog] PHP returned non-array:', data);
      return NextResponse.json([], { status: 502 });
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
