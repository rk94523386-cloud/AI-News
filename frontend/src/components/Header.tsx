import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link 
          href="/" 
          className="font-serif text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity"
        >
          The Daily Pulse
        </Link>
        <div className="hidden md:flex items-center text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </header>
  );
}
