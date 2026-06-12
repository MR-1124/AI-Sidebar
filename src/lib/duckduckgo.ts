// ─────────────────────────────────────────────────────────────
// DuckDuckGo Web Search Client (HTML Scraper)
// ─────────────────────────────────────────────────────────────

export interface DDGSearchResult {
  title: string;
  url: string;
  content: string;
}

export interface DDGSearchResponse {
  results: DDGSearchResult[];
  query: string;
}

/**
 * Perform a web search using DuckDuckGo HTML Lite version.
 * This is done without an API key by fetching and parsing the HTML.
 */
export async function performDuckDuckGoSearch(
  query: string,
  maxResults: number = 5
): Promise<DDGSearchResponse> {
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const results: DDGSearchResult[] = [];
    const resultNodes = doc.querySelectorAll('.result__body');

    for (let i = 0; i < Math.min(resultNodes.length, maxResults); i++) {
      const node = resultNodes[i];
      const titleNode = node.querySelector('.result__title .result__a');
      const snippetNode = node.querySelector('.result__snippet');
      
      // DuckDuckGo sometimes routes URLs through their own redirector. 
      // We can grab the direct URL from the href or the text.
      let url = titleNode?.getAttribute('href') || '';
      if (url.startsWith('//duckduckgo.com/l/?uddg=')) {
        try {
          const urlObj = new URL('https:' + url);
          url = decodeURIComponent(urlObj.searchParams.get('uddg') || url);
        } catch (e) {
          // fallback
        }
      }

      const title = titleNode?.textContent?.trim() || '';
      const content = snippetNode?.textContent?.trim() || '';

      if (title && url && content) {
        results.push({ title, url, content });
      }
    }

    return {
      query,
      results
    };
  } catch (error: any) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('DuckDuckGo Search error:', errorMsg);
    throw new Error(`DuckDuckGo search failed: ${errorMsg}`);
  }
}
