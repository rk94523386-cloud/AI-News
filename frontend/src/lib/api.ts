import { Article, Category } from "./mockData";

const API_BASE = "/api";

// Fetch articles from cache (no scraping on page load)
export async function fetchArticlesFromAPI(category?: Category): Promise<Article[]> {
  try {
    const url = category 
      ? `${API_BASE}/scrape/${encodeURIComponent(category)}`
      : `${API_BASE}/scrape-all`;
    
    console.log(`[Client] Fetching articles from cache: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch articles: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle both old format (array) and new format (object with articles property)
    const articles = Array.isArray(data) ? data : data.articles || [];
    
    console.log(`[Client] Received ${articles.length} articles from cache`);
    
    return articles;
  } catch (error) {
    console.error('[Client] Error fetching articles:', error);
    throw error;
  }
}

// Legacy endpoint for backward compatibility
export async function fetchArticlesFromLegacyAPI(category?: Category): Promise<Article[]> {
  const url = category 
    ? `${API_BASE}/articles?category=${encodeURIComponent(category)}`
    : `${API_BASE}/articles`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch articles: ${response.statusText}`);
  }
  
  return response.json();
}

export async function fetchArticleByIdFromAPI(id: string): Promise<Article> {
  const response = await fetch(`${API_BASE}/articles/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch article: ${response.statusText}`);
  }
  
  return response.json();
}

// Manual trigger scraping - ONLY way to refresh content
export async function triggerManualScrape(): Promise<{ success: boolean; count: number; articles: Article[] }> {
  // Backend exposes this as GET (see /backend/routes.ts), so use GET here
  const response = await fetch(`${API_BASE}/trigger-scrape`);
  
  if (!response.ok) {
    throw new Error(`Failed to trigger scrape: ${response.statusText}`);
  }
  
  return response.json();
}
