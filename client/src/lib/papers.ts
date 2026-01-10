import { type Paper } from "@shared/schema";

const SEMANTIC_SCHOLAR_API = "https://api.semanticscholar.org/graph/v1";
const GOOGLE_SCHOLAR_PROXY = "https://serpapi.com/search.json";
const SCIENCE_DIRECT_API = "https://api.elsevier.com/content/search/sciencedirect";

export async function searchPapers(query: string): Promise<Paper[]> {
  try {
    // Construct search queries focused on chemistry and lab safety
    const enhancedQuery = `${query} chemistry safety research`;
    const papers: Paper[] = [];

    // Semantic Scholar search
    try {
      const ssResponse = await fetch(
        `${SEMANTIC_SCHOLAR_API}/paper/search?query=${encodeURIComponent(enhancedQuery)}&fields=title,abstract,url,year,authors,venue`,
        {
          headers: {
            "Accept": "application/json"
          }
        }
      );

      if (ssResponse.ok) {
        const ssData = await ssResponse.json();
        if (ssData.data && Array.isArray(ssData.data)) {
          const ssPapers = ssData.data.map((paper: any) => ({
            id: `ss-${paper.paperId}`,
            title: paper.title || "Untitled",
            abstract: paper.abstract || "No abstract available",
            url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
            cached: false
          }));
          papers.push(...ssPapers);
        }
      }
    } catch (error) {
      console.error('Semantic Scholar search error:', error);
    }

    // Google Scholar search (via proxy)
    try {
      const gsResponse = await fetch(
        `${GOOGLE_SCHOLAR_PROXY}?engine=google_scholar&q=${encodeURIComponent(enhancedQuery)}&api_key=${process.env.SERPAPI_KEY}`,
      );

      if (gsResponse.ok) {
        const gsData = await gsResponse.json();
        if (gsData.organic_results && Array.isArray(gsData.organic_results)) {
          const gsPapers = gsData.organic_results.map((result: any) => ({
            id: `gs-${result.result_id}`,
            title: result.title,
            abstract: result.snippet || "No abstract available",
            url: result.link,
            cached: false
          }));
          papers.push(...gsPapers);
        }
      }
    } catch (error) {
      console.error('Google Scholar search error:', error);
    }

    // ScienceDirect search
    try {
      const sdResponse = await fetch(
        `${SCIENCE_DIRECT_API}?query=${encodeURIComponent(enhancedQuery)}`,
        {
          headers: {
            "X-ELS-APIKey": process.env.ELSEVIER_API_KEY || "",
            "Accept": "application/json"
          }
        }
      );

      if (sdResponse.ok) {
        const sdData = await sdResponse.json();
        if (sdData.results && Array.isArray(sdData.results)) {
          const sdPapers = sdData.results.map((result: any) => ({
            id: `sd-${result.doi}`,
            title: result.title,
            abstract: result.description || "No abstract available",
            url: result.link || `https://doi.org/${result.doi}`,
            cached: false
          }));
          papers.push(...sdPapers);
        }
      }
    } catch (error) {
      console.error('ScienceDirect search error:', error);
    }

    // ResearchGate integration placeholder
    // Note: ResearchGate doesn't provide a public API
    // TODO: Implement alternative method to fetch ResearchGate papers

    // If all APIs fail, throw an error
    if (papers.length === 0) {
      throw new Error("Unable to fetch papers from any source");
    }

    // Remove duplicates based on title similarity
    const uniquePapers = Array.from(new Map(
      papers.map(paper => [paper.title.toLowerCase(), paper])
    ).values());

    // Sort papers by title
    return uniquePapers.sort((a, b) => a.title.localeCompare(b.title));

  } catch (error: any) {
    console.error('Paper search error:', error);
    throw new Error(`Failed to search papers: ${error.message}`);
  }
}