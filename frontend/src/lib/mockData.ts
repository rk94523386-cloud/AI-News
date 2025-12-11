import { addHours, subHours } from "date-fns";

// Base Images
import imgInternational from "@assets/stock_images/international_news_g_a1f507eb.jpg";
import imgSports from "@assets/stock_images/sports_action_stadiu_4e52c5d5.jpg";
import imgTech from "@assets/stock_images/technology_futuristi_499af580.jpg";
import imgHealth from "@assets/stock_images/health_medical_welln_017ada52.jpg";
import imgScience from "@assets/stock_images/science_laboratory_r_99b960a9.jpg";

// New Images
import imgInternational2 from "@assets/stock_images/international_politi_0050b8c8.jpg";
import imgInternational3 from "@assets/stock_images/global_trade_shippin_b4a8b319.jpg";
import imgInternational4 from "@assets/stock_images/diplomats_shaking_ha_07955dd6.jpg";

import imgSports2 from "@assets/stock_images/soccer_match_goal_ce_9785d200.jpg";
import imgSports3 from "@assets/stock_images/basketball_game_dunk_e7dd99a9.jpg";
import imgSports4 from "@assets/stock_images/tennis_match_grand_s_513488f6.jpg";

import imgTech2 from "@assets/stock_images/artificial_intellige_e50e9468.jpg";
import imgTech3 from "@assets/stock_images/robot_arm_manufactur_1780a744.jpg";
import imgTech4 from "@assets/stock_images/virtual_reality_head_2bce8b30.jpg";

import imgHealth2 from "@assets/stock_images/doctor_examining_pat_e778552b.jpg";
import imgHealth3 from "@assets/stock_images/healthy_food_vegetab_5fb3a203.jpg";
import imgHealth4 from "@assets/stock_images/yoga_meditation_well_61a05aac.jpg";

import imgScience2 from "@assets/stock_images/space_rocket_launch__f2e64ca6.jpg";
import imgScience3 from "@assets/stock_images/microscope_biology_c_6b20fd70.jpg";
import imgScience4 from "@assets/stock_images/renewable_energy_sol_56d0d37a.jpg";

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

const CATEGORIES: Category[] = ["International", "Sports", "Technology", "Health", "Science"];

