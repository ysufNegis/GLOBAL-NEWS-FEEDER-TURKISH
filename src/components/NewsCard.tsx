import { type NewsItem, timeAgo } from "../data/newsData";
import TopicTag from "./TopicTag";
import CountryTag from "./CountryTag";

type Props = {
  item: NewsItem;
  featured?: boolean;
};

export default function NewsCard({ item, featured = false }: Props) {
  return (
    <article
      className={`
        border-b border-border group cursor-pointer
        transition-colors duration-150 hover:bg-card
        ${featured ? "py-8" : "py-5"}
      `}
    >
      <div className={`${featured ? "px-6" : "px-6"}`}>
        {/* Top meta row */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {item.labels && item.labels.length > 0 ? (
            item.labels.map((label) => (
              <TopicTag key={label} topic={label} />
            ))
          ) : (
            <TopicTag topic={item.topic} />
          )}
          <span className="font-mono-data text-muted-foreground text-[10px]">
            {item.source}
          </span>
          <span className="text-border">·</span>
          <span className="font-mono-data text-muted-foreground text-[10px]">
            {timeAgo(item.publishedAt)}
          </span>
        </div>

        {/* Headline */}
        <h2
          className={`
            font-display text-foreground leading-snug mb-3
            group-hover:text-accent transition-colors duration-150
            ${featured ? "text-2xl md:text-3xl font-semibold" : "text-base font-semibold"}
          `}
        >
          {item.title}
        </h2>

        {/* Excerpt */}
        <p className={`text-secondary-foreground leading-relaxed mb-4 ${featured ? "text-sm" : "text-xs"}`}>
          {item.excerpt}
        </p>

        {/* Country tags */}
        {item.countries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.countries.map((c) => (
              <CountryTag key={c} country={c} />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
