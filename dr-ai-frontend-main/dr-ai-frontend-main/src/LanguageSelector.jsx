import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "./LanguageContext";
import "./LanguageSelector.css";

export default function LanguageSelector() {
  const { uiLanguage, setUiLanguage, strings, LANGUAGES } = useLanguage();
  const [open, setOpen]   = useState(false);
  const ref               = useRef(null);

  const current = LANGUAGES.find(l => l.code === uiLanguage) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="lang-selector" ref={ref}>
      <button className="lang-trigger" onClick={() => setOpen(p => !p)} title={strings.selectLanguage}>
        <span className="lang-flag">{current.flag}</span>
        <span className="lang-code">{current.code.toUpperCase().slice(0, 2)}</span>
        <svg className={`lang-chevron ${open ? "open" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="lang-dropdown">
          <div className="lang-dropdown-title">{strings.selectLanguage}</div>
          <div className="lang-list">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                className={`lang-option ${lang.code === uiLanguage ? "active" : ""}`}
                onClick={() => { setUiLanguage(lang.code); setOpen(false); }}
              >
                <span className="lang-option-flag">{lang.flag}</span>
                <span className="lang-option-name">{lang.name}</span>
                {lang.code === uiLanguage && <span className="lang-check">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
