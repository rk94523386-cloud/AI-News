import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Header } from "@/components/Header";
import { fetchArticlesFromAPI } from "@/lib/api";
import { Loader2, ArrowLeft, Clock, ExternalLink, Calendar, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow, format } from "date-fns";
import React from "react";

export default function ArticleDetail() {
  const [match, params] = useRoute("/article/:id");
  const [, setLocation] = useLocation();
  const id = params?.id;
  const [foundArticle, setFoundArticle] = React.useState<any>(null);

  // Fetch all articles from the category to find the specific one
  // This is needed since we scrape fresh on every request
  const { data: allArticles, isLoading } = useQuery({
    queryKey: ["articles", "all"],
    queryFn: () => fetchArticlesFromAPI(),
    staleTime: 0,
    retry: 1,
  });

  React.useEffect(() => {
    if (allArticles && id) {
      const article = allArticles.find((a: any) => a.id === id);
      if (article) {
        setFoundArticle(article);
      }
    }
  }, [allArticles, id]);

  const goBack = () => {
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col justify-center items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!foundArticle) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col justify-center items-center p-4">
          <Alert variant="destructive" className="max-w-md mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Article Not Found</AlertTitle>
            <AlertDescription>
              The article you are looking for does not exist or has been removed.
            </AlertDescription>
          </Alert>
          <Button onClick={goBack}>Return to Home</Button>
        </div>
      </div>
    );
  }

  const article = foundArticle;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative w-full h-[40vh] md:h-[50vh] overflow-hidden bg-muted">
          <div className="absolute inset-0 bg-black/40 z-10" />
          <img 
            src={article.imageUrl} 
            alt={article.title}
            loading="eager"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=600&fit=crop`;
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 w-full z-20 p-4 md:p-8 bg-gradient-to-t from-black/80 to-transparent">
            <div className="container mx-auto max-w-4xl">
              <Badge className="mb-4 bg-primary text-primary-foreground hover:bg-primary/90 text-sm py-1 px-3">
                {article.category}
              </Badge>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-tight mb-4 shadow-sm"
              >
                {article.title}
              </motion.h1>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <article className="container mx-auto px-4 max-w-4xl py-8 md:py-12">
          <div className="flex flex-col md:flex-row gap-8 mb-8 border-b pb-8">
            <div className="flex-1 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                  {article.sourceName || article.source}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(article.timestamp), "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{formatDistanceToNow(new Date(article.timestamp), { addSuffix: true })}</span>
              </div>
              {article.readTime && (
                <div className="flex items-center gap-2 text-primary font-semibold">
                  {article.readTime}
                </div>
              )}
            </div>
            
            <div className="flex gap-2 flex-col sm:flex-row">
              <Button variant="outline" size="sm" onClick={goBack}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to News
              </Button>
              {article.sourceUrl && (
                <Button size="sm" asChild className="bg-primary hover:bg-primary/90">
                  <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">
                    Read Original Source <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              )}
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-lg md:prose-xl dark:prose-invert max-w-none font-serif leading-relaxed text-foreground/90"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {article.tags && article.tags.length > 0 && (
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-sm font-semibold mb-3 text-muted-foreground">TAGS</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag: string, idx: number) => (
                  <Badge key={idx} variant="outline">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <footer className="border-t py-8 bg-muted/30 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 The Daily Pulse. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
