const PHP = process.env.PHP_API_BASE_URL || 'http://localhost/matoa_internal/api';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return Response.json({ ok: false, message: 'id required' }, { status: 400 });

  try {
    const r = await fetch(`${PHP}/laporan/detail?id=${id}`, { cache: 'no-store' });
    const d = await r.json();
    return Response.json(d, { status: r.status });
  } catch (e) {
    return Response.json({ ok: false, message: e.message }, { status: 500 });
  }
}
