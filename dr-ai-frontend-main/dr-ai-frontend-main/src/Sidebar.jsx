import React, { useEffect, useState } from "react";
import { loadConversations, deleteConversation, formatTime } from "./services/chatService";
import AdminPanel from "./AdminPanel";
import UserProfile from "./UserProfile";
import { useLanguage } from "./LanguageContext";
import "./Sidebar.css";

export default function Sidebar({
  currentUser,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  refreshTrigger,
  collapsed,
  activeMember,
  mobileOpen,
  onToggleCollapse,
}) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [deletingId, setDeletingId]       = useState(null);
  const [showAdmin, setShowAdmin]         = useState(false);
  const [showProfile, setShowProfile]     = useState(false);
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const { strings } = useLanguage();

  useEffect(() => {
    if (!currentUser) return;
    fetchConversations();
  }, [currentUser, refreshTrigger, activeMember]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const memberId = activeMember?.id || "self";
      const convos = await loadConversations(currentUser.uid, memberId);
      setConversations(convos);
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, conversationId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;
    setDeletingId(conversationId);
    try {
      await deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (conversationId === activeConversationId) onNewChat();
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const grouped = groupConversations(filteredConversations);

  const highlightText = (text, query) => {
    if (!query.trim()) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <mark key={i} className="search-highlight">{part}</mark>
        : part
    );
  };

  const avatarLetter = (currentUser.displayName || currentUser.email)?.[0]?.toUpperCase();

  // ── COLLAPSED (icon rail) ─────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="sidebar sidebar-collapsed">
        {/* Expand button */}
        <button className="collapse-btn rail-toggle" onClick={onToggleCollapse} title="Open sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        </button>

        {/* New chat */}
        <button className="rail-btn" onClick={onNewChat} title="New consultation">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </button>

        {/* Search */}
        <button className="rail-btn" onClick={onToggleCollapse} title="Search conversations">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>

        {/* Recent conversations dots */}
        <div className="rail-divider" />
        {conversations.slice(0, 5).map(convo => (
          <button key={convo.id}
            className={`rail-btn rail-convo ${convo.id === activeConversationId ? "active" : ""}`}
            onClick={() => onSelectConversation(convo)}
            title={convo.title}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        ))}

        {/* Admin */}
        {currentUser.email === "nikhilmishra6204@gmail.com" && (
          <>
            <div className="rail-divider" />
            <button className="rail-btn" onClick={() => setShowAdmin(true)} title="Admin Panel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
              </svg>
            </button>
          </>
        )}

        {/* Spacer + Profile */}
        <div className="rail-spacer" />
        <button className="rail-avatar" onClick={() => setShowProfile(true)} title="View Profile"
          style={currentUser.photoURL ? {
            backgroundImage: `url(${currentUser.photoURL})`,
            backgroundSize: "cover", backgroundPosition: "center"
          } : {}}>
          {!currentUser.photoURL && <span>{avatarLetter}</span>}
        </button>

        {showAdmin   && <AdminPanel  onClose={() => setShowAdmin(false)} />}
        {showProfile && <UserProfile currentUser={currentUser} onClose={() => setShowProfile(false)} />}
      </div>
    );
  }

  // ── EXPANDED ──────────────────────────────────────────────────────────────
  return (
    <div className={`sidebar sidebar-expanded ${mobileOpen ? "mobile-open" : ""}`}>
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">AI</div>
          <span className="logo-text">Dr.AI</span>
        </div>
        <div className="sidebar-header-actions">
          <button className="new-chat-btn" onClick={onNewChat} title="New consultation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
          <button className="collapse-btn" onClick={onToggleCollapse} title="Collapse sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Active Member Banner */}
      {activeMember && (
        <div className="sidebar-member-banner">
          <span className="smb-avatar">{activeMember.avatar}</span>
          <div className="smb-info">
            <span className="smb-name">{activeMember.name}</span>
            <span className="smb-relation">{activeMember.relation}</span>
          </div>
        </div>
      )}

      {/* Search */}
      <div className={`search-wrapper ${searchFocused ? "focused" : ""}`}>
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder={strings.searchPlaceholder}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery("")} title="Clear">✕</button>
        )}
      </div>

      {/* Conversation List */}
      <div className="sidebar-content">
        {loading ? (
          <div className="sidebar-loading">
            <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
          </div>
        ) : searchQuery && filteredConversations.length === 0 ? (
          <div className="sidebar-empty">
            <span>🔍 {strings.noResults}</span>
            <small>{strings.tryKeyword}</small>
          </div>
        ) : conversations.length === 0 ? (
          <div className="sidebar-empty">
            <span>{strings.noConversations}</span>
            <small>{strings.startNew}</small>
          </div>
        ) : (
          Object.entries(grouped).map(([group, convos]) =>
            convos.length > 0 && (
              <div key={group} className="conversation-group">
                <div className="group-label">{group}</div>
                {convos.map(convo => (
                  <div
                    key={convo.id}
                    className={`conversation-item ${convo.id === activeConversationId ? "active" : ""}`}
                    onClick={() => onSelectConversation(convo)}
                  >
                    <div className="convo-icon">💬</div>
                    <div className="convo-info">
                      <div className="convo-title">{highlightText(convo.title, searchQuery)}</div>
                      <div className="convo-time">{formatTime(convo.updatedAt)}</div>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={e => handleDelete(e, convo.id)}
                      disabled={deletingId === convo.id}
                      title="Delete"
                    >
                      {deletingId === convo.id ? "..." : "🗑️"}
                    </button>
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="footer-avatar-btn" onClick={() => setShowProfile(true)} title="View Profile"
          style={currentUser.photoURL ? {
            backgroundImage: `url(${currentUser.photoURL})`,
            backgroundSize: "cover", backgroundPosition: "center"
          } : {}}>
          {!currentUser.photoURL && (
            <div className="footer-avatar-placeholder">{avatarLetter}</div>
          )}
        </button>
        <div className="footer-user" onClick={() => setShowProfile(true)} style={{ cursor:"pointer" }}>
          <div className="footer-name">{currentUser.displayName || currentUser.email}</div>
          <div className="footer-email">{currentUser.email}</div>
        </div>
        {currentUser.email === "nikhilmishra6204@gmail.com" && (
          <button className="admin-btn" onClick={() => setShowAdmin(true)} title="Admin Panel">🛠️</button>
        )}
      </div>

      {showAdmin   && <AdminPanel  onClose={() => setShowAdmin(false)} />}
      {showProfile && <UserProfile currentUser={currentUser} onClose={() => setShowProfile(false)} />}
    </div>
  );
}

function groupConversations(conversations) {
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today - 86400000);
  const thisWeek  = new Date(today - 7 * 86400000);
  const groups    = { Today: [], Yesterday: [], "This Week": [], Older: [] };
  conversations.forEach(convo => {
    const date = convo.updatedAt instanceof Date ? convo.updatedAt : new Date();
    if (date >= today)          groups["Today"].push(convo);
    else if (date >= yesterday) groups["Yesterday"].push(convo);
    else if (date >= thisWeek)  groups["This Week"].push(convo);
    else                        groups["Older"].push(convo);
  });
  return groups;
}
