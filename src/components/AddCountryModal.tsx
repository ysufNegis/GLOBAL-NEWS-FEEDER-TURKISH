import { useState } from "react";
import { addCountry, type Country } from "../services/api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (countries: Country[]) => void;
};

const COMMON_FLAGS = [
  { name: "United States", emoji: "🇺🇸" },
  { name: "United Kingdom", emoji: "🇬🇧" },
  { name: "Germany", emoji: "🇩🇪" },
  { name: "Turkey", emoji: "🇹🇷" },
  { name: "Japan", emoji: "🇯🇵" },
  { name: "France", emoji: "🇫🇷" },
  { name: "China", emoji: "🇨🇳" },
  { name: "Russia", emoji: "🇷🇺" },
  { name: "India", emoji: "🇮🇳" },
  { name: "Brazil", emoji: "🇧🇷" },
  { name: "Italy", emoji: "🇮🇹" },
  { name: "Spain", emoji: "🇪🇸" },
  { name: "Canada", emoji: "🇨🇦" },
  { name: "Australia", emoji: "🇦🇺" },
  { name: "South Korea", emoji: "🇰🇷" },
  { name: "Ukraine", emoji: "🇺🇦" },
  { name: "Switzerland", emoji: "🇨🇭" },
  { name: "Greece", emoji: "🇬🇷" },
  { name: "Saudi Arabia", emoji: "🇸🇦" },
  { name: "South Africa", emoji: "🇿🇦" }
];

export default function AddCountryModal({ isOpen, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [flag, setFlag] = useState("🏳️");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Country name is required");
      return;
    }
    if (!flag.trim()) {
      setError("Flag emoji is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await addCountry(name.trim(), flag.trim());
      onSuccess(res.data);
      setName("");
      setFlag("🏳️");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to add country");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (preset: { name: string; emoji: string }) => {
    setName(preset.name);
    setFlag(preset.emoji);
    setError("");
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
            Database Update
          </p>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Register New Country
          </h3>
          <p className="text-secondary-foreground text-xs mt-1">
            Add a country to the classification engine. This updates the dynamic news filtration tabs.
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
              Country Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Italy, Canada"
              className="w-full bg-secondary border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent rounded-sm font-sans"
            />
          </div>

          <div>
            <label className="block font-mono-data text-[10px] uppercase text-muted-foreground mb-1.5">
              Flag Emoji
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={flag}
                onChange={(e) => setFlag(e.target.value)}
                maxLength={4}
                className="w-16 text-center bg-secondary border border-border px-2 py-2 text-lg text-foreground focus:outline-none focus:border-accent rounded-sm"
              />
              <span className="text-xs text-muted-foreground flex items-center">
                Paste or pick a preset below
              </span>
            </div>
          </div>

          <div>
            <label className="block font-mono-data text-[10px] uppercase text-muted-foreground mb-1.5">
              Presets
            </label>
            <div className="grid grid-cols-5 gap-2 max-h-32 overflow-y-auto p-1 border border-border/50 bg-[#0c0c0c] hide-scrollbar rounded-sm">
              {COMMON_FLAGS.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() => handleSelectPreset(preset)}
                  title={preset.name}
                  className="flex items-center justify-center p-1.5 text-lg hover:bg-secondary rounded-sm transition-colors border border-transparent hover:border-border"
                >
                  {preset.emoji}
                </button>
              ))}
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
                  Saving...
                </>
              ) : (
                "Register"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
