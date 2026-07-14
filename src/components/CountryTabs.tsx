import { useState } from "react";

export interface CountryTabItem {
  name: string;
  flag: string;
}

type Props = {
  countries: CountryTabItem[];
  active: string;
  onChange: (c: string) => void;
};

export default function CountryTabs({ countries, active, onChange }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <nav className="border-b border-border bg-[#0a0a0a]/50 py-3 px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left side: Country Tabs Flow */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {filteredCountries.map((country) => {
            const isActive = country.name === active;
            return (
              <button
                key={country.name}
                onClick={() => onChange(country.name)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-mono-data tracking-wider uppercase
                  border transition-all duration-150 rounded-sm cursor-pointer
                  ${isActive
                    ? "border-accent bg-accent/5 text-accent shadow-xs"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground bg-secondary/20"
                  }
                `}
              >
                <span className="text-[12px]">{country.flag}</span>
                <span>{country.name}</span>
              </button>
            );
          })}

          {filteredCountries.length === 0 && (
            <p className="text-xs italic text-muted-foreground font-mono-data py-1">
              No matching countries found.
            </p>
          )}
        </div>

        {/* Right side: Search Filter Input */}
        <div className="w-full lg:w-60 flex items-center">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="FILTER WIRE..."
              className="w-full bg-secondary/40 border border-border px-3 py-1.5 text-[10px] font-mono-data tracking-widest text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent placeholder:text-muted-foreground/60 rounded-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-[10px] font-mono-data"
              >
                [X]
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
