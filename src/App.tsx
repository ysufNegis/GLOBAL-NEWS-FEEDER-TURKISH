import { useState, useEffect } from "react";
import { getCountries, getNews, refreshFeeds, type Country, type NewsItem } from "./services/api";
import Header from "./components/Header";
import CountryTabs from "./components/CountryTabs";
import NewsFeed from "./components/NewsFeed";
import AddCountryModal from "./components/AddCountryModal";
import AddFeedModal from "./components/AddFeedModal";
import ManageFeedsModal from "./components/ManageFeedsModal";

export default function App() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [activeCountry, setActiveCountry] = useState("World");
  const [apiSource, setApiSource] = useState<"python" | "local">("local");
  
  const [isAddCountryOpen, setIsAddCountryOpen] = useState(false);
  const [isAddFeedOpen, setIsAddFeedOpen] = useState(false);
  const [isManageFeedsOpen, setIsManageFeedsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [countriesRes, newsRes] = await Promise.all([
        getCountries(),
        getNews()
      ]);
      setCountries(countriesRes.data);
      setNews(newsRes.data);
      setApiSource(newsRes.source);
    } catch (e) {
      console.error("Failed to load news wire data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll for status or updates every 30 seconds if backend is connected
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleCountryAdded = (updatedCountries: Country[]) => {
    setCountries(updatedCountries);
  };

  const handleFeedAdded = (_updatedFeeds: any, updatedNews: NewsItem[]) => {
    setNews(updatedNews);
    // Reload full dataset to make sure all flags and counts are in sync
    loadData();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await refreshFeeds();
      setNews(res.data);
      setApiSource(res.source);
    } catch (e) {
      console.error("Refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  };

  // Filter news items based on the active country
  const filteredItems = activeCountry === "World"
    ? news
    : news.filter(
        (item) =>
          item.primaryCountry === activeCountry ||
          item.countries.includes(activeCountry)
      );

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center font-mono-data text-[10px] tracking-widest">
        <div className="w-5 h-5 border border-accent border-t-transparent rounded-full animate-spin mb-4" />
        LOADING GLOBAL WIRE DISPATCH...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between">
      <div>
        <Header
          apiSource={apiSource}
          onAddCountryClick={() => setIsAddCountryOpen(true)}
          onAddFeedClick={() => setIsAddFeedOpen(true)}
          onManageFeedsClick={() => setIsManageFeedsOpen(true)}
          onRefreshClick={handleRefresh}
          refreshing={refreshing}
        />
        
        <CountryTabs
          countries={countries}
          active={activeCountry}
          onChange={setActiveCountry}
        />
        
        <NewsFeed items={filteredItems} country={activeCountry} />
      </div>

      <footer className="border-t border-border mt-16 px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="font-mono-data text-muted-foreground text-[10px] tracking-wide">
            World Dispatch — Aggregated RSS Wire · Engine running on {apiSource.toUpperCase()} Mode
          </p>
          <p className="font-mono-data text-muted-foreground text-[10px] tracking-wide">
            Total feeds: {news.length} items parsed
          </p>
        </div>
      </footer>

      {/* Modals */}
      <AddCountryModal
        isOpen={isAddCountryOpen}
        onClose={() => setIsAddCountryOpen(false)}
        onSuccess={handleCountryAdded}
      />

      <AddFeedModal
        isOpen={isAddFeedOpen}
        onClose={() => setIsAddFeedOpen(false)}
        countries={countries}
        onSuccess={handleFeedAdded}
      />

      <ManageFeedsModal
        isOpen={isManageFeedsOpen}
        onClose={() => setIsManageFeedsOpen(false)}
        countries={countries}
        onFeedsUpdated={loadData}
      />
    </div>
  );
}
