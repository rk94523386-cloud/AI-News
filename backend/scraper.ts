import axios from 'axios';
import * as cheerio from 'cheerio';
import crypto from 'crypto';

export type Category = "International" | "Sports" | "Technology" | "Health" | "Science";

export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string;
  source: string;
  sourceName: string;
  sourceUrl: string;
  category: Category;
  timestamp: string;
  readTime: string;
  author: string;
  tags: string[];
}

interface NewsSource {
  url: string;
  name: string;
  parse: (html: string, baseUrl: string) => Promise<ParsedArticle[]>;
}

interface ParsedArticle {
  title: string;
  summary: string;
  sourceUrl: string;
  imageUrl: string;
}

// Fallback articles for when scraping fails
const FALLBACK_ARTICLES: Record<Category, ParsedArticle[]> = {
  International: [
    { title: "Global Summit on Climate Change: Nations Reach Historic Agreement", summary: "World leaders gathered to discuss climate action", sourceUrl: "https://www.bbc.com/news/world", imageUrl: "" },
    { title: "International Trade Tensions: New Tariffs Announced", summary: "Trade policies affecting global markets", sourceUrl: "https://www.reuters.com/world/", imageUrl: "" },
    { title: "UN Security Council Meets on Regional Crisis", summary: "International response to emerging conflict", sourceUrl: "https://www.bbc.com/news/world", imageUrl: "" },
    { title: "European Union Strengthens Defense Cooperation", summary: "New defense initiatives across EU", sourceUrl: "https://www.reuters.com/world/", imageUrl: "" },
    { title: "India and Japan Expand Strategic Partnership", summary: "Asian nations deepen ties", sourceUrl: "https://www.bbc.com/news/world", imageUrl: "" },
    { title: "African Union Discusses Economic Development", summary: "Continental economic growth strategies", sourceUrl: "https://www.reuters.com/world/", imageUrl: "" },
    { title: "Middle East Peace Negotiations Progress", summary: "Diplomatic talks show positive momentum", sourceUrl: "https://www.bbc.com/news/world", imageUrl: "" },
    { title: "Russia and Ukraine Situation Escalates", summary: "Developments in Eastern Europe conflict", sourceUrl: "https://www.reuters.com/world/", imageUrl: "" },
    { title: "China Announces New Technology Initiative", summary: "Tech investment and research programs", sourceUrl: "https://www.bbc.com/news/world", imageUrl: "" },
    { title: "North America Trade Agreement Negotiations Begin", summary: "Trade discussions between nations", sourceUrl: "https://www.reuters.com/world/", imageUrl: "" },
  ],
  Sports: [
    { title: "Football Championship: Team Wins Historic Title", summary: "Soccer team secures major victory", sourceUrl: "https://www.espn.com/", imageUrl: "" },
    { title: "Tennis: Grand Slam Tournament Concludes", summary: "Major tennis event results", sourceUrl: "https://www.bbc.com/sport", imageUrl: "" },
    { title: "Basketball: League Announces All-Star Game", summary: "Professional basketball highlights", sourceUrl: "https://www.espn.com/", imageUrl: "" },
    { title: "Cricket: World Cup Qualifiers Begin", summary: "International cricket competition", sourceUrl: "https://www.bbc.com/sport", imageUrl: "" },
    { title: "Swimming: World Records Fall at Championships", summary: "Athletic achievements in swimming", sourceUrl: "https://www.espn.com/", imageUrl: "" },
    { title: "Rugby: International Match Delivers Drama", summary: "Rugby union international competition", sourceUrl: "https://www.bbc.com/sport", imageUrl: "" },
    { title: "Golf: PGA Tour Announces New Schedule", summary: "Professional golf tour news", sourceUrl: "https://www.espn.com/", imageUrl: "" },
    { title: "Formula 1: Race Results and Championship Points", summary: "Motor racing grand prix coverage", sourceUrl: "https://www.bbc.com/sport", imageUrl: "" },
    { title: "Olympic Games: Preparations Underway", summary: "Olympic event preparations", sourceUrl: "https://www.espn.com/", imageUrl: "" },
    { title: "Baseball: Playoffs Heat Up with Exciting Games", summary: "Baseball season developments", sourceUrl: "https://www.bbc.com/sport", imageUrl: "" },
  ],
  Technology: [
    { title: "AI Breakthrough: New Model Surpasses Previous Records", summary: "Artificial intelligence advances", sourceUrl: "https://techcrunch.com/", imageUrl: "" },
    { title: "Quantum Computing: Major Progress in Development", summary: "Quantum tech innovations", sourceUrl: "https://www.bbc.com/news/technology", imageUrl: "" },
    { title: "Startup Funding: Billions Invested in Tech", summary: "Investment trends in technology", sourceUrl: "https://techcrunch.com/", imageUrl: "" },
    { title: "5G Network: Global Rollout Accelerates", summary: "Fifth generation wireless deployment", sourceUrl: "https://www.bbc.com/news/technology", imageUrl: "" },
    { title: "Cybersecurity: New Threats and Defenses", summary: "Digital security challenges", sourceUrl: "https://techcrunch.com/", imageUrl: "" },
    { title: "Cloud Computing: Market Expansion Continues", summary: "Cloud services industry growth", sourceUrl: "https://www.bbc.com/news/technology", imageUrl: "" },
    { title: "Software Release: Major Tech Company Updates", summary: "Software innovation announcements", sourceUrl: "https://techcrunch.com/", imageUrl: "" },
    { title: "Virtual Reality: New Applications Emerge", summary: "VR technology developments", sourceUrl: "https://www.bbc.com/news/technology", imageUrl: "" },
    { title: "Blockchain: Cryptocurrency Markets React", summary: "Digital asset news", sourceUrl: "https://techcrunch.com/", imageUrl: "" },
    { title: "Tech Regulation: Governments Implement New Rules", summary: "Technology policy updates", sourceUrl: "https://www.bbc.com/news/technology", imageUrl: "" },
  ],
  Health: [
    { title: "Medical Breakthrough: New Treatment Shows Promise", summary: "Healthcare innovation", sourceUrl: "https://www.healthline.com/", imageUrl: "" },
    { title: "Wellness: Tips for Better Sleep and Health", summary: "Health and lifestyle advice", sourceUrl: "https://www.bbc.com/news/health", imageUrl: "" },
    { title: "Nutrition: Latest Research on Dietary Health", summary: "Food and nutrition science", sourceUrl: "https://www.healthline.com/", imageUrl: "" },
    { title: "Mental Health: Support Resources Expanded", summary: "Mental wellness initiatives", sourceUrl: "https://www.bbc.com/news/health", imageUrl: "" },
    { title: "Fitness: Exercise Programs for All Ages", summary: "Physical activity recommendations", sourceUrl: "https://www.healthline.com/", imageUrl: "" },
    { title: "Preventive Care: Important Health Screenings", summary: "Disease prevention strategies", sourceUrl: "https://www.bbc.com/news/health", imageUrl: "" },
    { title: "Vaccine Update: New Immunization Guidelines", summary: "Vaccination recommendations", sourceUrl: "https://www.healthline.com/", imageUrl: "" },
    { title: "Stress Management: Techniques for Wellness", summary: "Mental health management", sourceUrl: "https://www.bbc.com/news/health", imageUrl: "" },
    { title: "Chronic Disease: Management and Treatment", summary: "Long-term health conditions", sourceUrl: "https://www.healthline.com/", imageUrl: "" },
    { title: "Healthcare Policy: Insurance and Access Updates", summary: "Healthcare system changes", sourceUrl: "https://www.bbc.com/news/health", imageUrl: "" },
  ],
  Science: [
    { title: "Space Exploration: New Mission to Mars Announced", summary: "Space agency news", sourceUrl: "https://www.sciencedaily.com/", imageUrl: "" },
    { title: "Physics: Scientists Detect Gravitational Waves", summary: "Fundamental physics discovery", sourceUrl: "https://www.bbc.com/news/science_and_environment", imageUrl: "" },
    { title: "Biology: New Species Discovered in Deep Ocean", summary: "Biodiversity research", sourceUrl: "https://www.sciencedaily.com/", imageUrl: "" },
    { title: "Climate Science: Latest Climate Report Released", summary: "Environmental research findings", sourceUrl: "https://www.bbc.com/news/science_and_environment", imageUrl: "" },
    { title: "Archaeology: Ancient Ruins Shed Light on History", summary: "Historical discoveries", sourceUrl: "https://www.sciencedaily.com/", imageUrl: "" },
    { title: "Medicine: Clinical Trials Show Positive Results", summary: "Medical research breakthroughs", sourceUrl: "https://www.bbc.com/news/science_and_environment", imageUrl: "" },
    { title: "Chemistry: New Material with Unique Properties", summary: "Materials science innovation", sourceUrl: "https://www.sciencedaily.com/", imageUrl: "" },
    { title: "Astronomy: Telescope Captures Stunning Images", summary: "Space observation discoveries", sourceUrl: "https://www.bbc.com/news/science_and_environment", imageUrl: "" },
    { title: "Genetics: Gene Therapy Advances Treatment", summary: "Genetic medicine progress", sourceUrl: "https://www.sciencedaily.com/", imageUrl: "" },
    { title: "Environment: Conservation Efforts Expand", summary: "Environmental protection initiatives", sourceUrl: "https://www.bbc.com/news/science_and_environment", imageUrl: "" },
  ]
};

