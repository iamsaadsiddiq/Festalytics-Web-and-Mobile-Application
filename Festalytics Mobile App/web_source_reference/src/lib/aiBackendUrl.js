export function getAiBackendUrl() {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_AI_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_AI_BACKEND_URL.replace(/\/$/, '');
  }
  return '';
}

export function ragChatUrl() {
  const backend = getAiBackendUrl();
  return backend ? `${backend}/api/rag/chat` : '/api/rag/chat';
}

export function clipMatchUrl() {
  const backend = getAiBackendUrl();
  return backend ? `${backend}/api/clip/match` : '/api/clip/match';
}

export function resolveHallImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('/Marriage') || url.startsWith('data:')) {
    return url;
  }
  const backend = getAiBackendUrl();
  return backend ? `${backend}${url}` : url;
}
