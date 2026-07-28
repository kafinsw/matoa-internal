export async function GET() {
  return Response.json({
    ok: true,
    app: 'matoa_internal_next_backend',
    time: new Date().toISOString(),
  });
}