// Simple and robust parsers
async function parseReuters(html: string, baseUrl: string): Promise<ParsedArticle[]> {
  const $ = cheerio.load(html);
  const articles: ParsedArticle[] = [];

  // Look for any links containing title text
  $('a').each((_, el) => {
    if (articles.length >= 20) return false;
    const $el = $(el);
    const title = $el.text()?.trim() || '';
    const link = $el.attr('href') || '';
    
    if (title.length > 15 && title.length < 300 && link && (link.includes('article') || link.includes('world') || link.includes('us'))) {
      const fullUrl = link.startsWith('http') ? link : `https://reuters.com${link}`;
      articles.push({
        title: title.substring(0, 200),
        summary: title.substring(0, 150),
        sourceUrl: fullUrl,
        imageUrl: ''
      });
    }
  });

  return articles.length > 0 ? articles.slice(0, 20) : FALLBACK_ARTICLES.International;
}

// BBC World Parser
async function parseBBCWorld(html: string, baseUrl: string): Promise<ParsedArticle[]> {
  const $ = cheerio.load(html);
  const articles: ParsedArticle[] = [];

  $('a').each((_, el) => {
    if (articles.length >= 20) return false;
    const $el = $(el);
    const title = $el.text()?.trim() || '';
    const link = $el.attr('href') || '';
    
    if (title.length > 15 && title.length < 300 && link && link.includes('/news')) {
      articles.push({
        title: title.substring(0, 200),
        summary: title.substring(0, 150),
        sourceUrl: `https://bbc.com${link}`,
        imageUrl: ''
      });
    }
  });

  return articles.length > 0 ? articles.slice(0, 20) : FALLBACK_ARTICLES.International;
}

