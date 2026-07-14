import os
import sys
import json
import re
import urllib.request
import xml.etree.ElementTree as ET
import email.utils
import threading
from datetime import datetime
from flask import Flask, jsonify, request

# Add parent dir and llm dir to sys.path so llm.classifier and labels resolve correctly
parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.extend([parent_dir, os.path.join(parent_dir, 'llm')])

try:
    from llm.classifier import classify_news
    HAS_LLM = True
except Exception as e:
    print(f"Failed to load LLM classifier: {e}")
    HAS_LLM = False

try:
    from llm.translator import translate_to_turkish
    HAS_TRANSLATOR = True
except Exception as e:
    print(f"Failed to load NLLB translator: {e}")
    HAS_TRANSLATOR = False

def get_llm_labels(title, content):
    if not HAS_LLM:
        return []
    try:
        res = classify_news(title, content)
        return res.get('labels', [])
    except Exception as e:
        print(f"Ollama classification failed for '{title}': {e}")
        return []

app = Flask(__name__)

# Add manual CORS header injector in case flask-cors is not installed
@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# Check if feedparser is available, otherwise use XML parser
try:
    import feedparser
    HAS_FEEDPARSER = True
except ImportError:
    HAS_FEEDPARSER = False

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
COUNTRIES_FILE = os.path.join(DATA_DIR, 'countries.json')
FEEDS_FILE = os.path.join(DATA_DIR, 'feeds.json')
ARTICLES_FILE = os.path.join(DATA_DIR, 'articles.json')

# Create data directory if it doesn't exist
os.makedirs(DATA_DIR, exist_ok=True)

# Helper to normalize dates to ISO format
def parse_date_to_iso(date_str):
    if not date_str:
        return datetime.utcnow().isoformat() + 'Z'
    # Try parsing RSS RFC 822 format (e.g., "Mon, 13 Jul 2026 08:14:00 GMT")
    try:
        dt = email.utils.parsedate_to_datetime(date_str)
        return dt.isoformat().replace('+00:00', 'Z')
    except Exception:
        pass
    # Try ISO-8601 parsing
    try:
        clean_str = date_str.strip()
        if clean_str.endswith('Z'):
            dt = datetime.fromisoformat(clean_str[:-1])
            return dt.isoformat() + 'Z'
        dt = datetime.fromisoformat(clean_str)
        return dt.isoformat() + 'Z'
    except Exception:
        pass
    return datetime.utcnow().isoformat() + 'Z'

# Keyword list for country tagging
COUNTRY_KEYWORDS = {
    "United States": ["United States", "US", "USA", "Washington", "Biden", "America", "American", "Fed", "Federal Reserve", "Pentagon", "White House"],
    "United Kingdom": ["United Kingdom", "UK", "London", "Britain", "British", "NHS", "Downing Street", "Parliament", "BBC"],
    "Germany": ["Germany", "Berlin", "German", "Scholz", "Bundestag", "Eurozone"],
    "Turkey": ["Turkey", "Turkiye", "Ankara", "Istanbul", "Turkish", "Erdogan", "Black Sea"],
    "Japan": ["Japan", "Tokyo", "Japanese", "Yen", "NHK"],
    "France": ["France", "Paris", "French", "Macron", "Bourse", "Eiffel"],
    "China": ["China", "Beijing", "Chinese", "Shanghai", "Xi Jinping"],
    "Russia": ["Russia", "Moscow", "Russian", "Putin", "Kremlin"],
    "India": ["India", "Delhi", "Mumbai", "Indian", "Modi", "Hindu"],
    "Brazil": ["Brazil", "Brazilian", "Amazonia", "Amazon", "Lula", "Rio"],
    "Israel": ["Israel", "Tel Aviv", "Israeli", "Gaza", "Netanyahu"],
    "Ukraine": ["Ukraine", "Kyiv", "Kiev", "Ukrainian", "Zelensky", "frontline"],
    "South Korea": ["South Korea", "Seoul", "Korean", "K-pop"],
    "Australia": ["Australia", "Sydney", "Canberra", "Australian", "Melbourne"]
}

