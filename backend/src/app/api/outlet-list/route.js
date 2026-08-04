import { NextResponse } from 'next/server';
const PHP = process.env.PHP_API_BASE_URL || 'http://localhost:4002/php-api';
export async function GET() {
  const r = await fetch(`${PHP}/outlets`, { cache: 'no-store' });
  const d = await r.json();
  return NextResponse.json(Array.isArray(d) ? d : []);
}
