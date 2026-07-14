import { type NewsItem, DEFAULT_COUNTRIES, DEFAULT_NEWS_ITEMS } from "../data/newsData";

export interface Country {
  name: string;
  flag: string;
}

export interface Feed {
  id: string;
  name: string;
  url: string;
  country: string;
}

const API_BASE = "http://localhost:5001/api";

export async function checkBackendStatus(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800); // quick timeout
    const res = await fetch(`${API_BASE}/status`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return data.status === "ok" && data.backend === "python";
    }
  } catch (e) {
    // Fail silently
  }
  return false;
}

async function fetchFromBackend<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

const LOCAL_COUNTRIES_KEY = "rss_feeder_countries";
const LOCAL_FEEDS_KEY = "rss_feeder_feeds";
const LOCAL_NEWS_KEY = "rss_feeder_news";

// Initial list of feeds for local mock storage
const DEFAULT_FEEDS: Feed[] = [
  { id: "f1", name: "BBC News World", url: "http://feeds.bbci.co.uk/news/world/rss.xml", country: "World" },
  { id: "f2", name: "NYT World News", url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", country: "United States" },
  { id: "f3", name: "TRT World News", url: "https://www.trtworld.com/feed", country: "Turkey" },
  { id: "f4", name: "Deutsche Welle World", url: "https://rss.dw.com/rdf/rss-en-world", country: "Germany" },
  { id: "f5", name: "NHK World News", url: "https://www3.nhk.or.jp/nhkworld/rss/xml/news.xml", country: "Japan" }
];

export function getLocalCountries(): Country[] {
  const data = localStorage.getItem(LOCAL_COUNTRIES_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_COUNTRIES_KEY, JSON.stringify(DEFAULT_COUNTRIES));
    return DEFAULT_COUNTRIES;
  }
  return JSON.parse(data);
}

export function saveLocalCountries(countries: Country[]) {
  localStorage.setItem(LOCAL_COUNTRIES_KEY, JSON.stringify(countries));
}

export function getLocalFeeds(): Feed[] {
  const data = localStorage.getItem(LOCAL_FEEDS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_FEEDS_KEY, JSON.stringify(DEFAULT_FEEDS));
    return DEFAULT_FEEDS;
  }
  return JSON.parse(data);
}

export function saveLocalFeeds(feeds: Feed[]) {
  localStorage.setItem(LOCAL_FEEDS_KEY, JSON.stringify(feeds));
}

export function getLocalNews(): NewsItem[] {
  const data = localStorage.getItem(LOCAL_NEWS_KEY);
  let news: NewsItem[];
  if (!data) {
    localStorage.setItem(LOCAL_NEWS_KEY, JSON.stringify(DEFAULT_NEWS_ITEMS));
    news = DEFAULT_NEWS_ITEMS;
  } else {
    news = JSON.parse(data);
  }
  return news.map((item) => ({ ...item, topic: "" }));
}

export function saveLocalNews(news: NewsItem[]) {
  localStorage.setItem(LOCAL_NEWS_KEY, JSON.stringify(news));
}

export async function getCountries(): Promise<{ data: Country[]; source: "python" | "local" }> {
  const connected = await checkBackendStatus();
  if (connected) {
    try {
      const data = await fetchFromBackend<Country[]>("/countries");
      return { data, source: "python" };
    } catch (e) {
      console.warn("Backend error fetching countries, falling back to local storage", e);
    }
  }
  return { data: getLocalCountries(), source: "local" };
}

export async function addCountry(name: string, flag: string): Promise<{ data: Country[]; source: "python" | "local" }> {
  const connected = await checkBackendStatus();
  if (connected) {
    try {
      const data = await fetchFromBackend<Country[]>("/countries", {
        method: "POST",
        body: JSON.stringify({ name, flag }),
      });
      return { data, source: "python" };
    } catch (e: any) {
      throw new Error(e.message || "Error adding country to Python backend");
    }
  }
  
  const countries = getLocalCountries();
  if (countries.some(c => c.name.toLowerCase() === name.toLowerCase())) {
    throw new Error(`Country "${name}" already exists.`);
  }
  countries.push({ name, flag });
  saveLocalCountries(countries);
  return { data: countries, source: "local" };
}

export async function getFeeds(): Promise<{ data: Feed[]; source: "python" | "local" }> {
  const connected = await checkBackendStatus();
  if (connected) {
    try {
      const data = await fetchFromBackend<Feed[]>("/feeds");
      return { data, source: "python" };
    } catch (e) {
      console.warn("Backend error fetching feeds, falling back to local storage", e);
    }
  }
  return { data: getLocalFeeds(), source: "local" };
}

