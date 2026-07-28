import { NextResponse } from 'next/server';

const API_BASE = process.env.PHP_API_BASE_URL || 'http://localhost:4002/php-api';

export async function GET(request, { params }) {
  const { tiketId } = params;
  
  try {
    const res = await fetch(`${API_BASE}/laporan/detail/${tiketId}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ ok: false, message: err.message }, { status: 500 });
  }
}