# Auto-detect countries in article title/description
def detect_countries(title, excerpt, primary_country):
    text = (title + " " + excerpt).lower()
    countries = set()
    if primary_country and primary_country != "World":
        countries.add(primary_country)
        
    for country, keywords in COUNTRY_KEYWORDS.items():
        for kw in keywords:
            # Word boundary regex to avoid partial word match (e.g. "us" inside "focus")
            pattern = r'\b' + re.escape(kw.lower()) + r'\b'
            if re.search(pattern, text):
                countries.add(country)
                break
    return list(countries)

# Auto-detect topic based on text keyword heuristics
TOPIC_KEYWORDS = {
    "Technology": ["technology", "ai", "artificial intelligence", "tech", "silicon", "algorithm", "software", "generative", "robot", "digital", "data", "cyber", "internet", "phone", "semiconductor"],
    "Climate": ["climate", "global warming", "heatwave", "deforestation", "temperature", "emissions", "weather", "flood", "storm", "hurricane", "carbon", "environment"],
    "Economy": ["economy", "inflation", "rate cuts", "central bank", "interest rate", "gdp", "employment", "pension", "reform", "retail", "recession"],
    "Finance": ["finance", "market", "stock", "bourse", "wall street", "bond", "shares", "investor", "treasury", "banking", "crypto"],
    "Defence": ["defence", "defense", "military", "nato", "weapons", "missile", "army", "allies", "war", "pentagon", "security"],
    "Diplomacy": ["diplomacy", "summit", "ceasefire", "talks", "truce", "negotiations", "visit", "treaty", "ambassador", "un", "bilateral"],
    "Energy": ["energy", "gas", "oil", "offshore", "petroleum", "coal", "nuclear", "wind", "solar", "pipeline"],
    "Health": ["health", "who", "virus", "outbreak", "mpox", "pandemic", "drug", "medical", "nhs", "disease", "vaccine"],
    "Trade": ["trade", "export", "import", "grain", "supply chain", "tariff", "minerals", "lithium", "cobalt", "deal"]
}

def detect_topic(title, excerpt, default_topic):
    return ""  # şimdilik başlık belirleme sistemini boş bırak (leave topic tag blank for now)

# In-memory defaults
DEFAULT_COUNTRIES = [
    {"name": "World", "flag": "🌐"},
    {"name": "United States", "flag": "🇺🇸"},
    {"name": "United Kingdom", "flag": "🇬🇧"},
    {"name": "Germany", "flag": "🇩🇪"},
    {"name": "Turkey", "flag": "🇹🇷"},
    {"name": "Japan", "flag": "🇯🇵"},
    {"name": "France", "flag": "🇫🇷"},
    {"name": "China", "flag": "🇨🇳"},
    {"name": "Russia", "flag": "🇷🇺"},
    {"name": "India", "flag": "🇮🇳"},
    {"name": "Brazil", "flag": "🇧🇷"},
    {"name": "Israel", "flag": "🇮🇱"},
    {"name": "Ukraine", "flag": "🇺🇦"},
    {"name": "South Korea", "flag": "🇰🇷"},
    {"name": "Australia", "flag": "🇦🇺"}
]

DEFAULT_FEEDS = [
    {"id": "f1", "name": "BBC News World", "url": "http://feeds.bbci.co.uk/news/world/rss.xml", "country": "World"},
    {"id": "f2", "name": "NYT World News", "url": "https://rss.nytimes.com/services/xml/rss/nyt/World.xml", "country": "United States"},
    {"id": "f3", "name": "TRT World News", "url": "https://www.trtworld.com/feed", "country": "Turkey"},
    {"id": "f4", "name": "Deutsche Welle World", "url": "https://rss.dw.com/rdf/rss-en-world", "country": "Germany"},
    {"id": "f5", "name": "NHK World News", "url": "https://www3.nhk.or.jp/nhkworld/rss/xml/news.xml", "country": "Japan"}
]

DEFAULT_ARTICLES = []

# Database operations
def read_json_file(path, default_val):
    if not os.path.exists(path):
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(default_val, f, ensure_ascii=False, indent=2)
        return default_val
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return default_val

def save_json_file(path, val):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(val, f, ensure_ascii=False, indent=2)

def get_countries():
    return read_json_file(COUNTRIES_FILE, DEFAULT_COUNTRIES)

def get_feeds():
    return read_json_file(FEEDS_FILE, DEFAULT_FEEDS)

