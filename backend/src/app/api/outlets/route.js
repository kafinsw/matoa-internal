import { NextResponse } from 'next/server';
const API = 'http://localhost:4002/php-api';
export async function GET() {
  try {
    const r = await fetch(`${API}/outlets`, { cache: 'no-store' });
    const d = await r.json();
    return NextResponse.json(d);
  } catch(e) { return NextResponse.json([], { status: 500 }); }
}