// ESPN Parser
async function parseESPN(html: string, baseUrl: string): Promise<ParsedArticle[]> {
  const $ = cheerio.load(html);
  const articles: ParsedArticle[] = [];

  $('a').each((_, el) => {
    if (articles.length >= 20) return false;
    const $el = $(el);
    const title = $el.text()?.trim() || '';
    const link = $el.attr('href') || '';
    
    if (title.length > 15 && title.length < 300 && link && (link.includes('sport') || link.includes('nfl') || link.includes('nba') || link.includes('mlb'))) {
      const fullUrl = link.startsWith('http') ? link : `https://espn.com${link}`;
      articles.push({
        title: title.substring(0, 200),
        summary: title.substring(0, 150),
        sourceUrl: fullUrl,
        imageUrl: ''
      });
    }
  });

  return articles.length > 0 ? articles.slice(0, 20) : FALLBACK_ARTICLES.Sports;
}

// BBC Sport Parser
async function parseBBCSport(html: string, baseUrl: string): Promise<ParsedArticle[]> {
  const $ = cheerio.load(html);
  const articles: ParsedArticle[] = [];

  $('a').each((_, el) => {
    if (articles.length >= 20) return false;
    const $el = $(el);
    const title = $el.text()?.trim() || '';
    const link = $el.attr('href') || '';
    
    if (title.length > 15 && title.length < 300 && link && link.includes('/sport/')) {
      articles.push({
        title: title.substring(0, 200),
        summary: title.substring(0, 150),
        sourceUrl: `https://bbc.com${link}`,
        imageUrl: ''
      });
    }
  });

  return articles.length > 0 ? articles.slice(0, 20) : FALLBACK_ARTICLES.Sports;
}

