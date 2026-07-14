const TOPIC_COLORS: Record<string, string> = {
  // English originals
  Politics:   "text-rose-400 border-rose-400/30 bg-rose-400/5",
  Economy:    "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
  Technology: "text-sky-400 border-sky-400/30 bg-sky-400/5",
  Climate:    "text-teal-400 border-teal-400/30 bg-teal-400/5",
  Health:     "text-purple-400 border-purple-400/30 bg-purple-400/5",
  Defence:    "text-red-400 border-red-400/30 bg-red-400/5",
  Diplomacy:  "text-amber-400 border-amber-400/30 bg-amber-400/5",
  Energy:     "text-orange-400 border-orange-400/30 bg-orange-400/5",
  Finance:    "text-lime-400 border-lime-400/30 bg-lime-400/5",
  Society:    "text-pink-400 border-pink-400/30 bg-pink-400/5",
  Trade:      "text-cyan-400 border-cyan-400/30 bg-cyan-400/5",

  // Turkish LLM labels
  "Diplomasi":     "text-amber-400 border-amber-400/30 bg-amber-400/5",
  "Savaş":         "text-rose-500 border-rose-500/30 bg-rose-500/5 font-semibold",
  "Çatışma":       "text-red-400 border-red-400/30 bg-red-400/5",
  "Ateşkes":       "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
  "Savunma":       "text-red-300 border-red-300/30 bg-red-300/5",
  "Füze":          "text-orange-500 border-orange-500/30 bg-orange-500/5",
  "Nükleer":       "text-violet-400 border-violet-400/30 bg-violet-400/5",
  "Terör":         "text-rose-600 border-rose-600/30 bg-rose-600/5",
  "İstihbarat":    "text-fuchsia-400 border-fuchsia-400/30 bg-fuchsia-400/5",
  "Enerji":        "text-amber-500 border-amber-500/30 bg-amber-500/5",
  "Petrol":        "text-yellow-600 border-yellow-600/30 bg-yellow-600/5",
  "Doğalgaz":      "text-cyan-400 border-cyan-400/30 bg-cyan-400/5",
  "Ekonomi":       "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
  "Enflasyon":     "text-orange-400 border-orange-400/30 bg-orange-400/5",
  "Ticaret":       "text-teal-400 border-teal-400/30 bg-teal-400/5",
  "Yapay Zeka":    "text-sky-400 border-sky-400/30 bg-sky-400/5",
  "Siber Güvenlik": "text-indigo-400 border-indigo-400/30 bg-indigo-400/5",
  "Uzay":          "text-violet-400 border-violet-400/30 bg-violet-400/5",
  "NATO":          "text-blue-400 border-blue-400/30 bg-blue-400/5 font-semibold",
  "AB":            "text-blue-500 border-blue-500/30 bg-blue-500/5",
  "BM":            "text-sky-400 border-sky-400/30 bg-sky-400/5",
  "BRICS":         "text-lime-400 border-lime-400/30 bg-lime-400/5",
  "G7":            "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  "G20":           "text-teal-500 border-teal-500/30 bg-teal-500/5",
  "Göç":           "text-pink-400 border-pink-400/30 bg-pink-400/5",
  "İnsan Hakları": "text-pink-300 border-pink-300/30 bg-pink-300/5",
  "Seçim":         "text-purple-400 border-purple-400/30 bg-purple-400/5",
};

type Props = { topic: string };

export default function TopicTag({ topic }: Props) {
  const isEmpty = !topic;
  const cls = TOPIC_COLORS[topic] ?? (isEmpty ? "border-dashed border-border/80 bg-transparent text-transparent" : "text-foreground border-border bg-muted");
  return (
    <span className={`font-mono-data text-[10px] tracking-widest uppercase border px-2 py-0.5 min-w-[50px] text-center inline-block ${cls}`}>
      {topic || "\u00A0"}
    </span>
  );
}
