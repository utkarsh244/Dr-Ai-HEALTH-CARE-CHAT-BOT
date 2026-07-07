import React, { useState, useRef, useEffect } from "react";
import { downloadAsPDF, downloadAsTXT, shareConversationLink } from "./services/chatExport";
import "./ExportMenu.css";

export default function ExportMenu({ chat, conversationId, conversationTitle }) {
  const [open, setOpen]         = useState(false);
  const [toast, setToast]       = useState("");
  const menuRef                 = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const handlePDF = () => {
    if (!chat.length) { showToast("⚠️ No messages to export"); return; }
    downloadAsPDF(chat, conversationTitle);
    setOpen(false);
    showToast("📄 Opening PDF print dialog...");
  };

  const handleTXT = () => {
    if (!chat.length) { showToast("⚠️ No messages to export"); return; }
    downloadAsTXT(chat, conversationTitle);
    setOpen(false);
    showToast("✅ TXT file downloaded!");
  };

  const handleShare = async () => {
    const result = await shareConversationLink(conversationId, conversationTitle);
    setOpen(false);
    if (result === "copied") showToast("🔗 Link copied to clipboard!");
    else if (result === true) showToast("✅ Shared successfully!");
    else showToast("⚠️ Start a conversation first");
  };

  return (
    <div className="export-menu-wrapper" ref={menuRef}>
      {/* Trigger Button */}
      <button
        className={`export-trigger-btn ${open ? "active" : ""}`}
        onClick={() => setOpen(prev => !prev)}
        title="Export or share conversation"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <polyline points="16 6 12 2 8 6"/>
          <line x1="12" y1="2" x2="12" y2="15"/>
        </svg>
        <span>Export</span>
        <svg className={`chevron ${open ? "up" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="export-dropdown">
          <div className="export-dropdown-title">Export Conversation</div>

          <button className="export-option" onClick={handlePDF}>
            <div className="export-option-icon pdf">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <div className="export-option-info">
              <div className="export-option-label">Download as PDF</div>
              <div className="export-option-desc">Print-ready formatted document</div>
            </div>
          </button>

          <button className="export-option" onClick={handleTXT}>
            <div className="export-option-icon txt">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
              </svg>
            </div>
            <div className="export-option-info">
              <div className="export-option-label">Download as TXT</div>
              <div className="export-option-desc">Plain text file</div>
            </div>
          </button>

          <div className="export-divider"></div>

          <button className="export-option" onClick={handleShare}>
            <div className="export-option-icon share">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </div>
            <div className="export-option-info">
              <div className="export-option-label">Share Link</div>
              <div className="export-option-desc">Copy conversation link</div>
            </div>
          </button>
        </div>
      )}

      {/* Toast notification */}
      {toast && <div className="export-toast">{toast}</div>}
    </div>
  );
}
