import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection, query, orderBy, where,
  getDocs
} from "firebase/firestore";
import "./HealthDashboard.css";

// ── Mini bar chart ─────────────────────────────────────────────────────────────
function BarChart({ data, color }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="bar-chart">
      {data.map((d, i) => (
        <div key={i} className="bar-col">
          <div className="bar-fill" style={{
            height: `${(d.value / max) * 100}%`,
            background: color,
            animationDelay: `${i * 60}ms`
          }} />
          <div className="bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color, delay }) {
  return (
    <div className="stat-card" style={{ animationDelay: delay }}>
      <div className="stat-icon" style={{ background: color }}>{icon}</div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
        {sub && <div className="stat-sub">{sub}</div>}
      </div>
    </div>
  );
}

export default function HealthDashboard({ currentUser, onClose }) {
  const [loading, setLoading]         = useState(true);
  const [stats, setStats]             = useState({
    totalConversations: 0,
    totalMessages:      0,
    thisWeekCount:      0,
    activeMedicines:    0,
    weeklyData:         [],
    recentConvos:       [],
    medicines:          [],
    joinedDate:         null,
  });

  useEffect(() => {
    if (!currentUser) return;
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // ── Conversations — root collection filtered by uid ───────────────────
      const convosSnap = await getDocs(
        query(
          collection(db, "conversations"),
          where("uid", "==", currentUser.uid),
          orderBy("updatedAt", "desc")
        )
      );
      const convos = convosSnap.docs.map(d => ({
        id: d.id, ...d.data(),
        updatedAt: d.data().updatedAt?.toDate?.() || new Date(),
      }));

      // ── Count messages for recent 5 convos ────────────────────────────────
      let totalMessages = 0;
      const recentConvos = convos.slice(0, 5);
      for (const convo of recentConvos) {
        const msgSnap = await getDocs(
          collection(db, "conversations", convo.id, "messages")
        );
        convo.messageCount = msgSnap.size;
        totalMessages += msgSnap.size;
      }
      // Estimate for older convos
      if (convos.length > 5) {
        const avg = totalMessages / recentConvos.length || 4;
        totalMessages += Math.round((convos.length - 5) * avg);
      }

      // ── Weekly chart (last 7 days) ────────────────────────────────────────
      const days  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      const today = new Date();
      const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        const count = convos.filter(c => {
          const cd = c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt);
          return cd.toDateString() === d.toDateString();
        }).length;
        return { label: days[d.getDay()], value: count };
      });

      // ── This week consultations ───────────────────────────────────────────
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      const thisWeekCount = convos.filter(c => {
        const cd = c.updatedAt instanceof Date ? c.updatedAt : new Date(c.updatedAt);
        return cd >= weekAgo;
      }).length;

      // ── Medicines — root medicines collection ─────────────────────────────
      const medsSnap = await getDocs(
        collection(db, "users", currentUser.uid, "medicines")
      );
      const medicines = medsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // ── Join date ─────────────────────────────────────────────────────────
      const joinedDate = currentUser.metadata?.creationTime
        ? new Date(currentUser.metadata.creationTime).toLocaleDateString("en-IN", {
            day:"numeric", month:"short", year:"numeric"
          })
        : null;

      setStats({
        totalConversations: convos.length,
        totalMessages,
        thisWeekCount,
        activeMedicines:    medicines.length,
        weeklyData,
        recentConvos:       recentConvos.slice(0, 5),
        medicines:          medicines.slice(0, 4),
        joinedDate,
      });
    } catch(e) {
      console.error("Dashboard fetch failed:", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Health score (fun metric) ─────────────────────────────────────────────
  const healthScore = Math.min(100, Math.round(
    Math.min(30, stats.totalConversations * 3) +
    (stats.activeMedicines > 0 ? 25 : 0) +
    Math.min(25, Math.floor(stats.totalMessages / 2)) +
    (stats.thisWeekCount > 0 ? 20 : 0)
  ));

  const scoreColor = healthScore >= 75 ? "#22c55e" : healthScore >= 50 ? "#f59e0b" : "#ef4444";
  const scoreLabel = healthScore >= 75 ? "Excellent" : healthScore >= 50 ? "Good" : "Getting Started";

  // ── Next medicine ─────────────────────────────────────────────────────────
  const getNextMed = () => {
    if (!stats.medicines.length) return null;
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const sorted = [...stats.medicines].sort((a, b) => {
      const [ah, am] = a.time.split(":").map(Number);
      const [bh, bm] = b.time.split(":").map(Number);
      const aNext = (ah * 60 + am - nowMins + 1440) % 1440;
      const bNext = (bh * 60 + bm - nowMins + 1440) % 1440;
      return aNext - bNext;
    });
    return sorted[0];
  };

  const nextMed = getNextMed();

  const getTimeUntil = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    const now  = new Date();
    const dose = new Date();
    dose.setHours(h, m, 0, 0);
    if (dose <= now) dose.setDate(dose.getDate() + 1);
    const diff  = dose - now;
    const hours = Math.floor(diff / 3600000);
    const mins  = Math.floor((diff % 3600000) / 60000);
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="hd-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="hd-modal">

        {/* Header */}
        <div className="hd-header">
          <div className="hd-header-left">
            <div className="hd-icon">📊</div>
            <div>
              <h2>Health Dashboard</h2>
              <p>Welcome back, {currentUser.displayName || currentUser.email?.split("@")[0]}
                {stats.joinedDate && <span className="joined-date"> · Member since {stats.joinedDate}</span>}
              </p>
            </div>
          </div>
          <div className="hd-header-right">
            <button className="hd-refresh" onClick={fetchDashboardData} title="Refresh">↻</button>
            <button className="hd-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {loading ? (
          <div className="hd-loading">
            <div className="hd-spinner"></div>
            <p>Loading your health data...</p>
          </div>
        ) : (
          <div className="hd-body">

            {/* Health Score */}
            <div className="hd-score-card">
              <div className="score-left">
                <div className="score-title">Health Engagement Score</div>
                <div className="score-value" style={{ color: scoreColor }}>{healthScore}</div>
                <div className="score-label" style={{ color: scoreColor }}>{scoreLabel}</div>
                <div className="score-desc">Based on your consultation activity, medicine adherence and app usage</div>
              </div>
              <div className="score-ring-wrapper">
                <svg className="score-ring" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="10"/>
                  <circle cx="60" cy="60" r="50" fill="none"
                    stroke={scoreColor} strokeWidth="10"
                    strokeDasharray={`${(healthScore / 100) * 314} 314`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dasharray 1.2s ease" }}
                  />
                  <text x="60" y="55" textAnchor="middle" fill="var(--text-primary)" fontSize="22" fontWeight="700">{healthScore}</text>
                  <text x="60" y="72" textAnchor="middle" fill="var(--text-muted)" fontSize="11">/100</text>
                </svg>
              </div>
            </div>

            {/* Stat Cards */}
            <div className="hd-stats-grid">
              <StatCard icon="💬" label="Consultations" value={stats.totalConversations}
                sub="Total sessions" color="linear-gradient(135deg,#667eea,#764ba2)" delay="0.05s"/>
              <StatCard icon="📨" label="Messages" value={stats.totalMessages}
                sub="With Dr.AI" color="linear-gradient(135deg,#06b6d4,#0284c7)" delay="0.1s"/>
              <StatCard icon="💊" label="Medicines" value={stats.activeMedicines}
                sub="Active reminders" color="linear-gradient(135deg,#22c55e,#16a34a)" delay="0.15s"/>
              <StatCard icon="📅" label="This Week" value={stats.thisWeekCount}
                sub="Consultations" color="linear-gradient(135deg,#f59e0b,#d97706)" delay="0.2s"/>
            </div>

            {/* Weekly Chart + Next Medicine */}
            <div className="hd-mid-grid">

              {/* Weekly Activity */}
              <div className="hd-card">
                <div className="hd-card-header">
                  <span className="hd-card-title">📈 Weekly Activity</span>
                  <span className="hd-card-sub">Consultations per day</span>
                </div>
                {stats.weeklyData.every(d => d.value === 0) ? (
                  <div className="hd-empty-chart">No consultations this week yet</div>
                ) : (
                  <BarChart
                    data={stats.weeklyData}
                    color="linear-gradient(to top, #667eea, #a78bfa)"
                  />
                )}
              </div>

              {/* Next Medicine */}
              <div className="hd-card">
                <div className="hd-card-header">
                  <span className="hd-card-title">💊 Next Medicine</span>
                  <span className="hd-card-sub">{stats.activeMedicines} reminders set</span>
                </div>
                {nextMed ? (
                  <div className="next-med-card">
                    <div className="next-med-icon">💊</div>
                    <div className="next-med-info">
                      <div className="next-med-name">{nextMed.name}</div>
                      <div className="next-med-dose">{nextMed.dosage} · {nextMed.mealTime}</div>
                      <div className="next-med-time-row">
                        <span className="next-med-time">🕐 {nextMed.time}</span>
                        <span className="next-med-countdown">in {getTimeUntil(nextMed.time)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="hd-empty-chart">No medicine reminders set</div>
                )}

                {/* All medicines mini list */}
                {stats.medicines.length > 1 && (
                  <div className="med-mini-list">
                    {stats.medicines.slice(1, 4).map((m, i) => (
                      <div key={m.id} className="med-mini-item">
                        <span>💊 {m.name}</span>
                        <span className="med-mini-time">{m.time}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Consultations */}
            <div className="hd-card">
              <div className="hd-card-header">
                <span className="hd-card-title">🕐 Recent Consultations</span>
                <span className="hd-card-sub">Last {stats.recentConvos.length} sessions</span>
              </div>
              {stats.recentConvos.length === 0 ? (
                <div className="hd-empty-chart">No consultations yet — start a chat!</div>
              ) : (
                <div className="recent-list">
                  {stats.recentConvos.map((c, i) => {
                    const date = c.updatedAt?.toDate
                      ? c.updatedAt.toDate()
                      : new Date(c.updatedAt || Date.now());
                    return (
                      <div key={c.id} className="recent-item" style={{ animationDelay: `${i * 0.08}s` }}>
                        <div className="recent-icon">💬</div>
                        <div className="recent-info">
                          <div className="recent-title">{c.title || "Consultation"}</div>
                          <div className="recent-date">
                            {date.toLocaleDateString("en-IN", { day:"numeric", month:"short" })} ·{" "}
                            {date.toLocaleTimeString("en-IN", { hour:"2-digit", minute:"2-digit" })}
                          </div>
                        </div>
                        <div className="recent-msgs">{c.messageCount || "—"} msgs</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Health Tips */}
            <div className="hd-tips">
              <div className="hd-card-title" style={{marginBottom:"12px"}}>💡 Daily Health Tips</div>
              <div className="tips-grid">
                {[
                  { icon:"💧", tip:"Drink 8 glasses of water daily" },
                  { icon:"😴", tip:"Sleep 7–8 hours every night" },
                  { icon:"🥗", tip:"Eat more vegetables & fruits" },
                  { icon:"🚶", tip:"Walk 30 minutes daily" },
                ].map((t, i) => (
                  <div key={i} className="tip-card" style={{ animationDelay: `${i * 0.1}s` }}>
                    <span className="tip-icon">{t.icon}</span>
                    <span className="tip-text">{t.tip}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