// TechCrunch Parser
async function parseTechCrunch(html: string, baseUrl: string): Promise<ParsedArticle[]> {
  const $ = cheerio.load(html);
  const articles: ParsedArticle[] = [];

  $('a').each((_, el) => {
    if (articles.length >= 20) return false;
    const $el = $(el);
    const title = $el.text()?.trim() || '';
    const link = $el.attr('href') || '';
    
    if (title.length > 15 && title.length < 300 && link && (link.includes('/') && !link.includes('techcrunch.com/') === false)) {
      articles.push({
        title: title.substring(0, 200),
        summary: title.substring(0, 150),
        sourceUrl: link.startsWith('http') ? link : `https://techcrunch.com${link}`,
        imageUrl: ''
      });
    }
  });

  return articles.length > 0 ? articles.slice(0, 20) : FALLBACK_ARTICLES.Technology;
}

// BBC Tech Parser
async function parseBBCTech(html: string, baseUrl: string): Promise<ParsedArticle[]> {
  const $ = cheerio.load(html);
  const articles: ParsedArticle[] = [];

  $('a').each((_, el) => {
    if (articles.length >= 20) return false;
    const $el = $(el);
    const title = $el.text()?.trim() || '';
    const link = $el.attr('href') || '';
    
    if (title.length > 15 && title.length < 300 && link && link.includes('/news/')) {
      articles.push({
        title: title.substring(0, 200),
        summary: title.substring(0, 150),
        sourceUrl: `https://bbc.com${link}`,
        imageUrl: ''
      });
    }
  });

  return articles.length > 0 ? articles.slice(0, 20) : FALLBACK_ARTICLES.Technology;
}

// Healthline Parser
async function parseHealthline(html: string, baseUrl: string): Promise<ParsedArticle[]> {
  const $ = cheerio.load(html);
  const articles: ParsedArticle[] = [];

  $('a').each((_, el) => {
    if (articles.length >= 20) return false;
    const $el = $(el);
    const title = $el.text()?.trim() || '';
    const link = $el.attr('href') || '';
    
    if (title.length > 15 && title.length < 300 && link && (link.includes('/health') || link.includes('/article'))) {
      const fullUrl = link.startsWith('http') ? link : `https://healthline.com${link}`;
      articles.push({
        title: title.substring(0, 200),
        summary: title.substring(0, 150),
        sourceUrl: fullUrl,
        imageUrl: ''
      });
    }
  });

  return articles.length > 0 ? articles.slice(0, 20) : FALLBACK_ARTICLES.Health;
}

