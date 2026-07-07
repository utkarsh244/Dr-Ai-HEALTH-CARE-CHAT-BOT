import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import "./EmergencySOS.css";

// ── India emergency numbers ───────────────────────────────────────────────────
const EMERGENCY_SERVICES = [
  { name: "Ambulance",     number: "108", icon: "🚑", color: "#ef4444", desc: "Medical emergency" },
  { name: "Police",        number: "100", icon: "🚔", color: "#3b82f6", desc: "Crime / accident" },
  { name: "Fire Brigade",  number: "101", icon: "🚒", color: "#f97316", desc: "Fire emergency" },
  { name: "Disaster",      number: "112", icon: "🆘", color: "#8b5cf6", desc: "National emergency" },
  { name: "Women Helpline",number: "181", icon: "👩", color: "#ec4899", desc: "Women in distress" },
  { name: "Child Helpline",number: "1098", icon: "👶", color: "#06b6d4", desc: "Child emergency" },
];

const FIRST_AID = [
  {
    title: "Heart Attack",
    icon: "❤️",
    color: "#ef4444",
    steps: ["Call 108 immediately", "Make person sit/lie comfortably", "Loosen tight clothing", "Give aspirin if available & not allergic", "Do CPR if unconscious & not breathing"]
  },
  {
    title: "Choking",
    icon: "🫁",
    color: "#f97316",
    steps: ["Ask 'Are you choking?'", "If yes, give 5 firm back blows between shoulder blades", "Give 5 abdominal thrusts (Heimlich)", "Alternate back blows & thrusts", "Call 108 if object not removed"]
  },
  {
    title: "Severe Bleeding",
    icon: "🩸",
    color: "#dc2626",
    steps: ["Apply firm pressure with clean cloth", "Do NOT remove cloth — add more on top", "Elevate the injured area if possible", "Keep pressure for 10–15 minutes", "Call 108 for deep or spurting wounds"]
  },
  {
    title: "Burns",
    icon: "🔥",
    color: "#f59e0b",
    steps: ["Cool burn with cool (not ice) water for 20 min", "Do NOT use butter, toothpaste or ice", "Cover loosely with clean bandage", "Remove jewelry near burn gently", "Call 108 for large or deep burns"]
  },
  {
    title: "Stroke",
    icon: "🧠",
    color: "#8b5cf6",
    steps: ["Use FAST: Face drooping? Arm weakness? Speech difficulty? Time to call!", "Call 108 immediately", "Keep person still and calm", "Do NOT give food or water", "Note time symptoms started"]
  },
  {
    title: "Fainting",
    icon: "😵",
    color: "#06b6d4",
    steps: ["Lay person flat on back", "Elevate legs 12 inches above heart", "Loosen tight clothing", "Check breathing", "Call 108 if not recovering in 1 min"]
  },
];

