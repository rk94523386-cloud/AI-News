import type { IncomingMessage } from 'http';
import {
  scrapeArticles,
  getCachedArticles,
  getArticleById,
  hasCachedArticles,
  clearCache,
  type Category,
} from '../scraper';

// Vercel will compile this TypeScript file as a Serverless Function
export default async function handler(req: any, res: any) {
  try {
    const rawUrl: string = req.url || req.originalUrl || '';
    const path = rawUrl.split('?')[0];

    if (path === '/api/health') {
      return res.json({ status: 'ok', timestamp: new Date().toISOString() });
    }

    if (path === '/api/trigger-scrape') {
      try {
        clearCache();
        const articles = await scrapeArticles(undefined, 20);
        return res.json({
          success: true,
          message: `Successfully scraped ${articles.length} fresh articles`,
          count: articles.length,
          articles,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        console.error('Error during manual scrape (serverless):', err?.message || err);
        return res.status(500).json({ success: false, error: 'Failed to scrape articles' });
      }
    }

    if (path === '/api/scrape-all' || path === '/api/scrape') {
      try {
        let articles = getCachedArticles();
        if (!hasCachedArticles()) {
          articles = await scrapeArticles(undefined, 20);
        }
        return res.json({ success: true, count: articles.length, articles, cached: true, timestamp: new Date().toISOString() });
      } catch (err: any) {
        console.error('Error fetching articles (serverless):', err?.message || err);
        return res.status(500).json({ success: false, error: 'Failed to fetch articles' });
      }
    }

    if (path.startsWith('/api/scrape/')) {
      try {
        const parts = path.split('/');
        const category = (parts[3] || '') as Category;
        const validCategories: Category[] = ['International', 'Sports', 'Technology', 'Health', 'Science'];
        if (!validCategories.includes(category)) {
          return res.status(400).json({ success: false, error: 'Invalid category', validCategories });
        }

        let articles = getCachedArticles();
        if (!hasCachedArticles()) {
          articles = await scrapeArticles(undefined, 20);
        }
        const categoryArticles = articles.filter((a) => a.category === category);
        return res.json({ success: true, category, count: categoryArticles.length, articles: categoryArticles, cached: true, timestamp: new Date().toISOString() });
      } catch (err: any) {
        console.error('Error fetching category (serverless):', err?.message || err);
        return res.status(500).json({ success: false, error: 'Failed to fetch category' });
      }
    }

    if (path === '/api/featured') {
      try {
        let articles = getCachedArticles();
        if (!hasCachedArticles()) {
          articles = await scrapeArticles(undefined, 20);
        }
        const featured = articles.slice(0, 10);
        return res.json({ success: true, count: featured.length, articles: featured, cached: true, timestamp: new Date().toISOString() });
      } catch (err: any) {
        console.error('Error fetching featured (serverless):', err?.message || err);
        return res.status(500).json({ success: false, error: 'Failed to fetch featured articles' });
      }
    }

    if (path.startsWith('/api/articles/') && path.split('/').length >= 3) {
      try {
        const parts = path.split('/');
        const id = parts[3];
        const article = getArticleById(id);
        if (!article) {
          return res.status(404).json({ error: 'Article not found', cached: true });
        }
        return res.json(article);
      } catch (err: any) {
        console.error('Error fetching article (serverless):', err?.message || err);
        return res.status(500).json({ error: 'Failed to fetch article' });
      }
    }

    if (path === '/api/articles') {
      try {
        const queryCategory = (req.query && req.query.category) || undefined;
        const validCategories: Category[] = ['International', 'Sports', 'Technology', 'Health', 'Science'];
        if (queryCategory && !validCategories.includes(queryCategory)) {
          return res.status(400).json({ error: 'Invalid category' });
        }
        let articles = getCachedArticles();
        if (!hasCachedArticles()) {
          articles = await scrapeArticles(undefined, 20);
        }
        if (queryCategory) {
          articles = articles.filter((a) => a.category === queryCategory);
        }
        return res.json(articles);
      } catch (err: any) {
        console.error('Error fetching legacy articles (serverless):', err?.message || err);
        return res.status(500).json({ error: 'Failed to fetch articles' });
      }
    }

    if (path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(404).send('Not found');
  } catch (e) {
    console.error('Unhandled error in serverless handler:', e);
    return res.status(500).json({ error: 'Internal Serverless Error' });
  }
}
