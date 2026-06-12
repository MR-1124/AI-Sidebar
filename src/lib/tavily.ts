// ─────────────────────────────────────────────────────────────
// Tavily Web Search Client
// ─────────────────────────────────────────────────────────────

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  answer?: string;
}

/**
 * Perform a web search using the Tavily API.
 */
export async function performTavilySearch(
  query: string,
  apiKey: string,
  maxResults: number = 5
): Promise<TavilySearchResponse> {
  if (!apiKey) {
    throw new Error('Tavily API key is missing.');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      include_answer: false,
      include_images: false,
      include_raw_content: false,
      max_results: maxResults,
    }),
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) errorMsg = errorData.detail;
      else if (errorData.error) errorMsg = errorData.error;
    } catch {
      // Ignored
    }
    throw new Error(`Tavily search failed: ${errorMsg}`);
  }

  return response.json();
}
