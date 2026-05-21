import { Router } from "express";
import { callGeminiText } from "../lib/gemini-keys";

const router = Router();

// ─── In-memory cache (survives across requests in same server session) ────────
const cache = new Map<string, { data: any[]; fetchedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isAbort = err.name === "AbortError";
      const isRateLimit = err.status === 429;
      if (attempt < retries && (isAbort || isRateLimit || err.message?.includes("fetch"))) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

// ─── Semantic Scholar ─────────────────────────────────────────────────────────
const SS_BASE = "https://api.semanticscholar.org/graph/v1";

async function searchSemanticScholar(query: string): Promise<any[]> {
  const url = `${SS_BASE}/paper/search?query=${encodeURIComponent(query)}&fields=title,abstract,url,year,authors,venue&limit=20`;
  const res = await fetchWithTimeout(url, { headers: { Accept: "application/json" } }, 10000);

  if (res.status === 429) {
    throw Object.assign(new Error("Rate limited by Semantic Scholar"), { status: 429 });
  }
  if (!res.ok) {
    throw new Error(`Semantic Scholar responded ${res.status}`);
  }

  const data = await res.json();
  if (!data?.data || !Array.isArray(data.data)) return [];

  return data.data.map((p: any) => ({
    id: `ss-${p.paperId}`,
    title: p.title || "Untitled",
    abstract: p.abstract || "No abstract available",
    url: p.url || `https://www.semanticscholar.org/paper/${p.paperId}`,
    year: p.year ?? null,
    authors: Array.isArray(p.authors) ? p.authors.map((a: any) => a.name).join(", ") : "",
    source: "Semantic Scholar",
  }));
}

// ─── OpenAlex (free, no key required) ────────────────────────────────────────
const OA_BASE = "https://api.openalex.org";

async function searchOpenAlex(query: string): Promise<any[]> {
  const url = `${OA_BASE}/works?search=${encodeURIComponent(query)}&filter=type:article&per-page=15&select=id,title,abstract_inverted_index,doi,publication_year,authorships`;
  const res = await fetchWithTimeout(url, { headers: { Accept: "application/json", "User-Agent": "LabMate/1.0 (research tool)" } }, 10000);

  if (!res.ok) throw new Error(`OpenAlex responded ${res.status}`);

  const data = await res.json();
  if (!data?.results || !Array.isArray(data.results)) return [];

  return data.results
    .filter((w: any) => w.title)
    .map((w: any) => {
      // Reconstruct abstract from inverted index
      let abstract = "No abstract available";
      if (w.abstract_inverted_index) {
        try {
          const words: string[] = [];
          for (const [word, positions] of Object.entries(w.abstract_inverted_index as Record<string, number[]>)) {
            for (const pos of positions) words[pos] = word;
          }
          abstract = words.filter(Boolean).join(" ");
        } catch {
          // keep default
        }
      }
      const doi = w.doi?.replace("https://doi.org/", "");
      return {
        id: `oa-${w.id?.split("/").pop()}`,
        title: w.title,
        abstract,
        url: doi ? `https://doi.org/${doi}` : w.id,
        year: w.publication_year ?? null,
        authors: Array.isArray(w.authorships)
          ? w.authorships
              .slice(0, 3)
              .map((a: any) => a.author?.display_name)
              .filter(Boolean)
              .join(", ")
          : "",
        source: "OpenAlex",
      };
    });
}

// ─── AI Summary cache ─────────────────────────────────────────────────────────
const summaryCache = new Map<string, string>();

// ─── Summarize route  (GET /api/papers/summarize?title=...&authors=...&year=...) ─
router.get("/summarize", async (req, res) => {
  const title   = (req.query.title   as string | undefined)?.trim();
  const authors = (req.query.authors as string | undefined)?.trim() ?? "";
  const year    = (req.query.year    as string | undefined)?.trim() ?? "";

  if (!title) {
    return res.status(400).json({ error: "Query parameter 'title' is required." });
  }

  const cacheKey = title.toLowerCase();
  if (summaryCache.has(cacheKey)) {
    return res.json({ summary: summaryCache.get(cacheKey) });
  }

  const byLine  = authors ? `authored by ${authors}` : "";
  const yearStr = year    ? `published in ${year}`    : "";
  const context = [byLine, yearStr].filter(Boolean).join(", ");

  const prompt = `You are a scientific research assistant. A research paper titled "${title}"${context ? ` (${context})` : ""} has no abstract available in the database. Write a comprehensive 10-15 line paragraph that describes what this paper is likely about based on its title${authors ? " and authors" : ""}. Focus on the probable research domain, key topics covered, and potential significance. Write in third-person academic style. Do not start with "I" or mention that the abstract is missing.`;

  try {
    const summary = await callGeminiText({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 1024 },
    });
    summaryCache.set(cacheKey, summary);
    return res.json({ summary });
  } catch (err: any) {
    console.error("[papers/summarize] Gemini error:", err.message);
    return res.status(502).json({ error: "Could not generate summary. Please try again." });
  }
});

// ─── Search route ─────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  const rawQuery = (req.query.q as string | undefined)?.trim();
  if (!rawQuery) {
    return res.status(400).json({ error: "Query parameter 'q' is required." });
  }

  const cacheKey = rawQuery.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    res.setHeader("X-Cache", "HIT");
    return res.json(cached.data);
  }

  const enhancedQuery = `${rawQuery} chemistry lab research`;
  const papers: any[] = [];
  const errors: string[] = [];

  // ── 1. Semantic Scholar (with retry) ───────────────────────────────────────
  try {
    const results = await withRetry(() => searchSemanticScholar(enhancedQuery), 3, 1200);
    papers.push(...results);
  } catch (err: any) {
    console.error("[papers] Semantic Scholar error:", err.message);
    errors.push(`Semantic Scholar: ${err.message}`);
  }

  // ── 2. OpenAlex (with retry, complementary free source) ───────────────────
  try {
    const results = await withRetry(() => searchOpenAlex(enhancedQuery), 2, 800);
    papers.push(...results);
  } catch (err: any) {
    console.error("[papers] OpenAlex error:", err.message);
    errors.push(`OpenAlex: ${err.message}`);
  }

  if (papers.length === 0) {
    return res.status(502).json({
      error: "Could not retrieve papers from any source. Please try again shortly.",
      details: errors,
    });
  }

  // Deduplicate by normalized title
  const seen = new Set<string>();
  const unique = papers.filter((p) => {
    const key = p.title.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Sort: papers with abstracts first, then alphabetically
  unique.sort((a, b) => {
    const aHasAbstract = a.abstract !== "No abstract available" ? 1 : 0;
    const bHasAbstract = b.abstract !== "No abstract available" ? 1 : 0;
    if (bHasAbstract !== aHasAbstract) return bHasAbstract - aHasAbstract;
    return a.title.localeCompare(b.title);
  });

  cache.set(cacheKey, { data: unique, fetchedAt: Date.now() });
  res.setHeader("X-Cache", "MISS");
  return res.json(unique);
});

export default router;
