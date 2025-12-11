import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Header } from "@/components/Header";
import { CategoryNav } from "@/components/CategoryNav";
import { NewsCard } from "@/components/NewsCard";
import { Category } from "@/lib/mockData";
import { fetchArticlesFromAPI } from "@/lib/api";
import { Loader2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Home() {
  const [match, params] = useRoute("/category/:category");
  const category = match ? (params?.category as Category) : undefined;

  const { data: articles, isLoading, error } = useQuery({
    queryKey: ["articles", category],
    queryFn: () => fetchArticlesFromAPI(category),
    staleTime: Infinity, // Cache articles indefinitely until manual refresh via API
    retry: 2,
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <CategoryNav currentCategory={category} />
      
      <main className="container mx-auto px-4 py-8 flex-grow">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-2">
              {category ? `${category} News` : "Top Stories"}
            </h1>
            <p className="text-muted-foreground">
              {category 
                ? `The latest updates and breaking news in ${category}.`
                : "Curated headlines from around the globe."}
            </p>
          </div>

          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading news articles...</p>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to fetch articles. Please try again later.
              </AlertDescription>
            </Alert>
          ) : !articles || articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No articles available. Articles will be loaded on your next visit.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles.map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.3) }}
                >
                  <NewsCard article={article} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 The Daily Pulse. All rights reserved.</p>
          <p className="mt-2 text-xs">Live news scraped from BBC, Reuters, TechCrunch, and other trusted sources.</p>
        </div>
      </footer>
    </div>
  );
}
