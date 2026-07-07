import BACKEND_URL from "./config";
import React, { useState, useEffect, useCallback } from "react";
import "./HealthNews.css";

const CATEGORIES = [
  { key: "health",    label: "All Health",    icon: "🏥", query: "latest health and medical news 2026" },
  { key: "medicine",  label: "Medicine",       icon: "💊", query: "latest medicine drug treatment breakthroughs 2026" },
  { key: "mental",    label: "Mental Health",  icon: "🧠", query: "latest mental health anxiety depression research 2026" },
  { key: "nutrition", label: "Nutrition",      icon: "🥗", query: "latest nutrition diet food health research 2026" },
  { key: "fitness",   label: "Fitness",        icon: "💪", query: "latest fitness exercise workout health news 2026" },
  { key: "disease",   label: "Diseases",       icon: "🦠", query: "latest disease outbreak virus infection news 2026" },
  { key: "cancer",    label: "Cancer",         icon: "🎗️", query: "latest cancer treatment research breakthrough 2026" },
  { key: "aimed",     label: "AI in Medicine", icon: "🤖", query: "latest artificial intelligence healthcare medicine 2026" },
];

const FALLBACK_IMAGES = {
  health:    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&q=80",
  medicine:  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&q=80",
  mental:    "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=600&q=80",
  nutrition: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
  fitness:   "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80",
  disease:   "https://images.unsplash.com/photo-1584118624012-df056829fbd0?w=600&q=80",
  cancer:    "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=600&q=80",
  aimed:     "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&q=80",
};

// Call your own backend — no CORS issues
const fetchNews = async (query, category) => {
  const res = await fetch(`${BACKEND_URL}/news`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ query, category }),
  });
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.articles || [];
};

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diff  = Date.now() - date.getTime();
  if (diff < 0) return "Just now";
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });
}

export default function HealthNews({ onClose }) {
  const [articles, setArticles]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [activeCategory, setCategory] = useState(CATEGORIES[0]);
  const [searchInput, setSearchInput] = useState("");
  const [view, setView]               = useState("grid");

  const loadNews = useCallback(async (cat) => {
    setLoading(true); setError(""); setArticles([]);
    try {
      const results = await fetchNews(cat.query, cat.key);
      if (!results.length) throw new Error("No articles returned");
      setArticles(results);
    } catch(e) {
      setError("Could not load news. Make sure your backend (main.py) is running.");
      console.error("News error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNews(activeCategory); }, [activeCategory, loadNews]);

  const handleCategory = (cat) => { setCategory(cat); setSearchInput(""); };

  const filtered = searchInput.trim()
    ? articles.filter(a =>
        a.title?.toLowerCase().includes(searchInput.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchInput.toLowerCase())
      )
    : articles;

  const fallbackImg = FALLBACK_IMAGES[activeCategory.key];
  const featured    = filtered[0] || null;
  const rest        = filtered.slice(1);

  return (
    <div className="hn-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="hn-modal">

        {/* Header */}
        <div className="hn-header">
          <div className="hn-header-left">
            <div className="hn-logo">📰</div>
            <div>
              <h2>Health News</h2>
              <p>AI-curated latest medical news · newest first</p>
            </div>
          </div>
          <div className="hn-header-right">
            <div className="hn-search-bar">
              <input type="text" placeholder="Filter news..."
                value={searchInput} onChange={e => setSearchInput(e.target.value)} />
              <span>🔍</span>
            </div>
            <div className="hn-view-toggle">
              <button className={view === "grid" ? "active" : ""} onClick={() => setView("grid")}>▦</button>
              <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>☰</button>
            </div>
            <button className="hn-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Categories */}
        <div className="hn-categories">
          {CATEGORIES.map(c => (
            <button key={c.key}
              className={`hn-cat ${activeCategory.key === c.key ? "active" : ""}`}
              onClick={() => handleCategory(c)}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="hn-body">
          {loading && (
            <div className="hn-loading">
              <div className="hn-spinner" />
              <p>Searching latest health news with AI...</p>
            </div>
          )}

          {!loading && error && (
            <div className="hn-error">
              <span>⚠️</span>
              <p>{error}</p>
              <button onClick={() => loadNews(activeCategory)}>↻ Try Again</button>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div className="hn-content">

              {/* Featured */}
              {featured && view === "grid" && (
                <a href={featured.url} target="_blank" rel="noreferrer" className="hn-featured">
                  <div className="hn-featured-img"
                    style={{ backgroundImage: `url(${featured.image || fallbackImg})` }}>
                    <div className="hn-featured-overlay">
                      <div className="hn-featured-top">
                        <span className="hn-badge-top">⭐ Top Story</span>
                        {featured.publishedAt &&
                          <span className="hn-badge-time">🕐 {timeAgo(featured.publishedAt)}</span>}
                      </div>
                      <div className="hn-featured-source">{featured.source}</div>
                      <h3 className="hn-featured-title">{featured.title}</h3>
                      {featured.description &&
                        <p className="hn-featured-desc">{featured.description}</p>}
                      <span className="hn-read-more">Read full article →</span>
                    </div>
                  </div>
                </a>
              )}

              {/* Grid */}
              {view === "grid" && (
                <div className="hn-grid">
                  {rest.map((a, i) => (
                    <a key={i} href={a.url} target="_blank" rel="noreferrer" className="hn-card">
                      <div className="hn-card-img" style={{ backgroundImage: `url(${a.image || fallbackImg})` }} />
                      <div className="hn-card-body">
                        <div className="hn-card-source">{a.source}</div>
                        <div className="hn-card-title">{a.title}</div>
                        <div className="hn-card-desc">{a.description?.slice(0, 100)}</div>
                        <div className="hn-card-meta">
                          {a.publishedAt && <span className="hn-time">🕐 {timeAgo(a.publishedAt)}</span>}
                          <span className="hn-card-link">Read →</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {/* List */}
              {view === "list" && (
                <div className="hn-list">
                  {filtered.map((a, i) => (
                    <a key={i} href={a.url} target="_blank" rel="noreferrer" className="hn-list-item">
                      <div className="hn-list-img" style={{ backgroundImage: `url(${a.image || fallbackImg})` }} />
                      <div className="hn-list-body">
                        <div className="hn-card-source">{a.source}</div>
                        <div className="hn-list-title">{a.title}</div>
                        <div className="hn-list-desc">{a.description?.slice(0, 150)}</div>
                        <div className="hn-card-meta">
                          {a.publishedAt && <span className="hn-time">🕐 {timeAgo(a.publishedAt)}</span>}
                          <span className="hn-card-link">Read full article →</span>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              <div className="hn-footer-note">
                🤖 AI-curated from CNN Health · WHO · WebMD · NIH · Reuters · Sorted newest first
              </div>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && articles.length > 0 && (
            <div className="hn-empty">
              <span>🔍</span><p>No articles match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
