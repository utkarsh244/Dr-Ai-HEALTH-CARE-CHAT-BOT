import BACKEND_URL from "./config";
import React, { useState } from "react";
import axios from "axios";
import "./SymptomChecker.css";

// ── Question Flow ─────────────────────────────────────────────────────────────
const STEPS = [
  {
    id: "category",
    question: "What area is affecting you?",
    type: "grid",
    options: [
      { label: "Head & Neck",    icon: "🧠", value: "head and neck" },
      { label: "Chest & Heart",  icon: "❤️", value: "chest and heart" },
      { label: "Stomach",        icon: "🫁", value: "stomach and digestion" },
      { label: "Skin",           icon: "🩹", value: "skin" },
      { label: "Joints & Bones", icon: "🦴", value: "joints and bones" },
      { label: "Eyes",           icon: "👁️", value: "eyes" },
      { label: "Fever & Flu",    icon: "🌡️", value: "fever and flu" },
      { label: "Mental Health",  icon: "🧘", value: "mental health" },
      { label: "Other",          icon: "❓", value: "general" },
    ]
  },
  {
    id: "duration",
    question: "How long have you had these symptoms?",
    type: "options",
    options: [
      { label: "Just started (today)",    value: "just started today" },
      { label: "1–3 days",               value: "1 to 3 days" },
      { label: "4–7 days",               value: "4 to 7 days" },
      { label: "1–2 weeks",              value: "1 to 2 weeks" },
      { label: "More than 2 weeks",      value: "more than 2 weeks" },
      { label: "Recurring / On and off", value: "recurring on and off" },
    ]
  },
  {
    id: "severity",
    question: "How severe are your symptoms?",
    type: "severity",
    options: [
      { label: "Mild",     value: "mild",     desc: "Noticeable but manageable",     color: "#22c55e" },
      { label: "Moderate", value: "moderate", desc: "Affecting daily activities",     color: "#f59e0b" },
      { label: "Severe",   value: "severe",   desc: "Hard to function normally",      color: "#ef4444" },
    ]
  },
  {
    id: "symptoms",
    question: "Which symptoms are you experiencing?",
    type: "multi",
    optionsByCategory: {
      "head and neck":         ["Headache","Dizziness","Neck pain","Sore throat","Runny nose","Earache","Jaw pain","Stiff neck"],
      "chest and heart":       ["Chest pain","Shortness of breath","Palpitations","Cough","Wheezing","Chest tightness"],
      "stomach and digestion": ["Stomach pain","Nausea","Vomiting","Diarrhea","Constipation","Bloating","Heartburn","Loss of appetite"],
      "skin":                  ["Rash","Itching","Redness","Swelling","Dry skin","Blisters","Peeling","Discoloration"],
      "joints and bones":      ["Joint pain","Swelling","Stiffness","Back pain","Muscle ache","Weakness","Numbness"],
      "eyes":                  ["Eye pain","Blurred vision","Redness","Discharge","Sensitivity to light","Itching","Watery eyes"],
      "fever and flu":         ["Fever","Chills","Body ache","Fatigue","Sweating","Loss of taste/smell","Cough","Congestion"],
      "mental health":         ["Anxiety","Depression","Insomnia","Mood swings","Panic attacks","Stress","Fatigue","Brain fog"],
      "general":               ["Fatigue","Weight loss","Weight gain","Fever","Night sweats","Loss of appetite","Swollen glands"],
    }
  },
  {
    id: "additional",
    question: "Any additional details? (optional)",
    type: "text",
    placeholder: "e.g. The pain gets worse at night, I have diabetes, I'm pregnant..."
  }
];

