export function extractVideoId(url) {
  if (!url || typeof url !== 'string') return null;

  const cleanUrl = url.trim();

  // Shorts (берем ровно 11 символов ID, игнорируя ?feature=share и прочие параметры)
  const shortsMatch = cleanUrl.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch) return shortsMatch[1];

  // Standard watch?v=
  const watchMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];

  // Short format youtu.be/
  const embedMatch = cleanUrl.match(/(?:youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];

  // Голый ID (если передали сразу ID из 11 символов)
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }

  return null;
}
