import { type NewsItem } from "../data/newsData";
import NewsCard from "./NewsCard";

type Props = {
  items: NewsItem[];
  country: string;
};

export default function NewsFeed({ items, country }: Props) {
  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="font-display italic text-muted-foreground text-xl">
          No dispatches found for {country}.
        </p>
      </div>
    );
  }

  const [featured, ...rest] = items;

  return (
    <main className="max-w-7xl mx-auto">
      {/* Featured top story */}
      <div className="border-b border-border">
        <div className="py-2 px-6">
          <span className="font-mono-data text-[10px] tracking-widest uppercase text-accent">
            Top Story
          </span>
        </div>
        <NewsCard item={featured} featured />
      </div>

      {/* Grid of remaining stories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y divide-border">
        {rest.map((item) => (
          <div key={item.id} className="border-r-0 lg:border-r border-border last:border-r-0">
            <NewsCard item={item} />
          </div>
        ))}
      </div>
    </main>
  );
}
