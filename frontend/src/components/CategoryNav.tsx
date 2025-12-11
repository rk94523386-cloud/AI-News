import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Category } from "@/lib/mockData";

interface CategoryNavProps {
  currentCategory?: string;
}

const categories: Category[] = ["International", "Sports", "Technology", "Health", "Science"];

export function CategoryNav({ currentCategory }: CategoryNavProps) {
  return (
    <nav className="border-b py-4 overflow-x-auto">
      <div className="container mx-auto px-4 flex gap-6 md:gap-8 min-w-max">
        <Link 
          href="/"
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary uppercase tracking-wider",
            !currentCategory ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground"
          )}
        >
          All News
        </Link>
        {categories.map((cat) => (
          <Link 
            key={cat} 
            href={`/category/${cat}`}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary uppercase tracking-wider",
              currentCategory === cat ? "text-primary border-b-2 border-primary pb-1" : "text-muted-foreground"
            )}
          >
            {cat}
          </Link>
        ))}
      </div>
    </nav>
  );
}
