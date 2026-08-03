import { NextResponse } from 'next/server';

const PHP = process.env.PHP_API_BASE_URL || 'http://localhost:4002/php-api';

export async function GET() {
  const res  = await fetch(`${PHP}/outlets`, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req) {
  const body = await req.json();
  const res  = await fetch(`${PHP}/outlets`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req) {
  const body = await req.json();
  const res  = await fetch(`${PHP}/outlets`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id  = searchParams.get('id');
  const res  = await fetch(`${PHP}/outlets?id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
