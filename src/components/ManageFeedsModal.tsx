import { useState, useEffect } from "react";
import { getFeeds, updateFeed, deleteFeed, type Feed, type Country } from "../services/api";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  countries: Country[];
  onFeedsUpdated: () => void;
};

export default function ManageFeedsModal({ isOpen, onClose, countries, onFeedsUpdated }: Props) {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editCountry, setEditCountry] = useState("World");
  const [actionLoading, setActionLoading] = useState(false);

  const loadFeeds = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getFeeds();
      setFeeds(res.data);
    } catch (e) {
      setError("Failed to load registered RSS streams");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadFeeds();
      setEditingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startEditing = (feed: Feed) => {
    setEditingId(feed.id);
    setEditName(feed.name);
    setEditUrl(feed.url);
    setEditCountry(feed.country);
    setError("");
  };

  const handleSave = async (id: string) => {
    if (!editName.trim() || !editUrl.trim()) {
      setError("Name and URL are required");
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      const res = await updateFeed(id, editName.trim(), editUrl.trim(), editCountry);
      setFeeds(res.feeds);
      setEditingId(null);
      onFeedsUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to update stream configuration");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this RSS stream? This will stop importing new articles from this source.")) {
      return;
    }
    setActionLoading(true);
    setError("");
    try {
      const res = await deleteFeed(id);
      setFeeds(res.feeds);
      onFeedsUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to delete stream configuration");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-[#121212] border border-border w-full max-w-2xl p-6 relative rounded-sm shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground font-mono-data text-xs"
        >
          [CLOSE]
        </button>

        <div className="mb-6">
          <p className="font-mono-data text-accent text-[10px] tracking-widest uppercase mb-1">
            Stream Directory
          </p>
          <h3 className="font-display text-xl font-semibold text-foreground">
            Manage RSS Feeds
          </h3>
          <p className="text-secondary-foreground text-xs mt-1">
            Configure or prune active XML RSS feeds feeding into the World Dispatch network.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-rose-950/20 border border-rose-500/30 text-rose-400 p-2.5 text-xs font-mono-data">
            ERROR: {error}
          </div>
        )}

        {/* Scrollable feed list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border pr-2 hide-scrollbar">
          {loading ? (
            <div className="py-12 text-center font-mono-data text-xs text-muted-foreground">
              Retrieving active streams...
            </div>
          ) : feeds.length === 0 ? (
            <div className="py-12 text-center font-mono-data text-xs text-muted-foreground">
              No registered RSS streams found. Add one to begin.
            </div>
          ) : (
            feeds.map((feed) => {
              const isEditing = editingId === feed.id;
              return (
                <div key={feed.id} className="py-4 first:pt-0 last:pb-0">
                  {isEditing ? (
                    // Editing Form Row
                    <div className="space-y-3 p-3 bg-secondary/20 border border-border rounded-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-mono-data text-[9px] uppercase text-muted-foreground mb-1">Source Name</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-secondary border border-border px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent rounded-sm font-sans"
                          />
                        </div>
                        <div>
                          <label className="block font-mono-data text-[9px] uppercase text-muted-foreground mb-1">RSS URL</label>
                          <input
                            type="url"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            className="w-full bg-secondary border border-border px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent rounded-sm font-sans"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono-data text-[9px] uppercase text-muted-foreground mb-1">Country</label>
                        <select
                          value={editCountry}
                          onChange={(e) => setEditCountry(e.target.value)}
                          className="w-full bg-secondary border border-border px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-accent rounded-sm font-sans cursor-pointer"
                        >
                          {countries.map((c) => (
                            <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          disabled={actionLoading}
                          className="px-3 py-1 border border-border hover:bg-secondary text-[10px] font-mono-data uppercase text-muted-foreground hover:text-foreground rounded-sm transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSave(feed.id)}
                          disabled={actionLoading}
                          className="px-3 py-1 bg-accent text-accent-foreground text-[10px] font-mono-data uppercase rounded-sm hover:bg-accent/90 transition-colors"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Standard Row
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-semibold text-foreground text-sm">{feed.name}</span>
                          <span className="font-mono-data text-[9px] px-1.5 py-0.5 border border-border text-secondary-foreground bg-secondary/35 rounded-sm uppercase tracking-wide">{feed.country}</span>
                        </div>
                        <p className="text-muted-foreground font-mono-data text-[9px] mt-1 break-all tracking-wide select-all">{feed.url}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => startEditing(feed)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 border border-border hover:border-accent hover:text-accent text-[9px] font-mono-data uppercase rounded-sm transition-all"
                        >
                          [EDIT]
                        </button>
                        <button
                          onClick={() => handleDelete(feed.id)}
                          disabled={actionLoading}
                          className="px-2.5 py-1 border border-border hover:border-rose-500 hover:text-rose-400 text-[9px] font-mono-data uppercase rounded-sm transition-all"
                        >
                          [DELETE]
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border hover:bg-secondary text-xs font-mono-data uppercase text-foreground transition-colors rounded-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
