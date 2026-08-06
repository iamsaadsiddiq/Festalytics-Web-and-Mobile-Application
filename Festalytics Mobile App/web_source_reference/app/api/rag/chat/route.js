import { NextResponse } from 'next/server';
import { fallbackRagChat } from '@/lib/ragFallback';

const BACKEND_URL = (process.env.AI_BACKEND_URL || 'http://localhost:8001').replace(/\/$/, '');

async function proxyToPythonBackend(body) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${BACKEND_URL}/api/rag/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || 'Python RAG backend returned an error.');
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid JSON body.' }, { status: 400 });
  }

  const message = String(body?.message || '').trim();
  if (!message) {
    return NextResponse.json({ detail: 'Message is required.' }, { status: 400 });
  }

  try {
    const data = await proxyToPythonBackend({ ...body, message });
    return NextResponse.json(data);
  } catch (err) {
    console.warn('[api/rag/chat] Python backend unavailable, using local fallback:', err?.message || err);
    return NextResponse.json(fallbackRagChat(message));
  }
}
