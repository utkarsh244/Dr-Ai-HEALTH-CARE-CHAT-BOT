import React, { useState, useEffect, useCallback } from "react";
import emailjs from "@emailjs/browser";
import { db } from "./firebase";
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy, serverTimestamp
} from "firebase/firestore";
import "./MedicineReminder.css";

// ── EmailJS Config ─────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = "service_l61nwvs";
const EMAILJS_TEMPLATE_ID = "template_ced0k95";
const EMAILJS_PUBLIC_KEY  = "SWtC5TtsykPqd4CTi";

const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Every 4 hours", "Every 6 hours", "Every 8 hours", "As needed"];
const MEAL_TIMES  = ["Before meal", "After meal", "With meal", "Empty stomach", "Any time"];

export default function MedicineReminder({ currentUser, onClose }) {
  const [medicines, setMedicines]     = useState([]);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState({ msg:"", type:"" });
  const [activeTab, setActiveTab]     = useState("list");
  const [notifStatus, setNotifStatus] = useState(
    "Notification" in window ? Notification.permission : "unsupported"
  );
  const [form, setForm] = useState({
    name: "", dosage: "", time: "08:00",
    frequency: "Once daily", mealTime: "After meal", notes: ""
  });

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:"", type:"" }), 4000);
  };

  // ── Load medicines from Firestore ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const q = query(
      collection(db, "users", currentUser.uid, "medicines"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setMedicines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [currentUser]);

  // ── Request notification permission ───────────────────────────────────────
  const requestPermission = async () => {
    if (!("Notification" in window)) {
      showToast("Your browser doesn't support notifications", "error");
      return;
    }
    const result = await Notification.requestPermission();
    setNotifStatus(result);
    if (result === "granted") {
      showToast("✅ Notifications enabled!");
      new Notification("💊 Dr.AI Medicine Reminders", {
        body: "You'll now receive medicine reminders at the scheduled times.",
        icon: "/favicon.ico"
      });
    } else {
      showToast("❌ Please allow notifications in browser settings", "error");
    }
  };

  // ── Send email reminder ───────────────────────────────────────────────────
  const sendEmailReminder = async (med) => {
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email:      currentUser.email,
          user_name:     currentUser.displayName || currentUser.email,
          medicine_name: med.name,
          dosage:        med.dosage,
          meal_time:     med.mealTime,
          frequency:     med.frequency,
          reminder_time: med.time,
        },
        EMAILJS_PUBLIC_KEY
      );
      showToast(`📧 Reminder email sent for ${med.name}!`);
      console.log(`Email sent for ${med.name}`);
    } catch(e) {
      console.error("Email send failed:", e);
    }
  };

  // ── Check reminders every 30 seconds ─────────────────────────────────────
  const checkReminders = useCallback(() => {
    if (medicines.length === 0) return;

    const now     = new Date();
    const hh      = String(now.getHours()).padStart(2, "0");
    const mm      = String(now.getMinutes()).padStart(2, "0");
    const timeNow = `${hh}:${mm}`;

    medicines.forEach(med => {
      if (med.time === timeNow) {
        const notifKey = `notif_${med.id}_${timeNow}`;
        if (!sessionStorage.getItem(notifKey)) {
          sessionStorage.setItem(notifKey, "1");

          // Browser notification
          if (Notification.permission === "granted") {
            new Notification(`💊 Time for ${med.name}`, {
              body: `${med.dosage} · ${med.mealTime}\n${med.frequency}`,
              icon: "/favicon.ico",
              tag:  notifKey,
              requireInteraction: true
            });
          }

          // Email reminder
          sendEmailReminder(med);

          // In-app toast
          showToast(`🔔 Time for ${med.name} — ${med.dosage}! Email sent to ${currentUser.email}`);
        }
      }
    });
  }, [medicines, currentUser]);

  useEffect(() => {
    checkReminders();
    const interval = setInterval(checkReminders, 30000);
    return () => clearInterval(interval);
  }, [checkReminders]);

  // ── Add medicine ──────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.name.trim())   { showToast("Medicine name is required", "error"); return; }
    if (!form.dosage.trim()) { showToast("Dosage is required", "error"); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, "users", currentUser.uid, "medicines"), {
        ...form,
        name:      form.name.trim(),
        dosage:    form.dosage.trim(),
        active:    true,
        createdAt: serverTimestamp()
      });
      setForm({ name:"", dosage:"", time:"08:00", frequency:"Once daily", mealTime:"After meal", notes:"" });
      setActiveTab("list");
      showToast("✅ Medicine reminder added!");
    } catch(e) {
      showToast("❌ Failed to save reminder", "error");
    } finally { setSaving(false); }
  };

  // ── Delete medicine ───────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove reminder for ${name}?`)) return;
    try {
      await deleteDoc(doc(db, "users", currentUser.uid, "medicines", id));
      showToast(`🗑️ ${name} removed`);
    } catch(e) { showToast("❌ Failed to remove", "error"); }
  };

  // ── Test reminder (browser + email) ──────────────────────────────────────
  const sendTestReminder = async () => {
    // Browser notification test
    if (Notification.permission === "granted") {
      new Notification("💊 Test Reminder — Dr.AI", {
        body: "This is how your medicine reminders will look!",
        icon: "/favicon.ico",
        requireInteraction: true
      });
    }
    // Email test
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email:      currentUser.email,
          user_name:     currentUser.displayName || currentUser.email,
          medicine_name: "Test Medicine",
          dosage:        "1 tablet",
          meal_time:     "After meal",
          frequency:     "Once daily",
          reminder_time: "Test",
        },
        EMAILJS_PUBLIC_KEY
      );
      showToast(`✅ Test reminder sent! Check ${currentUser.email}`);
    } catch(e) {
      showToast("❌ Email test failed — check EmailJS config", "error");
      console.error(e);
    }
  };

  // ── Next dose time helper ─────────────────────────────────────────────────
  const getNextDose = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    const now    = new Date();
    const dose   = new Date();
    dose.setHours(h, m, 0, 0);
    if (dose <= now) dose.setDate(dose.getDate() + 1);
    const diff    = dose - now;
    const hours   = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours === 0) return `in ${minutes}m`;
    if (minutes === 0) return `in ${hours}h`;
    return `in ${hours}h ${minutes}m`;
  };

  const PILL_COLORS = ["#667eea","#f59e0b","#22c55e","#ef4444","#8b5cf6","#06b6d4","#f97316"];

  return (
    <div className="reminder-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="reminder-modal">

        {/* Header */}
        <div className="reminder-header">
          <div className="reminder-header-left">
            <div className="reminder-icon">💊</div>
            <div>
              <h2>Medicine Reminders</h2>
              <p>{medicines.length} active reminder{medicines.length !== 1 ? "s" : ""} · 📧 {currentUser.email}</p>
            </div>
          </div>
          <button className="reminder-close" onClick={onClose}>✕</button>
        </div>

        {/* Notification Status */}
        {notifStatus !== "granted" && (
          <div className="notif-banner">
            <span>🔔</span>
            <span>
              {notifStatus === "denied"
                ? "Notifications blocked. Go to browser settings → allow notifications for localhost."
                : "Enable browser notifications for popup alerts."}
            </span>
            {notifStatus !== "denied" && (
              <button onClick={requestPermission}>Enable</button>
            )}
          </div>
        )}

        {/* Active banner */}
        {notifStatus === "granted" && (
          <div className="notif-ok-banner">
            <span>✅ Browser + Email reminders active</span>
            <button className="test-notif-btn" onClick={sendTestReminder}>
              Send test
            </button>
          </div>
        )}

        {/* Email always active banner (even without browser notif) */}
        {notifStatus !== "granted" && (
          <div className="email-banner">
            <span>📧</span>
            <span>Email reminders will always be sent to <strong>{currentUser.email}</strong></span>
            <button className="test-notif-btn" onClick={sendTestReminder}>Test email</button>
          </div>
        )}

        {/* Tabs */}
        <div className="reminder-tabs">
          <button className={`reminder-tab ${activeTab==="list" ? "active" : ""}`} onClick={() => setActiveTab("list")}>
            My Medicines ({medicines.length})
          </button>
          <button className={`reminder-tab ${activeTab==="add" ? "active" : ""}`} onClick={() => setActiveTab("add")}>
            + Add Reminder
          </button>
        </div>

        <div className="reminder-content">

          {/* Medicine List */}
          {activeTab === "list" && (
            <div className="medicine-list">
              {medicines.length === 0 ? (
                <div className="reminder-empty">
                  <div className="reminder-empty-icon">💊</div>
                  <p>No medicine reminders yet</p>
                  <small>Add your first medicine to get started</small>
                  <button className="add-first-btn" onClick={() => setActiveTab("add")}>
                    + Add Medicine
                  </button>
                </div>
              ) : (
                medicines.map((med, idx) => (
                  <div key={med.id} className="medicine-card">
                    <div className="medicine-pill-icon" style={{ background: PILL_COLORS[idx % PILL_COLORS.length] }}>
                      💊
                    </div>
                    <div className="medicine-info">
                      <div className="medicine-name">{med.name}</div>
                      <div className="medicine-dosage">{med.dosage} · {med.mealTime}</div>
                      <div className="medicine-meta">
                        <span className="medicine-freq">{med.frequency}</span>
                        <span className="medicine-time-badge">🕐 {med.time}</span>
                      </div>
                      {med.notes && <div className="medicine-notes">{med.notes}</div>}
                    </div>
                    <div className="medicine-right">
                      <div className="next-dose">
                        <div className="next-dose-label">Next dose</div>
                        <div className="next-dose-time">{getNextDose(med.time)}</div>
                      </div>
                      <button className="medicine-delete" onClick={() => handleDelete(med.id, med.name)} title="Remove">🗑️</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Add Form */}
          {activeTab === "add" && (
            <div className="reminder-form">
              <div className="form-row">
                <div className="form-field">
                  <label>Medicine Name *</label>
                  <input type="text" className="reminder-input" placeholder="e.g. Paracetamol"
                    value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
                </div>
                <div className="form-field">
                  <label>Dosage *</label>
                  <input type="text" className="reminder-input" placeholder="e.g. 500mg, 1 tablet"
                    value={form.dosage} onChange={e => setForm(p => ({...p, dosage: e.target.value}))} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Time</label>
                  <input type="time" className="reminder-input"
                    value={form.time} onChange={e => setForm(p => ({...p, time: e.target.value}))} />
                </div>
                <div className="form-field">
                  <label>Frequency</label>
                  <select className="reminder-input" value={form.frequency}
                    onChange={e => setForm(p => ({...p, frequency: e.target.value}))}>
                    {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>When to take</label>
                <div className="meal-options">
                  {MEAL_TIMES.map(mt => (
                    <button key={mt}
                      className={`meal-option ${form.mealTime === mt ? "active" : ""}`}
                      onClick={() => setForm(p => ({...p, mealTime: mt}))}>
                      {mt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-field">
                <label>Notes (optional)</label>
                <input type="text" className="reminder-input" placeholder="e.g. Take with warm water"
                  value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
              </div>

              <button className="reminder-save-btn" onClick={handleAdd} disabled={saving}>
                {saving ? "Saving..." : "💊 Set Reminder"}
              </button>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast.msg && (
          <div className={`reminder-toast ${toast.type}`}>{toast.msg}</div>
        )}
      </div>
    </div>
  );
}