def get_articles():
    articles = read_json_file(ARTICLES_FILE, DEFAULT_ARTICLES)
    for a in articles:
        a['title'] = a.get('title_tr', a['title'])
        a['excerpt'] = a.get('excerpt_tr', a['excerpt'])
    return articles

def classify_missing_articles_async():
    def worker():
        import time
        time.sleep(3) # Wait for server startup
        
        print("Background LLM & Translation worker thread started.")
        while True:
            try:
                articles = read_json_file(ARTICLES_FILE, DEFAULT_ARTICLES)
                updated = False
                
                for a in articles:
                    # 1. LLM classification for missing labels
                    if "labels" not in a or not a["labels"]:
                        if HAS_LLM:
                            print(f"Background LLM Classifying: {a['title'][:45]}...")
                            labels = get_llm_labels(a['title'], a['excerpt'])
                            if labels:
                                a['labels'] = labels
                                a['topic'] = labels[0]
                                updated = True
                                save_json_file(ARTICLES_FILE, articles)
                                time.sleep(0.3) # Avoid overloading CPU/Ollama
                                
                    # 2. CTranslate2 translation for untranslated articles
                    has_tr = "title_tr" in a and "excerpt_tr" in a and a["title_tr"] != a["title"]
                    if not has_tr:
                        if HAS_TRANSLATOR:
                            print(f"Background NLLB Translating: {a['title'][:45]}...")
                            if a.get('two_step_translation', False):
                                try:
                                    from llm.translator import translate_to_english
                                    english_title = translate_to_english(a['title'])
                                    english_excerpt = translate_to_english(a['excerpt'])
                                    tr_title = translate_to_turkish(english_title)
                                    tr_excerpt = translate_to_turkish(english_excerpt)
                                    
                                    a['title'] = english_title
                                    a['excerpt'] = english_excerpt
                                    a['title_tr'] = tr_title
                                    a['excerpt_tr'] = tr_excerpt
                                except ImportError:
                                    # Fallback if translate_to_english is not available
                                    tr_title = translate_to_turkish(a['title'])
                                    tr_excerpt = translate_to_turkish(a['excerpt'])
                                    a['title_tr'] = tr_title
                                    a['excerpt_tr'] = tr_excerpt
                            else:
                                tr_title = translate_to_turkish(a['title'])
                                tr_excerpt = translate_to_turkish(a['excerpt'])
                                a['title_tr'] = tr_title
                                a['excerpt_tr'] = tr_excerpt
                                
                            updated = True
                            save_json_file(ARTICLES_FILE, articles)
                            time.sleep(0.3) # Avoid overloading CPU
                                
            except Exception as e:
                print(f"Error in background worker sweep: {e}")
                
            time.sleep(5) # Sweep database for new unsynced items every 5 seconds
            
    threading.Thread(target=worker, daemon=True).start()

# Fetching & Parsing feeds
def parse_feed_fallback(url):
    """Fallback XML parser for RSS and Atom using standard urllib + xml.etree"""
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GlobalRssFeeder/1.0'}
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        xml_content = response.read()
        
    root = ET.fromstring(xml_content)
    entries = []
    
    # Try RSS 2.0
    channel = root.find('channel')
    if channel is not None:
        for item_node in channel.findall('item'):
            title = item_node.findtext('title', '')
            link = item_node.findtext('link', '')
            desc = item_node.findtext('description', '')
            pub_date = item_node.findtext('pubDate', '')
            
            # strip HTML tags
            desc_clean = re.sub('<[^<]+?>', '', desc or '')
            if len(desc_clean) > 250:
                desc_clean = desc_clean[:247] + "..."
                
            entries.append({
                'title': title,
                'link': link,
                'summary': desc_clean,
                'published': pub_date
            })
        return entries
        
    # Try Atom
    # Check both with namespace and wildcard
    entry_nodes = root.findall('.//{http://www.w3.org/2005/Atom}entry') or root.findall('.//entry')
    for node in entry_nodes:
        title_el = node.find('{http://www.w3.org/2005/Atom}title') or node.find('title')
        title = title_el.text if title_el is not None else ''
        
        link_el = node.find('{http://www.w3.org/2005/Atom}link') or node.find('link')
        link = ''
        if link_el is not None:
            link = link_el.attrib.get('href', link_el.text or '')
            
        desc_el = node.find('{http://www.w3.org/2005/Atom}summary') or node.find('{http://www.w3.org/2005/Atom}content') or node.find('summary') or node.find('content')
        desc = desc_el.text if desc_el is not None else ''
        desc_clean = re.sub('<[^<]+?>', '', desc or '')
        if len(desc_clean) > 250:
            desc_clean = desc_clean[:247] + "..."
            
        pub_el = node.find('{http://www.w3.org/2005/Atom}published') or node.find('{http://www.w3.org/2005/Atom}updated') or node.find('published') or node.find('updated')
        pub_date = pub_el.text if pub_el is not None else ''
        
        entries.append({
            'title': title,
            'link': link,
            'summary': desc_clean,
            'published': pub_date
        })
    return entries