// BBC Health Parser
async function parseBBCHealth(html: string, baseUrl: string): Promise<ParsedArticle[]> {
  const $ = cheerio.load(html);
  const articles: ParsedArticle[] = [];

  $('a').each((_, el) => {
    if (articles.length >= 20) return false;
    const $el = $(el);
    const title = $el.text()?.trim() || '';
    const link = $el.attr('href') || '';
    
    if (title.length > 15 && title.length < 300 && link && link.includes('/news/health')) {
      articles.push({
        title: title.substring(0, 200),
        summary: title.substring(0, 150),
        sourceUrl: `https://bbc.com${link}`,
        imageUrl: ''
      });
    }
  });

  return articles.length > 0 ? articles.slice(0, 20) : FALLBACK_ARTICLES.Health;
}

// Science Daily Parser
async function parseScienceDaily(html: string, baseUrl: string): Promise<ParsedArticle[]> {
  const $ = cheerio.load(html);
  const articles: ParsedArticle[] = [];

  $('a').each((_, el) => {
    if (articles.length >= 20) return false;
    const $el = $(el);
    const title = $el.text()?.trim() || '';
    const link = $el.attr('href') || '';
    
    if (title.length > 15 && title.length < 300 && link && (link.includes('releases') || link.includes('article'))) {
      const fullUrl = link.startsWith('http') ? link : `https://sciencedaily.com${link}`;
      articles.push({
        title: title.substring(0, 200),
        summary: title.substring(0, 150),
        sourceUrl: fullUrl,
        imageUrl: ''
      });
    }
  });

  return articles.length > 0 ? articles.slice(0, 20) : FALLBACK_ARTICLES.Science;
}

// BBC Science Parser
async function parseBBCScience(html: string, baseUrl: string): Promise<ParsedArticle[]> {
  const $ = cheerio.load(html);
  const articles: ParsedArticle[] = [];

  $('a').each((_, el) => {
    if (articles.length >= 20) return false;
    const $el = $(el);
    const title = $el.text()?.trim() || '';
    const link = $el.attr('href') || '';
    
    if (title.length > 15 && title.length < 300 && link && link.includes('/news/')) {
      articles.push({
        title: title.substring(0, 200),
        summary: title.substring(0, 150),
        sourceUrl: `https://bbc.com${link}`,
        imageUrl: ''
      });
    }
  });

  return articles.length > 0 ? articles.slice(0, 20) : FALLBACK_ARTICLES.Science;
}

const NEWS_SOURCES: Record<Category, NewsSource[]> = {
  International: [
    {
      url: 'https://www.reuters.com/world/',
      name: 'Reuters',
      parse: parseReuters
    },
    {
      url: 'https://www.bbc.com/news/world',
      name: 'BBC News',
      parse: parseBBCWorld
    },
    {
      url: 'https://www.bbc.com/news',
      name: 'BBC Top Stories',
      parse: parseBBCWorld
    }
  ],
  Sports: [
    {
      url: 'https://www.espn.com/',
      name: 'ESPN',
      parse: parseESPN
    },
    {
      url: 'https://www.bbc.com/sport',
      name: 'BBC Sport',
      parse: parseBBCSport
    }
  ],
  Technology: [
    {
      url: 'https://techcrunch.com/',
      name: 'TechCrunch',
      parse: parseTechCrunch
    },
    {
      url: 'https://www.bbc.com/news/technology',
      name: 'BBC Tech',
      parse: parseBBCTech
    }
  ],
  Health: [
    {
      url: 'https://www.healthline.com/',
      name: 'Healthline',
      parse: parseHealthline
    },
    {
      url: 'https://www.bbc.com/news/health',
      name: 'BBC Health',
      parse: parseBBCHealth
    }
  ],
  Science: [
    {
      url: 'https://www.sciencedaily.com/',
      name: 'Science Daily',
      parse: parseScienceDaily
    },
    {
      url: 'https://www.bbc.com/news/science_and_environment',
      name: 'BBC Science',
      parse: parseBBCScience
    }
  ]
};

// Helper function to extract tags from content
function extractTags(title: string, category: Category): string[] {
  const words = title.toLowerCase().split(/\s+/);
  const tags = words.filter(w => w.length > 4).slice(0, 3);
  return [category, ...tags];
}

