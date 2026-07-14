type Props = {
  apiSource: "python" | "local";
  onAddCountryClick: () => void;
  onAddFeedClick: () => void;
  onManageFeedsClick: () => void;
  onRefreshClick: () => void;
  refreshing: boolean;
};

export default function Header({
  apiSource,
  onAddCountryClick,
  onAddFeedClick,
  onManageFeedsClick,
  onRefreshClick,
  refreshing
}: Props) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isConnected = apiSource === "python";

  return (
    <header className="border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="font-mono-data text-muted-foreground text-[10px] tracking-widest uppercase mb-1">
            Global Wire Aggregator
          </p>
          <h1 className="font-display text-foreground text-3xl font-bold leading-none">
            World <span className="italic font-normal text-accent">Dispatch</span>
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center md:items-end gap-4 sm:gap-6 justify-end">
          {/* Status & Date */}
          <div className="text-left md:text-right">
            <p className="font-mono-data text-muted-foreground text-[10px] tracking-wide">{dateStr}</p>
            <p className="font-mono-data text-[10px] mt-0.5 flex items-center gap-1.5 md:justify-end">
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`} />
              <span className={isConnected ? "text-emerald-400" : "text-amber-400"}>
                {isConnected ? "PYTHON API ACTIVE" : "OFFLINE CACHE"}
              </span>
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onAddCountryClick}
              className="border border-border px-2.5 py-1.5 text-[9px] font-mono-data uppercase tracking-widest text-muted-foreground hover:text-accent hover:border-accent transition-all duration-150 rounded-sm"
            >
              + Country
            </button>
            <button
              onClick={onAddFeedClick}
              className="border border-border px-2.5 py-1.5 text-[9px] font-mono-data uppercase tracking-widest text-muted-foreground hover:text-accent hover:border-accent transition-all duration-150 rounded-sm"
            >
              + RSS Feed
            </button>
            <button
              onClick={onManageFeedsClick}
              className="border border-border px-2.5 py-1.5 text-[9px] font-mono-data uppercase tracking-widest text-muted-foreground hover:text-accent hover:border-accent transition-all duration-150 rounded-sm"
            >
              ⚙️ Manage Feeds
            </button>
            <button
              onClick={onRefreshClick}
              disabled={refreshing}
              className="border border-border bg-secondary/50 px-2.5 py-1.5 text-[9px] font-mono-data uppercase tracking-widest text-foreground hover:text-accent hover:border-accent disabled:opacity-50 transition-all duration-150 rounded-sm flex items-center gap-1"
            >
              {refreshing ? (
                <>
                  <span className="w-1 h-1 rounded-full bg-accent animate-ping" />
                  SYNCING...
                </>
              ) : (
                "SYNC FEEDS"
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
