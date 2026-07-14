export type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  topic: string;
  labels?: string[];
  countries: string[];
  excerpt: string;
  primaryCountry: string;
};

export const TOPICS = [
  "Politics", "Economy", "Technology", "Climate", "Health",
  "Defence", "Diplomacy", "Energy", "Finance", "Society", "Trade"
];

export const DEFAULT_COUNTRIES = [
  { name: "World", flag: "🌐" },
  { name: "United States", flag: "🇺🇸" },
  { name: "United Kingdom", flag: "🇬🇧" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Turkey", flag: "🇹🇷" },
  { name: "Japan", flag: "🇯🇵" },
  { name: "France", flag: "🇫🇷" },
  { name: "China", flag: "🇨🇳" },
  { name: "Russia", flag: "🇷🇺" },
  { name: "India", flag: "🇮🇳" },
  { name: "Brazil", flag: "🇧🇷" },
  { name: "Israel", flag: "🇮🇱" },
  { name: "Ukraine", flag: "🇺🇦" },
  { name: "South Korea", flag: "🇰🇷" },
  { name: "Australia", flag: "🇦🇺" }
];

export const DEFAULT_NEWS_ITEMS: NewsItem[] = [];

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
