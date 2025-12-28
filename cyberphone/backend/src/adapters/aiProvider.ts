/**
 * AI Provider adapter (mock)
 * Replace with calls to Replicate/OpenAI/Cloudflare in production.
 * The function receives the local file or URL and returns a Promise<{ url }>
 */
export async function applyFilterMock({ imageUrl, filter }: { imageUrl: string; filter: string }) {
  // In a real integration we'd:
  // - send imageUrl (or bytes) to provider
  // - get resulting image bytes or URL
  // - store in R2 and return URL
  // Here we simulate delay and return the same URL with a query param (mock).
  await new Promise((r) => setTimeout(r, 1200));
  const url = `${imageUrl}?filter=${encodeURIComponent(filter)}&mock=1`;
  return { url };
}