def fetch_feed_articles(feed):
    url = feed['url']
    source = feed['name']
    primary_country = feed['country']
    two_step_translation = feed.get('two_step_translation', False)
    
    parsed_items = []
    
    try:
        if HAS_FEEDPARSER:
            d = feedparser.parse(url)
            entries = d.entries
            for entry in entries:
                title = entry.get('title', '')
                link = entry.get('link', '')
                summary = entry.get('summary', entry.get('description', ''))
                summary_clean = re.sub('<[^<]+?>', '', summary or '')
                if len(summary_clean) > 250:
                    summary_clean = summary_clean[:247] + "..."
                pub_date = entry.get('published', entry.get('pubDate', ''))
                
                parsed_items.append({
                    'title': title,
                    'link': link,
                    'summary': summary_clean,
                    'published': pub_date
                })
        else:
            parsed_items = parse_feed_fallback(url)
            
        articles = []
        for item in parsed_items:
            title = item['title']
            url_link = item['link']
            excerpt = item['summary']
            pub_iso = parse_date_to_iso(item['published'])
            
            # Run text processing
            countries = detect_countries(title, excerpt, primary_country)
            
            # Initialize with default/empty tags (will be enriched by background thread)
            labels = []
            title_tr = title
            excerpt_tr = excerpt
            
            # Generate stable ID from URL or title
            article_id = str(hash(url_link + title) & 0xffffffff)
            
            articles.append({
                "id": article_id,
                "title": title,
                "title_tr": title_tr,
                "source": source,
                "url": url_link,
                "publishedAt": pub_iso,
                "topic": labels[0] if labels else "",
                "labels": labels,
                "countries": countries,
                "excerpt": excerpt,
                "excerpt_tr": excerpt_tr,
                "primaryCountry": primary_country,
                "two_step_translation": two_step_translation
            })
        return articles
    except Exception as e:
        print(f"Error parsing feed {source} ({url}): {e}")
        return []

def refresh_all_feeds():
    feeds = get_feeds()
    all_new_articles = []
    for f in feeds:
        all_new_articles.extend(fetch_feed_articles(f))
        
    if not all_new_articles:
        return get_articles()
        
    current_articles = get_articles()
    
    # Merge, avoiding duplicates by url or title
    existing_keys = { (a['url'], a['title']) for a in current_articles }
    merged = list(current_articles)
    
    added_count = 0
    for a in all_new_articles:
        key = (a['url'], a['title'])
        if key not in existing_keys:
            merged.append(a)
            existing_keys.add(key)
            added_count += 1
            
    # Sort merged list by publishedAt DESC
    merged.sort(key=lambda x: x['publishedAt'], reverse=True)
    
    # Keep last 150 articles to avoid bloating
    merged = merged[:150]
    
    save_json_file(ARTICLES_FILE, merged)
    print(f"Refreshed feeds: Added {added_count} new articles.")
    return merged

# API Endpoints
@app.route('/', methods=['GET'])
def api_index():
    return jsonify({
        "message": "Global RSS Feeder API is active",
        "version": "1.0",
        "endpoints": {
            "status": "/api/status",
            "news": "/api/news",
            "countries": "/api/countries",
            "feeds": "/api/feeds"
        }
    })

@app.route('/api/status', methods=['GET'])
def api_status():
    return jsonify({"status": "ok", "backend": "python"})

@app.route('/api/countries', methods=['GET'])
def api_get_countries():
    return jsonify(get_countries())

