import { NextResponse } from 'next/server';
const API = process.env.PHP_API_BASE_URL || 'http://localhost:4002/php-api';
export async function GET() {
  try {
    const r = await fetch(`${API}/outlets`, { cache: 'no-store' });
    const d = await r.json();
    return NextResponse.json(d);
  } catch(e) { return NextResponse.json([], { status: 500 }); }
}