export default function SymptomChecker({ currentUser, onClose, onSendToChat }) {
  const [step, setStep]         = useState(0);
  const [answers, setAnswers]   = useState({});
  const [selected, setSelected] = useState([]);
  const [textVal, setTextVal]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [report, setReport]     = useState(null);

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleOption = (value) => {
    if (current.type === "multi") {
      setSelected(prev =>
        prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
      );
    } else {
      const newAnswers = { ...answers, [current.id]: value };
      setAnswers(newAnswers);
      if (step < STEPS.length - 1) setStep(s => s + 1);
    }
  };

  const handleNext = () => {
    if (current.type === "multi") {
      setAnswers(prev => ({ ...prev, [current.id]: selected.join(", ") }));
      setSelected([]);
    }
    if (current.type === "text") {
      setAnswers(prev => ({ ...prev, [current.id]: textVal }));
    }
    if (isLast) {
      generateReport({ ...answers, symptoms: selected.join(", ") || answers.symptoms, additional: textVal });
    } else {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => {
    setStep(s => s - 1);
    setSelected([]);
  };

  // ── Generate AI Report ────────────────────────────────────────────────────
  const generateReport = async (allAnswers) => {
    setLoading(true);
    const prompt = `
Patient Symptom Assessment:
- Body area affected: ${allAnswers.category}
- Duration: ${allAnswers.duration}
- Severity: ${allAnswers.severity}
- Symptoms: ${allAnswers.symptoms}
- Additional info: ${allAnswers.additional || "None"}

Based on this structured symptom assessment, provide:
1. Most likely condition(s) (2-3 possibilities)
2. Immediate care advice
3. Warning signs that require emergency care
4. When to see a doctor

Keep response concise, compassionate and in plain language. Format with clear sections.
    `.trim();

    try {
      const fd = new FormData();
      fd.append("user_text", prompt);
      fd.append("language", "en");
      fd.append("user_id", currentUser?.uid || "");
      const res = await axios.post(`${BACKEND_URL}/analyze`, fd);
      setReport({ text: res.data.doctor_response, answers: allAnswers });
    } catch(e) {
      setReport({ text: "Unable to generate report. Please check your connection and try again.", answers: allAnswers, error: true });
    } finally {
      setLoading(false); }
  };

  // ── Send to main chat ─────────────────────────────────────────────────────
  const handleSendToChat = () => {
    if (!report) return;
    const summary = `🩺 Symptom Check Summary:\n• Area: ${report.answers.category}\n• Duration: ${report.answers.duration}\n• Severity: ${report.answers.severity}\n• Symptoms: ${report.answers.symptoms}\n\nDr.AI Assessment:\n${report.text}`;
    onSendToChat(summary);
    onClose();
  };

  // ── Get symptom options for current category ──────────────────────────────
  const symptomOptions = current.id === "symptoms"
    ? (current.optionsByCategory[answers.category] || current.optionsByCategory["general"])
    : [];

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="sc-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="sc-modal">

        {/* Header */}
        <div className="sc-header">
          <div className="sc-header-left">
            <div className="sc-icon">🩺</div>
            <div>
              <h2>Symptom Checker</h2>
              <p>Answer a few questions for a personalized assessment</p>
            </div>
          </div>
          <button className="sc-close" onClick={onClose}>✕</button>
        </div>

        {/* Progress bar */}
        {!report && !loading && (
          <div className="sc-progress-wrapper">
            <div className="sc-progress-bar">
              <div className="sc-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="sc-progress-label">Step {step + 1} of {STEPS.length}</span>
          </div>
        )}

        <div className="sc-body">

          {/* Loading */}
          {loading && (
            <div className="sc-loading">
              <div className="sc-spinner"></div>
              <p>Dr.AI is analyzing your symptoms...</p>
              <small>This may take a few seconds</small>
            </div>
          )}

          {/* Report */}
          {report && !loading && (
            <div className="sc-report">
              <div className="sc-report-header">
                <span className="sc-report-icon">{report.error ? "⚠️" : "📋"}</span>
                <h3>Your Assessment Report</h3>
              </div>

              <div className="sc-summary-pills">
                <span className="sc-pill">{report.answers.category}</span>
                <span className="sc-pill">{report.answers.duration}</span>
                <span className={`sc-pill severity-${report.answers.severity}`}>{report.answers.severity}</span>
              </div>

              <div className="sc-report-text">{report.text}</div>

              <div className="sc-disclaimer">
                ⚠️ This is an AI assessment for informational purposes only. Always consult a qualified healthcare professional for diagnosis and treatment.
              </div>

              <div className="sc-report-actions">
                <button className="sc-btn-secondary" onClick={() => { setStep(0); setReport(null); setAnswers({}); }}>
                  🔄 Start Over
                </button>
                <button className="sc-btn-primary" onClick={handleSendToChat}>
                  💬 Send to Chat
                </button>
              </div>
            </div>
          )}

          {/* Questions */}
          {!loading && !report && (
            <div className="sc-question">
              <h3 className="sc-question-text">{current.question}</h3>

              {/* Grid options (category) */}
              {current.type === "grid" && (
                <div className="sc-grid">
                  {current.options.map(opt => (
                    <button key={opt.value} className="sc-grid-item" onClick={() => handleOption(opt.value)}>
                      <span className="sc-grid-icon">{opt.icon}</span>
                      <span className="sc-grid-label">{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Single select options */}
              {current.type === "options" && (
                <div className="sc-options">
                  {current.options.map(opt => (
                    <button key={opt.value}
                      className={`sc-option ${answers[current.id] === opt.value ? "selected" : ""}`}
                      onClick={() => handleOption(opt.value)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Severity */}
              {current.type === "severity" && (
                <div className="sc-severity">
                  {current.options.map(opt => (
                    <button key={opt.value}
                      className={`sc-severity-card ${answers[current.id] === opt.value ? "selected" : ""}`}
                      style={{ "--sev-color": opt.color }}
                      onClick={() => handleOption(opt.value)}>
                      <div className="sc-sev-dot" style={{ background: opt.color }} />
                      <div>
                        <div className="sc-sev-label">{opt.label}</div>
                        <div className="sc-sev-desc">{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Multi select (symptoms) */}
              {current.type === "multi" && (
                <>
                  <div className="sc-multi">
                    {symptomOptions.map(sym => (
                      <button key={sym}
                        className={`sc-chip ${selected.includes(sym) ? "selected" : ""}`}
                        onClick={() => setSelected(prev =>
                          prev.includes(sym) ? prev.filter(v => v !== sym) : [...prev, sym]
                        )}>
                        {selected.includes(sym) ? "✓ " : ""}{sym}
                      </button>
                    ))}
                  </div>
                  <p className="sc-multi-hint">Select all that apply</p>
                </>
              )}

              {/* Text input */}
              {current.type === "text" && (
                <textarea
                  className="sc-textarea"
                  placeholder={current.placeholder}
                  value={textVal}
                  onChange={e => setTextVal(e.target.value)}
                  rows={4}
                />
              )}

              {/* Navigation */}
              <div className="sc-nav">
                {step > 0 && (
                  <button className="sc-btn-secondary" onClick={handleBack}>← Back</button>
                )}
                {(current.type === "multi" || current.type === "text") && (
                  <button className="sc-btn-primary"
                    onClick={handleNext}
                    disabled={current.type === "multi" && selected.length === 0 && !isLast}>
                    {isLast ? "🩺 Get Assessment" : "Next →"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
