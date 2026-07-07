import React, { useEffect, useRef } from "react";
import { useTheme } from "./ThemeContext";
import ExportMenu from "./ExportMenu";
import "./RightPanel.css";

export default function RightPanel({
  open,
  onClose,
  chat,
  activeConversationId,
  conversationTitle,
  currentUser,
  onShowReminder,
  onShowSymptomChecker,
  onShowDashboard,
  onGenerateReport,
  onShowHospitals,
  onShowNews,
  onShowFamily,
  onShowReportAnalyzer,
}) {
  const { isDark, toggleTheme } = useTheme();
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (open && panelRef.current && !panelRef.current.contains(e.target)) {
        // Don't close if clicking the hamburger button itself
        if (!e.target.closest(".hamburger-btn")) onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  const MenuItem = ({ icon, label, onClick, accent, badge }) => (
    <button className={`rp-menu-item ${accent ? "accent" : ""}`} onClick={() => { onClick(); onClose(); }}>
      <span className="rp-menu-icon">{icon}</span>
      <span className="rp-menu-label">{label}</span>
      {badge && <span className="rp-badge">{badge}</span>}
    </button>
  );

  return (
    <>
      {/* Backdrop */}
      {open && <div className="rp-backdrop" onClick={onClose} />}

      {/* Panel */}
      <div className={`rp-panel ${open ? "open" : ""}`} ref={panelRef}>

        {/* Header */}
        <div className="rp-header">
          <span className="rp-title">Tools & Features</span>
          <button className="rp-close" onClick={onClose}>✕</button>
        </div>

        {/* User info */}
        <div className="rp-user">
          <div
            className="rp-avatar"
            style={currentUser?.photoURL ? {
              backgroundImage: `url(${currentUser.photoURL})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            } : {}}
          >
            {!currentUser?.photoURL && (
              <span>{(currentUser?.displayName || currentUser?.email)?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="rp-user-name">{currentUser?.displayName || currentUser?.email}</div>
            <div className="rp-user-email">{currentUser?.email}</div>
          </div>
        </div>

        <div className="rp-divider" />

        {/* Health Tools */}
        <div className="rp-section-label">Health Tools</div>
        <MenuItem icon="💊" label="Medicine Reminders"    onClick={onShowReminder} />
        <MenuItem icon="🩺" label="Symptom Checker"       onClick={onShowSymptomChecker} />
        <MenuItem icon="📊" label="Health Dashboard"      onClick={onShowDashboard} />
        <MenuItem icon="🏥" label="Nearby Hospitals"      onClick={onShowHospitals} />
        <MenuItem icon="📰" label="Health News"           onClick={onShowNews} />
        <MenuItem icon="👨‍👩‍👧‍👦" label="Family Profiles"      onClick={onShowFamily} />
        <MenuItem icon="🔬" label="Report Analyzer"       onClick={onShowReportAnalyzer} />

        <div className="rp-divider" />

        {/* Chat Tools */}
        <div className="rp-section-label">Chat Tools</div>
        <div className="rp-export-wrap" onClick={e => e.stopPropagation()}>
          <ExportMenu
            chat={chat}
            conversationId={activeConversationId}
            conversationTitle={conversationTitle}
          />
        </div>
        {chat.length > 0 && (
          <MenuItem
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="18" x2="12" y2="12"/>
                <polyline points="9 15 12 18 15 15"/>
              </svg>
            }
            label="Download Health Report"
            onClick={onGenerateReport}
            accent
          />
        )}

        <div className="rp-divider" />

        {/* Appearance */}
        <div className="rp-section-label">Appearance</div>
        <button className="rp-menu-item" onClick={toggleTheme}>
          <span className="rp-menu-icon">{isDark ? "☀️" : "🌙"}</span>
          <span className="rp-menu-label">{isDark ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* Footer */}
        <div className="rp-footer">
          <span>Dr.AI v1.0 · More features coming soon</span>
        </div>
      </div>
    </>
  );
}
