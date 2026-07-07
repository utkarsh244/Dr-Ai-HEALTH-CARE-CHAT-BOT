import React, { useState, useEffect } from "react";
import Login from "./Login";
import "./LandingPage.css";

const FEATURES = [
  { icon: "🤖", title: "AI-Powered Diagnosis", desc: "Get instant health insights powered by advanced AI trained on medical knowledge." },
  { icon: "🌍", title: "16+ Languages", desc: "Communicate in Hindi, English, Hinglish, Spanish and 13 more languages naturally." },
  { icon: "💊", title: "Medicine Reminders", desc: "Never miss a dose. Smart reminders with email & browser notifications." },
  { icon: "🩺", title: "Symptom Checker", desc: "5-step guided assessment to understand your symptoms with AI analysis." },
  { icon: "🏥", title: "Nearby Hospitals", desc: "Find hospitals, pharmacies & clinics near you on an interactive live map." },
  { icon: "📊", title: "Health Dashboard", desc: "Track your health journey with stats, charts and engagement score." },
  { icon: "📄", title: "Health Reports", desc: "Download professional PDF reports of your consultations in one click." },
  { icon: "🆘", title: "Emergency SOS", desc: "One-tap emergency alerts with location sharing & first-aid guides." },
];

const STATS = [
  { value: "16+",   label: "Languages" },
  { value: "100%",  label: "Free to Use" },
  { value: "24/7",  label: "Available" },
  { value: "AI",    label: "Powered" },
];

export default function LandingPage() {
  const [showLogin, setShowLogin]   = useState(false);
  const [isSignUp, setIsSignUp]     = useState(false);
  const [scrolled, setScrolled]     = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (showLogin) {
    return <Login initialSignUp={isSignUp} onBack={() => setShowLogin(false)} />;
  }

  return (
    <div className="lp-root">

      {/* ── NAV ── */}
      <nav className={`lp-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="lp-nav-inner">
          <div className="lp-nav-logo">
            <div className="lp-logo-icon">AI</div>
            <span>Dr.AI</span>
          </div>
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
          </div>
          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" onClick={() => { setIsSignUp(false); setShowLogin(true); }}>
              Sign In
            </button>
            <button className="lp-btn-primary" onClick={() => { setIsSignUp(true); setShowLogin(true); }}>
              Sign Up Free
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-blob lp-blob1" />
          <div className="lp-blob lp-blob2" />
          <div className="lp-blob lp-blob3" />
        </div>
        <div className="lp-hero-content">
          <div className="lp-hero-badge">✨ AI Healthcare Companion</div>
          <h1 className="lp-hero-title">
            Your Personal<br />
            <span className="lp-gradient-text">AI Doctor</span><br />
            Always Available
          </h1>
          <p className="lp-hero-sub">
            Get instant medical guidance, symptom analysis, medicine reminders,
            and emergency support — all powered by advanced AI, completely free.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-hero-primary"
              onClick={() => { setIsSignUp(true); setShowLogin(true); }}>
              Get Started Free →
            </button>
            <button className="lp-btn-hero-ghost"
              onClick={() => { setIsSignUp(false); setShowLogin(true); }}>
              Sign In
            </button>
          </div>
          <div className="lp-hero-note">No credit card required · Free forever</div>
        </div>

        {/* Hero visual */}
        <div className="lp-hero-visual">
          <div className="lp-chat-preview">
            <div className="lp-chat-header">
              <div className="lp-chat-avatar">AI</div>
              <div>
                <div className="lp-chat-name">Dr.AI</div>
                <div className="lp-chat-status">🟢 Online</div>
              </div>
            </div>
            <div className="lp-chat-body">
              <div className="lp-bubble lp-bubble-user">I have a headache and fever since yesterday</div>
              <div className="lp-bubble lp-bubble-ai">
                Based on your symptoms, this could be a viral infection or flu. I recommend:<br/><br/>
                💊 Rest and stay hydrated<br/>
                🌡️ Monitor temperature every 4 hours<br/>
                ⚠️ Seek care if fever exceeds 103°F
              </div>
              <div className="lp-bubble lp-bubble-user">Should I take paracetamol?</div>
              <div className="lp-bubble lp-bubble-ai lp-typing">
                <span/><span/><span/>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="lp-stats">
        {STATS.map((s, i) => (
          <div key={i} className="lp-stat">
            <div className="lp-stat-value">{s.value}</div>
            <div className="lp-stat-label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ── FEATURES ── */}
      <section className="lp-features" id="features">
        <div className="lp-section-label">Features</div>
        <h2 className="lp-section-title">Everything you need for<br /><span className="lp-gradient-text">better healthcare</span></h2>
        <p className="lp-section-sub">A complete AI health companion in your pocket</p>
        <div className="lp-features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="lp-feature-card" style={{ "--delay": `${i * 0.05}s` }}>
              <div className="lp-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="lp-about" id="about">
        <div className="lp-about-inner">
          <div className="lp-about-text">
            <div className="lp-section-label">About Dr.AI</div>
            <h2>Healthcare made<br /><span className="lp-gradient-text">accessible to all</span></h2>
            <p>
              Dr.AI is an AI-powered healthcare companion built to make medical guidance accessible
              to everyone, everywhere. Whether you're looking for symptom analysis, medication
              reminders, or emergency assistance — Dr.AI is here 24/7.
            </p>
            <p>
              Built with the latest AI technology and designed with privacy in mind, Dr.AI keeps
              your health data secure while providing personalized guidance in your language.
            </p>
            <div className="lp-about-points">
              <div className="lp-point">✅ Not a replacement for professional medical advice</div>
              <div className="lp-point">✅ Data stored securely with Firebase</div>
              <div className="lp-point">✅ Works in 16+ languages including Hindi & Hinglish</div>
              <div className="lp-point">✅ Completely free to use</div>
            </div>
          </div>
          <div className="lp-about-visual">
            <div className="lp-about-card">
              <div className="lp-about-card-icon">🛡️</div>
              <div className="lp-about-card-title">Privacy First</div>
              <div className="lp-about-card-desc">Your health data is encrypted and never shared</div>
            </div>
            <div className="lp-about-card">
              <div className="lp-about-card-icon">⚡</div>
              <div className="lp-about-card-title">Instant Responses</div>
              <div className="lp-about-card-desc">Get medical guidance in seconds, not hours</div>
            </div>
            <div className="lp-about-card">
              <div className="lp-about-card-icon">🌐</div>
              <div className="lp-about-card-title">Multilingual</div>
              <div className="lp-about-card-desc">Communicate naturally in your mother tongue</div>
            </div>
            <div className="lp-about-card">
              <div className="lp-about-card-icon">📱</div>
              <div className="lp-about-card-title">Works Everywhere</div>
              <div className="lp-about-card-desc">Desktop, tablet, and mobile friendly</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <div className="lp-cta-blob1" /><div className="lp-cta-blob2" />
        <div className="lp-cta-content">
          <h2>Start your health journey today</h2>
          <p>Join thousands of users who trust Dr.AI for their healthcare guidance</p>
          <button className="lp-btn-hero-primary lp-cta-btn"
            onClick={() => { setIsSignUp(true); setShowLogin(true); }}>
            Create Free Account →
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-logo">
            <div className="lp-logo-icon sm">AI</div>
            <span>Dr.AI</span>
          </div>
          <div className="lp-footer-note">
            ⚠️ Dr.AI is for informational purposes only. Always consult a licensed physician for medical decisions.
          </div>
          <div className="lp-footer-copy">© 2026 Dr.AI · Built for better healthcare</div>
        </div>
      </footer>
    </div>
  );
}
