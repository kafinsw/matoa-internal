import { NextResponse } from 'next/server';

const PHP = process.env.PHP_API_BASE_URL || 'http://localhost:4002/php-api';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');

  let url;
  if (type === 'kategori')   url = `${PHP}/kategori-kendala`;
  else if (type === 'users') url = `${PHP}/users`;
  else if (type === 'sla')   url = `${PHP}/sla-levels`;
  else if (type === 'next-id') {
    const kid = searchParams.get('kategori_id');
    url = `${PHP}/katalog-gejala/next-id?kategori_id=${kid}`;
  } else return NextResponse.json({ error: 'bad type' }, { status: 400 });

  const res  = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req) {
  const body = await req.json();
  const res  = await fetch(`${PHP}/katalog-gejala`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