const SAMPLE_TITLES: Record<Category, string[]> = {
  International: [
    "Global Summit Reaches Historic Agreement on Climate Action",
    "Diplomatic Talks Resume Amidst Rising Tensions in Eastern Europe",
    "Economic Forum Predicts Shift in Global Trade Patterns",
    "New Trade Deal Signed Between Major Asian Economies",
    "UN Security Council Holds Emergency Meeting",
    "International Aid Convoy Reaches Remote Regions",
    "Global Markets React to Central Bank Policy Changes",
    "Cross-Border Infrastructure Project Gets Green Light",
    "Election Results in Major European Power Surprise Analysts",
    "International Space Station Welcomes New Crew Members",
    "Peace Treaty Signed After Decades of Conflict",
    "Global Water Scarcity Crisis Deepens in Arid Regions",
    "International Cyber Security Task Force Formed",
    "Diplomats Expelled Following Espionage Scandal",
    "World Leaders Gather for Annual G20 Summit"
  ],
  Sports: [
    "Underdog Team Secures Championship in Stunning Upset",
    "Star Athlete Breaks Decade-Old World Record",
    "Olympic Committee Announces New Host City for 2032",
    "Premier League Transfer Window Closes with Record Spending",
    "Tennis Legend Announces Retirement After Illustrious Career",
    "NBA Finals: Game 7 Decides the Champion Tonight",
    "Formula 1 Introduces Radical New Car Regulations",
    "World Cup Qualifiers: National Team Secures Spot",
    "Marathon Winner Disqualified After Controversial Ruling",
    "Cricket World Cup: Hosts Eliminated in Group Stage",
    "Young Prodigy Shocks the World with Gold Medal Win",
    "Controversial Referee Call Sparks Stadium Riot",
    "Athletes Village Construction Completed Ahead of Schedule",
    "Doping Scandal Rocks Cycling World Tour",
    "New Stadium Unveiled with State-of-the-Art Features"
  ],
  Technology: [
    "Breakthrough in Quantum Computing Achieved by Researchers",
    "New AI Model Surpasses Human Performance in Complex Tasks",
    "Major Tech Giant Unveils Revolutionary AR Glasses",
    "Cybersecurity Firm Warns of Sophisticated New Ransomware",
    "Electric Vehicle Sales Surpass Traditional Cars in Key Markets",
    "SpaceX Successfully Lands Starship After Orbital Flight",
    "New Battery Technology Promises Week-Long Phone Charge",
    "Blockchain Technology Adopted for National Voting System",
    "Social Media Platform Launches Decentralized Protocol",
    "5G Network Expansion Reaches 90% of Global Population",
    "Smart Home Standard Matter 2.0 Released",
    "Foldable Phones Finally Reach Mass Market Adoption",
    "Tech Layoffs Continue as Industry Resets Expectations",
    "Open Source Community Celebrates Major Linux Kernel Release",
    "Startups Focusing on Climate Tech See Funding Boom"
  ],
  Health: [
    "New Vaccine Shows 99% Efficacy Against Tropical Disease",
    "Study Links Mediterranean Diet to Increased Longevity",
    "Global Health Organization Declares End of Pandemic Phase",
    "Breakthrough Treatment for Alzheimer's Shows Promise in Trials",
    "Mental Health App Usage Surges Among Young Adults",
    "New Guidelines Released for Daily Exercise Requirements",
    "Robotic Surgery Success Rates Improve Drastically",
    "Telemedicine Adoption Permanently Shifts Healthcare Delivery",
    "Nutritional Science: The Benefits of Plant-Based Proteins",
    "Sleep Study Reveals Impact of Blue Light on Circadian Rhythms",
    "Common Virus Linked to Chronic Fatigue Syndrome",
    "New Antibiotic Discovered in Deep Sea Bacteria",
    "Yoga and Meditation Proven to Reduce Hypertension",
    "Genetic Screening for Cancer Becomes Standard Procedure",
    "Wearable Health Monitors Detect Heart Conditions Early"
  ],
  Science: [
    "NASA Telescope Captures Clearest Image of Distant Galaxy",
    "New Species of Marine Life Discovered in Deep Ocean Trench",
    "Archaeologists Unearth Ancient City Buried for Millennia",
    "Physics Experiment Confirms Existence of Theoretical Particle",
    "Climate Scientists Warn of Accelerating Ice Shelf Collapse",
    "Mars Rover Finds Definitive Evidence of Past Water Flow",
    "Gene Editing Technology Cures Genetic Blindness in Mice",
    "Astronomers Detect Radio Signal from Deep Space",
    "Study on Bee Populations Highlights Critical Ecosystem Role",
    "Fusion Energy Milestone: Net Energy Gain Achieved",
    "Paleontologists Discover Largest Dinosaur Skeleton Ever Found",
    "Ocean Acidification Impacting Coral Reefs Faster Than Predicted",
    "Volcanic Eruption Predictors Improve with AI Analysis",
    "Dark Matter Map Reveals Hidden Structure of the Universe",
    "Lab-Grown Meat Receives FDA Approval for Sale"
  ]
};

const SOURCES = [
  "The Global Times", "TechCrunch Daily", "Sports Illustrated", "Healthline Journal", 
  "Science Daily", "Reuters", "Bloomberg", "The Verge", "ESPN", "Nature",
  "The New York Times", "BBC News", "Al Jazeera", "Wired", "National Geographic"
];

const IMG_MAP: Record<Category, string[]> = {
  International: [imgInternational, imgInternational2, imgInternational3, imgInternational4],
  Sports: [imgSports, imgSports2, imgSports3, imgSports4],
  Technology: [imgTech, imgTech2, imgTech3, imgTech4],
  Health: [imgHealth, imgHealth2, imgHealth3, imgHealth4],
  Science: [imgScience, imgScience2, imgScience3, imgScience4]
};

// Store generated articles in memory to persist them during the session
let cachedArticles: Article[] | null = null;