export default function EmergencySOS({ currentUser, onClose }) {
  const [tab, setTab]                   = useState("sos");      // "sos" | "firstaid" | "contact"
  const [selectedAid, setSelectedAid]   = useState(null);
  const [contact, setContact]           = useState({ name: "", phone: "", relation: "" });
  const [savedContact, setSavedContact] = useState(null);
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState({ msg: "", type: "" });
  const [sosActive, setSosActive]       = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3000);
  };

  // ── Load saved emergency contact ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid, "settings", "emergencyContact"));
        if (snap.exists()) {
          setSavedContact(snap.data());
          setContact(snap.data());
        }
      } catch(e) { console.error(e); }
    };
    load();
  }, [currentUser]);

  // ── Save emergency contact ────────────────────────────────────────────────
  const handleSaveContact = async () => {
    if (!contact.name.trim() || !contact.phone.trim()) {
      showToast("Name and phone are required", "error"); return;
    }
    if (contact.phone.length < 10) {
      showToast("Enter a valid 10-digit phone number", "error"); return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, "users", currentUser.uid, "settings", "emergencyContact"), contact);
      setSavedContact(contact);
      showToast("✅ Emergency contact saved!");
    } catch(e) {
      showToast("❌ Failed to save contact", "error");
    } finally { setSaving(false); }
  };

  // ── Call emergency number ─────────────────────────────────────────────────
  const handleCall = (number, name) => {
    if (window.confirm(`Call ${name} (${number})?`)) {
      window.location.href = `tel:${number}`;
    }
  };

  // ── Share location via WhatsApp ───────────────────────────────────────────
  const handleShareLocation = () => {
    if (!savedContact?.phone) {
      showToast("Please save an emergency contact first", "error"); return;
    }
    if (!navigator.geolocation) {
      showToast("Location not supported on this device", "error"); return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const msg = encodeURIComponent(
          `🆘 EMERGENCY ALERT from ${currentUser.displayName || currentUser.email}!\n\nI need help! My current location:\nhttps://maps.google.com/?q=${latitude},${longitude}\n\nSent via Dr.AI`
        );
        const phone = savedContact.phone.replace(/\D/g, "");
        window.open(`https://wa.me/91${phone}?text=${msg}`, "_blank");
        setSosActive(true);
        setTimeout(() => setSosActive(false), 5000);
      },
      () => {
        // Fallback without location
        const msg = encodeURIComponent(
          `🆘 EMERGENCY ALERT from ${currentUser.displayName || currentUser.email}!\n\nI need immediate help! Please call me or contact emergency services.\n\nSent via Dr.AI`
        );
        const phone = savedContact.phone.replace(/\D/g, "");
        window.open(`https://wa.me/91${phone}?text=${msg}`, "_blank");
      }
    );
  };

  // ── Send via WhatsApp (works on desktop too) ─────────────────────────────
  const handleSendWhatsApp = () => {
    if (!savedContact?.phone) {
      showToast("Please save an emergency contact first", "error"); return;
    }
    const msg = encodeURIComponent(
      `🆘 EMERGENCY ALERT from ${currentUser.displayName || currentUser.email}!\n\nI need immediate help! Please call me or contact emergency services.\n\nSent via Dr.AI`
    );
    const phone = savedContact.phone.replace(/\D/g, "");
    window.open(`https://wa.me/91${phone}?text=${msg}`, "_blank");
    showToast("✅ Opening WhatsApp...");
  };

  return (
    <div className="sos-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sos-modal">

        {/* Header */}
        <div className="sos-header">
          <div className="sos-header-left">
            <div className="sos-icon-wrap">
              <span className="sos-icon-pulse"></span>
              <span className="sos-icon">🆘</span>
            </div>
            <div>
              <h2>Emergency SOS</h2>
              <p>Quick access to emergency services & first aid</p>
            </div>
          </div>
          <button className="sos-close" onClick={onClose}>✕</button>
        </div>

        {/* Big SOS + Share Location */}
        <div className="sos-actions-bar">
          <button className={`sos-main-btn ${sosActive ? "sos-sent" : ""}`} onClick={handleShareLocation}>
            <span className="sos-btn-icon">📍</span>
            <span>{sosActive ? "SOS Sent!" : "SOS — Share Location"}</span>
          </button>
          <button className="sos-sms-btn" onClick={handleSendWhatsApp}>
            <span>💬 WhatsApp Alert</span>
          </button>
        </div>

        {savedContact && (
          <div className="sos-contact-bar">
            <span>👤 Emergency contact: <strong>{savedContact.name}</strong> ({savedContact.relation}) · {savedContact.phone}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="sos-tabs">
          <button className={`sos-tab ${tab === "sos" ? "active" : ""}`} onClick={() => setTab("sos")}>
            📞 Emergency Numbers
          </button>
          <button className={`sos-tab ${tab === "firstaid" ? "active" : ""}`} onClick={() => setTab("firstaid")}>
            🩹 First Aid
          </button>
          <button className={`sos-tab ${tab === "contact" ? "active" : ""}`} onClick={() => setTab("contact")}>
            👤 My Contact
          </button>
        </div>

        <div className="sos-body">

          {/* Emergency Numbers */}
          {tab === "sos" && (
            <div className="sos-numbers">
              {EMERGENCY_SERVICES.map(svc => (
                <button key={svc.number} className="sos-service-btn"
                  onClick={() => handleCall(svc.number, svc.name)}>
                  <div className="sos-svc-icon" style={{ background: svc.color }}>{svc.icon}</div>
                  <div className="sos-svc-info">
                    <div className="sos-svc-name">{svc.name}</div>
                    <div className="sos-svc-desc">{svc.desc}</div>
                  </div>
                  <div className="sos-svc-number" style={{ color: svc.color }}>{svc.number}</div>
                  <div className="sos-call-icon">📞</div>
                </button>
              ))}
            </div>
          )}

          {/* First Aid */}
          {tab === "firstaid" && (
            <div className="sos-firstaid">
              {!selectedAid ? (
                <div className="sos-aid-grid">
                  {FIRST_AID.map((aid, i) => (
                    <button key={i} className="sos-aid-card"
                      style={{ "--aid-color": aid.color }}
                      onClick={() => setSelectedAid(aid)}>
                      <span className="sos-aid-icon">{aid.icon}</span>
                      <span className="sos-aid-title">{aid.title}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="sos-aid-detail">
                  <button className="sos-back-btn" onClick={() => setSelectedAid(null)}>← Back</button>
                  <div className="sos-aid-detail-header" style={{ color: selectedAid.color }}>
                    <span>{selectedAid.icon}</span>
                    <h3>{selectedAid.title} — First Aid Steps</h3>
                  </div>
                  <div className="sos-steps">
                    {selectedAid.steps.map((step, i) => (
                      <div key={i} className="sos-step">
                        <div className="sos-step-num" style={{ background: selectedAid.color }}>{i + 1}</div>
                        <div className="sos-step-text">{step}</div>
                      </div>
                    ))}
                  </div>
                  <div className="sos-aid-warning">
                    Always call 108 for serious emergencies while providing first aid.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Emergency Contact */}
          {tab === "contact" && (
            <div className="sos-contact-form">
              <p className="sos-contact-desc">
                Save a trusted person's number. In an emergency, Dr.AI will send your location to them via WhatsApp.
              </p>
              <div className="sos-form-field">
                <label>Full Name *</label>
                <input type="text" className="sos-input" placeholder="e.g. Mom, Dad, Spouse"
                  value={contact.name} onChange={e => setContact(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="sos-form-field">
                <label>Phone Number *</label>
                <input type="tel" className="sos-input" placeholder="10-digit mobile number"
                  value={contact.phone} onChange={e => setContact(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="sos-form-field">
                <label>Relation</label>
                <input type="text" className="sos-input" placeholder="e.g. Mother, Friend, Doctor"
                  value={contact.relation} onChange={e => setContact(p => ({ ...p, relation: e.target.value }))} />
              </div>
              <button className="sos-save-btn" onClick={handleSaveContact} disabled={saving}>
                {saving ? "Saving..." : "💾 Save Emergency Contact"}
              </button>

              {savedContact && (
                <div className="sos-saved-card">
                  <div className="sos-saved-label">Saved Contact</div>
                  <div className="sos-saved-name">{savedContact.name}</div>
                  <div className="sos-saved-info">{savedContact.phone} · {savedContact.relation}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toast */}
        {toast.msg && (
          <div className={`sos-toast ${toast.type}`}>{toast.msg}</div>
        )}
      </div>
    </div>
  );
}
