import { NextResponse } from 'next/server';

const BACKEND_URL = (process.env.AI_BACKEND_URL || 'http://localhost:8001').replace(/\/$/, '');

export async function POST(request) {
  try {
    const formData = await request.formData();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(`${BACKEND_URL}/api/clip/match`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status });
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    return NextResponse.json(
      {
        detail:
          'Decor matcher backend is offline. Start the Python server: cd backend && python -m uvicorn app.main:app --reload --port 8001',
        error: err?.message || 'Backend unavailable',
      },
      { status: 503 }
    );
  }
}
