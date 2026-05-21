export interface Paper {
  id: string;
  title: string;
  abstract: string;
  url: string;
  year?: number | null;
  authors?: string;
  source?: string;
}

/**
 * Searches for research papers via our own backend which handles:
 *  - Semantic Scholar  (with retry + timeout)
 *  - OpenAlex          (free, no key needed)
 *  - In-memory caching (10 min TTL per query)
 */
export async function searchPapers(query: string): Promise<Paper[]> {
  const url = `/api/papers?q=${encodeURIComponent(query.trim())}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (networkError: any) {
    throw new Error("Network error — please check your connection and try again.");
  }

  if (!res.ok) {
    let message = `Server error (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // use default message
    }
    throw new Error(message);
  }

  const data: Paper[] = await res.json();
  return data;
}