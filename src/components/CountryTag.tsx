type Props = { country: string };

const DEFAULT_FLAG: Record<string, string> = {
  "World": "🌐",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  "Germany": "🇩🇪",
  "Turkey": "🇹🇷",
  "Japan": "🇯🇵",
  "France": "🇫🇷",
  "China": "🇨🇳",
  "Russia": "🇷🇺",
  "India": "🇮🇳",
  "Brazil": "🇧🇷",
  "Israel": "🇮🇱",
  "Ukraine": "🇺🇦",
  "South Korea": "🇰🇷",
  "Australia": "🇦🇺",
};

export default function CountryTag({ country }: Props) {
  let flag = DEFAULT_FLAG[country];

  if (!flag) {
    try {
      const stored = localStorage.getItem("rss_feeder_countries");
      if (stored) {
        const countriesList = JSON.parse(stored);
        const match = countriesList.find((c: any) => c.name.toLowerCase() === country.toLowerCase());
        if (match) {
          flag = match.flag;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  return (
    <span className="inline-flex items-center gap-1 font-mono-data text-[10px] tracking-wide border border-border bg-secondary text-secondary-foreground px-2 py-0.5">
      <span className="text-[11px]">{flag || "🏳️"}</span>
      {country}
    </span>
  );
}