export async function addFeed(name: string, url: string, country: string): Promise<{ feeds: Feed[]; news: NewsItem[]; source: "python" | "local" }> {
  const connected = await checkBackendStatus();
  if (connected) {
    try {
      const feeds = await fetchFromBackend<Feed[]>("/feeds", {
        method: "POST",
        body: JSON.stringify({ name, url, country }),
      });
      const news = await fetchFromBackend<NewsItem[]>("/news");
      return { feeds, news, source: "python" };
    } catch (e: any) {
      throw new Error(e.message || "Error adding feed to Python backend");
    }
  }
  
  const feeds = getLocalFeeds();
  if (feeds.some(f => f.url === url)) {
    throw new Error("Feed URL already registered.");
  }
  
  const feedId = "feed_" + Math.random().toString(36).substr(2, 9);
  const newFeed: Feed = { id: feedId, name, url, country };
  feeds.push(newFeed);
  saveLocalFeeds(feeds);
  
  const news = getLocalNews();
  const simulatedArticle: NewsItem = {
    id: "sim_" + Math.random().toString(36).substr(2, 9),
    title: `New dispatch from ${name}: RSS stream successfully mapped for ${country}`,
    source: name,
    url: url,
    publishedAt: new Date().toISOString(),
    topic: "",
    countries: [country],
    excerpt: `The RSS feed at ${url} has been registered and verified. This is a simulated live dispatch indicating that the stream is now active and parsing content in real-time.`,
    primaryCountry: country
  };
  news.unshift(simulatedArticle);
  saveLocalNews(news);
  
  return { feeds, news, source: "local" };
}

export async function getNews(): Promise<{ data: NewsItem[]; source: "python" | "local" }> {
  const connected = await checkBackendStatus();
  if (connected) {
    try {
      const data = await fetchFromBackend<NewsItem[]>("/news");
      return { data, source: "python" };
    } catch (e) {
      console.warn("Backend error fetching news, falling back to local storage", e);
    }
  }
  return { data: getLocalNews(), source: "local" };
}

export async function refreshFeeds(): Promise<{ data: NewsItem[]; source: "python" | "local" }> {
  const connected = await checkBackendStatus();
  if (connected) {
    try {
      const data = await fetchFromBackend<NewsItem[]>("/refresh", { method: "POST" });
      return { data, source: "python" };
    } catch (e) {
      console.warn("Backend error refreshing feeds", e);
      throw e;
    }
  }
  
  const news = getLocalNews();
  const topics = ["Politics", "Economy", "Technology", "Climate", "Health", "Diplomacy"];
  const countries = getLocalCountries().map(c => c.name);
  const sources = getLocalFeeds().map(f => f.name);
  
  const randomTopic = topics[Math.floor(Math.random() * topics.length)];
  const randomCountry = countries[Math.floor(Math.random() * countries.length)];
  const randomSource = sources.length > 0 ? sources[Math.floor(Math.random() * sources.length)] : "Global Press";
  
  const simulatedArticle: NewsItem = {
    id: "sim_refresh_" + Math.random().toString(36).substr(2, 9),
    title: `Global Wire Alert: Dynamic updates reported across ${randomCountry}`,
    source: randomSource,
    url: "#",
    publishedAt: new Date().toISOString(),
    topic: randomTopic,
    countries: [randomCountry, "World"],
    excerpt: `Medias reporting from ${randomCountry} indicate accelerated developments in local affairs. High-level summits are scheduled to outline future initiatives.`,
    primaryCountry: randomCountry
  };
  news.unshift(simulatedArticle);
  saveLocalNews(news);
  
  return { data: news, source: "local" };
}

export async function updateFeed(
  id: string,
  name: string,
  url: string,
  country: string
): Promise<{ feeds: Feed[]; source: "python" | "local" }> {
  const connected = await checkBackendStatus();
  if (connected) {
    try {
      const feeds = await fetchFromBackend<Feed[]>(`/feeds/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name, url, country }),
      });
      return { feeds, source: "python" };
    } catch (e: any) {
      throw new Error(e.message || "Failed to update feed in Python backend");
    }
  }

  const feeds = getLocalFeeds();
  const index = feeds.findIndex(f => f.id === id);
  if (index === -1) {
    throw new Error("Feed not found");
  }
  
  if (feeds.some(f => f.url === url && f.id !== id)) {
    throw new Error("Another feed is already registered with this URL");
  }

  feeds[index] = { id, name, url, country };
  saveLocalFeeds(feeds);
  return { feeds, source: "local" };
}

export async function deleteFeed(
  id: string
): Promise<{ feeds: Feed[]; source: "python" | "local" }> {
  const connected = await checkBackendStatus();
  if (connected) {
    try {
      const feeds = await fetchFromBackend<Feed[]>(`/feeds/${id}`, {
        method: "DELETE",
      });
      return { feeds, source: "python" };
    } catch (e: any) {
      throw new Error(e.message || "Failed to delete feed from Python backend");
    }
  }

  const feeds = getLocalFeeds();
  const filtered = feeds.filter(f => f.id !== id);
  saveLocalFeeds(filtered);
  return { feeds: filtered, source: "local" };
}
