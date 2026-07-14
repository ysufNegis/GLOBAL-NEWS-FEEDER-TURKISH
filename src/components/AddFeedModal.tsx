import { useState } from "react";
import { addFeed, type Country, type Feed } from "../services/api";
import { type NewsItem } from "../data/newsData";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  countries: Country[];
  onSuccess: (feeds: Feed[], news: NewsItem[]) => void;
};

export default function AddFeedModal({ isOpen, onClose, countries, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [country, setCountry] = useState("World");
  const [twoStepTranslation, setTwoStepTranslation] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Source/Feed Name is required");
      return;
    }
    if (!url.trim()) {
      setError("RSS Feed URL is required");
      return;
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      setError("Feed URL must start with http:// or https://");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await addFeed(
        name.trim(),
        url.trim(),
        country,
        twoStepTranslation
      );
      onSuccess(res.feeds, res.news);
      setName("");
      setUrl("");
      setCountry("World");
      setTwoStepTranslation(false);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to register RSS feed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-border w-full max-w-md p-6 relative rounded-sm shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground font-mono-data text-xs"
        >
          [CLOSE]
        </button>

        <div className="mb-6">
          <p className="font-mono-data text-accent text-[10px] tracking-widest uppercase mb-1">
            Stream Mapping
          </p>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Register RSS Stream
          </h3>
          <p className="text-secondary-foreground text-xs mt-1">
            Map a new XML RSS/Atom news flow. The engine will automatically parse and tag incoming dispatches.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-950/20 border border-rose-500/30 text-rose-400 p-2.5 text-xs font-mono-data">
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono-data text-[10px] uppercase text-muted-foreground mb-1.5">
              Source Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. BBC World, Reuters, TechCrunch"
              className="w-full bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent rounded-sm font-sans"
            />
          </div>

          <div>
            <label className="block font-mono-data text-[10px] uppercase text-muted-foreground mb-1.5">
              RSS Feed URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/rss"
              className="w-full bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent rounded-sm font-sans"
            />
          </div>

          <div>
            <label className="block font-mono-data text-[10px] uppercase text-muted-foreground mb-1.5">
              Primary Country
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent rounded-sm font-sans cursor-pointer"
            >
              {countries.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="twoStepTranslation"
              checked={twoStepTranslation}
              onChange={(e) => setTwoStepTranslation(e.target.checked)}
              className="mt-0.5 w-4 h-4 bg-secondary border border-border text-accent focus:ring-accent rounded-sm cursor-pointer accent-accent"
            />
            <div className="flex flex-col">
              <label htmlFor="twoStepTranslation" className="font-mono-data text-[10px] uppercase text-foreground cursor-pointer select-none">
                Çift Aşamalı Çeviri Modu
              </label>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">
                Eğer bu kaynak İngilizce dışındaki bir dilde ise, önce İngilizceye, ardından Türkçeye çevirerek çeviri kalitesini artırır.
              </p>
            </div>
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-border hover:bg-secondary text-xs font-mono-data uppercase text-muted-foreground hover:text-foreground transition-colors rounded-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-mono-data font-medium uppercase tracking-wider transition-colors rounded-sm flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-foreground animate-ping" />
                  Mapping Stream...
                </>
              ) : (
                "Map Stream"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
