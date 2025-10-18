export function getApiBase(): string {
  const env = (import.meta as any).env || {};
  // 1) If explicitly set, use it
  if (env.VITE_API_BASE_URL) return env.VITE_API_BASE_URL as string;
  // 2) If running via Vite dev, prefer proxy path to avoid CORS/mixed-content
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.host || '';
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      return '/api';
    }
  }
  // 3) Fallback
  return 'http://localhost:8000';
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const [header, base64] = dataUrl.split(',');
  const match = /data:(.*?);base64/.exec(header || '')
  const mime = match ? match[1] : 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