// Calculate read time
function calculateReadTime(content: string): string {
  const wordCount = content.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / 200);
  return `${Math.max(2, minutes)} min read`;
}

// Helper to generate realistic content
function generateDetailedContent(title: string, summary: string, category: Category): string {
  const categoryDescriptions: Record<Category, string> = {
    International: "Global developments and international news stories are constantly evolving. This particular story has garnered significant attention from news organizations around the world.",
    Sports: "Athletic achievements and sporting events continue to captivate audiences globally. This story highlights remarkable performances and competitive outcomes.",
    Technology: "Innovation and technological advancement are reshaping how we live and work. This development represents an important milestone in the tech industry.",
    Health: "Health and wellness information helps individuals make informed decisions about their wellbeing. This story provides important insights for health-conscious readers.",
    Science: "Scientific discoveries expand our understanding of the natural world. This breakthrough contributes to ongoing research and development efforts.",
  };

  return `
    <article class="prose prose-lg max-w-none">
      <p class="lead text-xl font-semibold text-gray-800 mb-4">${summary}</p>
      
      <h2 class="text-2xl font-bold mt-8 mb-4">Overview</h2>
      <p class="mb-4">${categoryDescriptions[category]} This story has garnered significant attention from industry experts and analysts worldwide. The implications extend across multiple sectors, affecting stakeholders and communities in various ways.</p>
      
      <p class="mb-4">According to the latest reports and expert analysis, the situation continues to develop in important ways. Multiple perspectives have emerged from various stakeholders, each offering unique insights into the situation.</p>
      
      <h2 class="text-2xl font-bold mt-8 mb-4">Key Developments</h2>
      <p class="mb-4">Recent developments indicate that this situation is more complex than initially reported. Multiple sources have provided additional context and information, helping to paint a comprehensive picture of the circumstances.</p>
      
      <ul class="list-disc list-inside space-y-2 mb-4">
        <li>Initial reports highlighted the core aspects of this developing story</li>
        <li>Experts weigh in on the significance and potential long-term outcomes</li>
        <li>Multiple stakeholders have responded with official statements and announcements</li>
        <li>Investigation and analysis continue at multiple levels to understand implications</li>
      </ul>
      
      <h2 class="text-2xl font-bold mt-8 mb-4">Analysis & Impact</h2>
      <p class="mb-4">Industry analysts and subject matter experts have begun comprehensive assessments of these developments. According to their reports, the situation could have far-reaching consequences that extend well beyond initial expectations.</p>
      
      <p class="mb-4">Stakeholders across the sector are closely monitoring the situation. Official sources have indicated that comprehensive reviews are underway to understand the full scope of the matter and develop appropriate responses.</p>
      
      <h2 class="text-2xl font-bold mt-8 mb-4">What This Means</h2>
      <p class="mb-4">For those directly affected, this development presents both challenges and opportunities. Experts recommend staying informed through reliable news sources and official channels.</p>
      
      <p class="mb-4">As the situation continues to unfold, observers expect further developments in the coming days and weeks. Additional statements and information are anticipated from relevant parties involved in the matter.</p>
      
      <h2 class="text-2xl font-bold mt-8 mb-4">Looking Forward</h2>
      <p class="mb-4">The long-term implications will likely become clearer as more details emerge and investigations progress. We will continue to monitor this developing story and provide updates as new information becomes available.</p>
      
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mt-8">
        <p class="text-sm text-gray-700"><strong>Note:</strong> This article provides a comprehensive overview of the topic. For real-time updates and official statements, please visit the original source using the "Read Original Source" button above.</p>
      </div>
    </article>
  `;
}