@app.route('/api/countries', methods=['POST'])
def api_add_country():
    data = request.json
    if not data or 'name' not in data or 'flag' not in data:
        return jsonify({"error": "Missing name or flag"}), 400
        
    name = data['name'].strip()
    flag = data['flag'].strip()
    
    if not name or not flag:
        return jsonify({"error": "Name and flag cannot be empty"}), 400
        
    countries = get_countries()
    # Check duplicate
    if any(c['name'].lower() == name.lower() for c in countries):
        return jsonify({"error": f"Country '{name}' already exists"}), 400
        
    countries.append({"name": name, "flag": flag})
    save_json_file(COUNTRIES_FILE, countries)
    return jsonify(countries)

@app.route('/api/feeds', methods=['GET'])
def api_get_feeds():
    return jsonify(get_feeds())

@app.route('/api/feeds', methods=['POST'])
def api_add_feed():
    data = request.json
    if not data or 'name' not in data or 'url' not in data or 'country' not in data:
        return jsonify({"error": "Missing required fields"}), 400
        
    name = data['name'].strip()
    url = data['url'].strip()
    country = data['country'].strip()
    two_step_translation = data.get('two_step_translation', False)
    
    if not name or not url or not country:
        return jsonify({"error": "Fields cannot be empty"}), 400
        
    feeds = get_feeds()
    # Check duplicate url
    if any(f['url'] == url for f in feeds):
        return jsonify({"error": "Feed URL already registered"}), 400
        
    feed_id = "feed_" + str(hash(url) & 0xffff)
    new_feed = {
        "id": feed_id,
        "name": name,
        "url": url,
        "country": country,
        "two_step_translation": two_step_translation
    }
    feeds.append(new_feed)
    save_json_file(FEEDS_FILE, feeds)
    
    # Fetch immediately for this new feed
    new_articles = fetch_feed_articles(new_feed)
    if new_articles:
        current_articles = get_articles()
        existing_keys = { (a['url'], a['title']) for a in current_articles }
        merged = list(current_articles)
        for a in new_articles:
            if (a['url'], a['title']) not in existing_keys:
                merged.append(a)
        merged.sort(key=lambda x: x['publishedAt'], reverse=True)
        save_json_file(ARTICLES_FILE, merged[:150])
        
    return jsonify(feeds)

@app.route('/api/feeds/<feed_id>', methods=['PUT'])
def api_update_feed(feed_id):
    data = request.json
    if not data or 'name' not in data or 'url' not in data or 'country' not in data:
        return jsonify({"error": "Missing required fields"}), 400
        
    name = data['name'].strip()
    url = data['url'].strip()
    country = data['country'].strip()
    two_step_translation = data.get('two_step_translation', False)
    
    if not name or not url or not country:
        return jsonify({"error": "Fields cannot be empty"}), 400
        
    feeds = get_feeds()
    feed_index = next((i for i, f in enumerate(feeds) if f['id'] == feed_id), None)
    if feed_index is None:
        return jsonify({"error": "Feed not found"}), 404
        
    # Check duplicate url with other feeds
    if any(f['url'] == url and f['id'] != feed_id for f in feeds):
        return jsonify({"error": "Another feed is already registered with this URL"}), 400
        
    feeds[feed_index] = {
        "id": feed_id,
        "name": name,
        "url": url,
        "country": country,
        "two_step_translation": two_step_translation
    }
    save_json_file(FEEDS_FILE, feeds)
    return jsonify(feeds)

@app.route('/api/feeds/<feed_id>', methods=['DELETE'])
def api_delete_feed(feed_id):
    feeds = get_feeds()
    feed_index = next((i for i, f in enumerate(feeds) if f['id'] == feed_id), None)
    if feed_index is None:
        return jsonify({"error": "Feed not found"}), 404
        
    feeds.pop(feed_index)
    save_json_file(FEEDS_FILE, feeds)
    return jsonify(feeds)

@app.route('/api/news', methods=['GET'])
def api_get_news():
    return jsonify(get_articles())

@app.route('/api/refresh', methods=['POST'])
def api_refresh():
    articles = refresh_all_feeds()
    return jsonify(articles)

if __name__ == '__main__':
    # Initialize database files
    get_countries()
    get_feeds()
    get_articles()
    
    # Start background classification thread
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true' or not app.debug:
        classify_missing_articles_async()
        
    # Run server
    app.run(host='0.0.0.0', port=5001, debug=True)
