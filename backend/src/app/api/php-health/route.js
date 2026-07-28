export async function GET() {
  const baseUrl = process.env.PHP_API_BASE_URL || 'http://localhost:4002/php-api';

  try {
    const response = await fetch(`${baseUrl}/health`, { cache: 'no-store' });
    const data = await response.json();

    return Response.json({
      ok: response.ok,
      php_api: data,
    }, { status: response.ok ? 200 : 502 });
  } catch (error) {
    return Response.json({
      ok: false,
      message: 'Gagal menghubungi PHP API',
      error: error.message,
    }, { status: 502 });
  }
}