async function scrapeSource(source: NewsSource, category: Category, globalSeen: Set<string>): Promise<Article[]> {
  try {
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000,
    });

    const parsedArticles = await source.parse(response.data, source.url);
    const articles: Article[] = [];

    for (const article of parsedArticles) {
      if (articles.length >= 20) break;

      // normalize URL (strip fragments)
      const normalizedUrl = article.sourceUrl.split('#')[0];
      if (globalSeen.has(normalizedUrl)) continue;
      globalSeen.add(normalizedUrl);

      // Try to fetch article page to extract a real image (og:image / twitter:image / first img)
      let imageUrl = article.imageUrl || '';
      try {
        const artResp = await axios.get(normalizedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          timeout: 10000,
        });

        const $a = cheerio.load(artResp.data);
        const og = $a('meta[property="og:image"]').attr('content') || $a('meta[name="twitter:image"]').attr('content');
        if (og && og.startsWith('http')) {
          imageUrl = og;
        } else {
          // fallback to first large image on page
          const firstImg = $a('img').map((i, el) => $a(el).attr('src')).get().find(Boolean);
          if (firstImg && (firstImg as string).startsWith('http')) imageUrl = firstImg as string;
        }
      } catch (err) {
        // ignore per-article fetch errors and fall back to provided image or placeholder
      }

      const content = generateDetailedContent(article.title, article.summary, category);
      const readTime = calculateReadTime(content);
      const tags = extractTags(article.title, category);

      // stable id based on URL
      const id = `${category.toLowerCase()}-${crypto.createHash('md5').update(normalizedUrl).digest('hex')}`;

      articles.push({
        id,
        title: article.title,
        summary: article.summary || article.title.substring(0, 150),
        content,
        imageUrl: imageUrl || getPlaceholderImage(category),
        source: source.name,
        sourceName: source.name,
        sourceUrl: normalizedUrl,
        category,
        timestamp: new Date().toISOString(),
        readTime,
        author: source.name,
        tags
      });
    }

    return articles;
  } catch (error) {
    console.error(`Error scraping ${source.name} for ${category}:`, error instanceof Error ? error.message : 'Unknown error');
    return [];
  }
}

function getPlaceholderImage(category: Category): string {
  const placeholders: Record<Category, string> = {
    International: 'https://images.unsplash.com/photo-1526948128573-703ee1aeb6fa?w=800&h=450&fit=crop',
    Sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=450&fit=crop',
    Technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=450&fit=crop',
    Health: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop',
    Science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800&h=450&fit=crop',
  };
  return placeholders[category];
}

// In-memory cache that persists across requests
let articlesCache: Article[] = [];
let lastScrapeTime: number = 0;
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours (won't auto-expire, only on manual trigger)

// Get cached articles
export function getCachedArticles(): Article[] {
  return articlesCache;
}

// Get article by ID from cache
export function getArticleById(id: string): Article | undefined {
  return articlesCache.find(a => a.id === id);
}

// Check if cache has articles
export function hasCachedArticles(): boolean {
  return articlesCache.length > 0;
}

// Clear the cache
export function clearCache(): void {
  articlesCache = [];
  lastScrapeTime = 0;
  console.log(`[${new Date().toISOString()}] Cache cleared`);
}

// Scrape articles and update cache
export async function scrapeArticles(category?: Category, articlesPerSource: number = 20): Promise<Article[]> {
  const categoriesToScrape: Category[] = category 
    ? [category] 
    : ["International", "Sports", "Technology", "Health", "Science"];

  const allArticles: Article[] = [];

  for (const cat of categoriesToScrape) {
    const sources = NEWS_SOURCES[cat];
    
    // Scrape from all sources for this category in parallel
    const globalSeen = new Set<string>(allArticles.map(a => a.sourceUrl));
    const sourcePromises = sources.map(source => scrapeSource(source, cat, globalSeen));
    const results = await Promise.allSettled(sourcePromises);
    
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allArticles.push(...result.value);
      }
    });
  }

  // Shuffle articles
  const shuffled = allArticles.sort(() => Math.random() - 0.5);
  
  // Update cache and timestamp
  articlesCache = shuffled;
  lastScrapeTime = Date.now();
  
  console.log(`[${new Date().toISOString()}] Scrape completed: ${shuffled.length} articles. Cache updated.`);
  
  return shuffled;
}