export function generateArticles(countPerCategory: number = 20): Article[] {
  if (cachedArticles) return cachedArticles;

  const articles: Article[] = [];
  let idCounter = 1;

  CATEGORIES.forEach(category => {
    // Shuffle titles to ensure randomness
    const titles = [...SAMPLE_TITLES[category]].sort(() => 0.5 - Math.random());
    // Select a subset to avoid exact repetition if we request fewer than available
    const selectedTitles = titles.slice(0, Math.min(countPerCategory, titles.length)); 
    
    // If we need more than we have, we might have to repeat, but let's try to avoid it for now 
    // by limiting countPerCategory in the loop or just cycling.
    // For this mock, we have 15 titles per category. 
    
    for (let i = 0; i < countPerCategory; i++) {
      const title = titles[i % titles.length];
      // Add a suffix only if we are truly looping (i.e. we ran out of unique titles)
      const uniqueTitle = i < titles.length ? title : `${title} (Update ${Math.floor(i / titles.length) + 1})`;
      
      const categoryImages = IMG_MAP[category];
      const image = categoryImages[i % categoryImages.length];

      articles.push({
        id: `art-${idCounter++}`,
        title: uniqueTitle,
        summary: uniqueTitle.substring(0, 150),
        content: `
          <p class="mb-4"><strong>${category} Update:</strong> In a significant development that has captured the attention of experts and the public alike, new details have emerged regarding the ongoing situation.</p>
          
          <p class="mb-4">Sources close to the matter indicate that the initial reports may have underestimated the scale of the impact. "We are seeing unprecedented shifts in the landscape," said Dr. Elena Rostova, a leading analyst in the field. "The data coming in over the last 48 hours challenges our previous models."</p>
          
          <h3 class="text-xl font-bold mt-6 mb-3">Key Developments</h3>
          <p class="mb-4">The timeline of events suggests a rapid acceleration. What began as a localized phenomenon has now shown signs of broader systemic effects. This has prompted calls for immediate action from regulatory bodies and industry leaders.</p>
          
          <ul class="list-disc pl-5 mb-4 space-y-2">
            <li>First, the initial indicators were dismissed as statistical anomalies.</li>
            <li>Second, independent verification confirmed the trend across multiple datasets.</li>
            <li>Third, response teams have been mobilized to address the immediate concerns.</li>
          </ul>

          <p class="mb-4">Critics, however, argue that the response has been too slow. In a press conference earlier today, opposition spokespeople highlighted missed opportunities for early intervention. The debate is expected to intensify in the coming days as more information becomes available.</p>

          <h3 class="text-xl font-bold mt-6 mb-3">Looking Ahead</h3>
          <p class="mb-4">As we move forward, the focus will shift to long-term mitigation strategies. Experts warn that without structural changes, similar incidents could become more frequent. The coming weeks will be crucial in determining the trajectory of this issue.</p>
          
          <p class="mb-4">Stay tuned to The Daily Pulse for continuous coverage as this story develops.</p>
        `,
        imageUrl: image,
        source: SOURCES[Math.floor(Math.random() * SOURCES.length)],
        sourceName: SOURCES[Math.floor(Math.random() * SOURCES.length)],
        sourceUrl: "https://example.com",
        category: category,
        timestamp: subHours(new Date(), Math.floor(Math.random() * 48)).toISOString(),
        readTime: `${Math.floor(Math.random() * 5) + 3} min read`,
        author: SOURCES[Math.floor(Math.random() * SOURCES.length)],
        tags: [category, ...uniqueTitle.split(' ').filter(w => w.length > 4).slice(0, 2)]
      });
    }
  });

  // Sort by date desc
  cachedArticles = articles.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return cachedArticles;
}

export const fetchArticles = async (category?: Category): Promise<Article[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  const allArticles = generateArticles();
  
  if (category) {
    return allArticles.filter(a => a.category === category);
  }
  return allArticles;
};

export const fetchArticleById = async (id: string): Promise<Article | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  const allArticles = generateArticles();
  return allArticles.find(a => a.id === id);
}
