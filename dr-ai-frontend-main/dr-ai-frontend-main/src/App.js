import React, { useState } from "react";
import axios from "axios";
import "./App.css";
import BACKEND_URL from "./config";
import LandingPage from "./LandingPage";
import Sidebar from "./Sidebar";
import { useAuth } from "./AuthContext";
import { useTheme } from "./ThemeContext";
import { useLanguage } from "./LanguageContext";
import { logOut } from "./firebase";
import { createConversation, saveMessage, loadMessages } from "./services/chatService";
import ExportMenu from "./ExportMenu";
import LanguageSelector from "./LanguageSelector";
import MedicineReminder from "./MedicineReminder";
import SymptomChecker from "./SymptomChecker";
import HealthDashboard from "./HealthDashboard";
import { generateHealthReport } from "./HealthReportGenerator";
import EmergencySOS from "./EmergencySOS";
import RightPanel from "./RightPanel";
import HospitalFinder from "./HospitalFinder";
import HealthNews from "./HealthNews";
import FamilyManager from "./FamilyManager";
import MedicalReportAnalyzer from "./MedicalReportAnalyzer";
import { buildSelfMember } from "./services/familyService";

function App() {
  const { currentUser } = useAuth();
  if (!currentUser) return <LandingPage />;
  return <ChatApp currentUser={currentUser} />;
}

function ChatApp({ currentUser }) {
  const [chat, setChat]                     = useState([]);
  const [recording, setRecording]           = useState(false);
  const [mediaRecorder, setMediaRecorder]   = useState(null);
  const [loading, setLoading]               = useState(false);
  const [audioBlob, setAudioBlob]           = useState(null);
  const [imageFile, setImageFile]           = useState(null);
  const [imagePreview, setImagePreview]     = useState(null);
  const [textInput, setTextInput]           = useState("");
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [sidebarRefresh, setSidebarRefresh]         = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed]     = useState(false);
  const [showReminder, setShowReminder]             = useState(false);
  const [showSymptomChecker, setShowSymptomChecker] = useState(false);
  const [showDashboard, setShowDashboard]           = useState(false);
  const [showSOS, setShowSOS]                       = useState(false);
  const [showPanel, setShowPanel]                   = useState(false);
  const [showHospitals, setShowHospitals]           = useState(false);
  const [showNews, setShowNews]                     = useState(false);
  const [showFamily, setShowFamily]                 = useState(false);
  const [activeMember, setActiveMember]             = useState(null);
  const [showReportAnalyzer, setShowReportAnalyzer] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen]   = useState(false);

  const { isDark, toggleTheme }     = useTheme();
  const { uiLanguage, strings }     = useLanguage();

  // Init activeMember to self on first render
  React.useEffect(() => {
    if (currentUser && !activeMember) {
      setActiveMember(buildSelfMember(currentUser));
    }
  }, [currentUser]);

  const handleLogout  = async () => { try { await logOut(); } catch(e){ console.error(e); } };
  const handleNewChat = () => { setChat([]); setActiveConversationId(null); };

  const handleSelectConversation = async (convo) => {
    setActiveConversationId(convo.id);
    try {
      const messages = await loadMessages(convo.id);
      setChat(messages.map(m => ({ role:m.role, text:m.text, meta:m.meta||"", imageUrl:m.imageUrl||null })));
    } catch(e){ console.error(e); }
  };

  const persistMessages = async (userText, doctorText, meta="") => {
    try {
      let convId = activeConversationId;
      if (!convId) {
        convId = await createConversation(currentUser.uid, userText || "Image Consultation", activeMember?.id || "self");
        setActiveConversationId(convId);
      }
      await saveMessage(convId, "patient", userText, meta);
      await saveMessage(convId, "doctor",  doctorText);
      setSidebarRefresh(p => p + 1);
    } catch(e){ console.error(e); }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setChat(prev => [...prev, { role:"patient", text:"", imageUrl:previewUrl }]);
    }
  };

  const startRecording = async () => {
    try {
      const stream   = await navigator.mediaDevices.getUserMedia({ audio:true });
      const recorder = new MediaRecorder(stream);
      const chunks   = [];
      recorder.ondataavailable = e => chunks.push(e.data);
      recorder.onstop = () => {
        setAudioBlob(new Blob(chunks, { type:"audio/wav" }));
        setChat(prev => [...prev, { role:"patient", text:"🎤 " + strings.audioReady }]);
      };
      recorder.start(); setMediaRecorder(recorder); setRecording(true);
    } catch { setChat(prev => [...prev, { role:"system", text:"⚠️ Unable to access microphone" }]); }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
    }
  };

  const handleDoctorResponse = (data, lang="en", userText="", meta="") => {
    setChat(prev => [...prev,
      { role:"doctor", text:data.doctor_response }
    ]);
    persistMessages(userText, data.doctor_response, meta);

    // TTS uses the detected/selected language for proper voice
    const ttsLang = data.language || lang;
    const ttsForm = new FormData();
    ttsForm.append("input_text", data.doctor_response);
    ttsForm.append("language", ttsLang);
    axios.post(`${BACKEND_URL}/tts`, ttsForm, { responseType:"blob" })
      .then(res => new Audio(URL.createObjectURL(res.data)).play())
      .catch(e => console.error(e));
  };

  const handleSend = async () => {
    try {
      setLoading(true);
      const uid  = currentUser?.uid || "";
      const lang = uiLanguage; // use selected UI language for text messages

      if (textInput && !audioBlob && !imageFile) {
        setChat(prev => [...prev, { role:"patient", text:textInput }]);
        const fd = new FormData();
        fd.append("user_text", textInput);
        fd.append("language", lang);
        fd.append("user_id", uid);
        const res = await axios.post(`${BACKEND_URL}/analyze`, fd);
        handleDoctorResponse(res.data, lang, textInput);
      }
      else if (audioBlob && !imageFile && !textInput) {
        // Voice — auto-detect language from speech
        const fd = new FormData();
        fd.append("audio", audioBlob, "patient_voice.wav");
        const res  = await axios.post(`${BACKEND_URL}/transcribe`, fd);
        const pt   = res.data.transcription;
        const dl   = res.data.language;
        const langName = LANGUAGE_MAP[dl] || dl;
        const meta = `Detected: ${langName}`;
        setChat(prev => [...prev, { role:"patient", text:pt, meta }]);
        const afd = new FormData();
        afd.append("user_text", pt);
        afd.append("language", dl);
        afd.append("user_id", uid);
        const ares = await axios.post(`${BACKEND_URL}/analyze`, afd);
        handleDoctorResponse(ares.data, dl, pt, meta);
      }
      else if (imageFile && !audioBlob && !textInput) {
        const fd = new FormData();
        fd.append("user_text", "Doctor, please analyze this image.");
        fd.append("image", imageFile);
        fd.append("language", lang);
        fd.append("user_id", uid);
        const res = await axios.post(`${BACKEND_URL}/analyze`, fd);
        handleDoctorResponse(res.data, lang, "📷 Image consultation");
      }
      else if (textInput && imageFile && !audioBlob) {
        setChat(prev => [...prev, { role:"patient", text:textInput }]);
        const fd = new FormData();
        fd.append("user_text", textInput);
        fd.append("image", imageFile);
        fd.append("language", lang);
        fd.append("user_id", uid);
        const res = await axios.post(`${BACKEND_URL}/analyze`, fd);
        handleDoctorResponse(res.data, lang, textInput);
      }
      else if (audioBlob && imageFile && !textInput) {
        const fd = new FormData();
        fd.append("audio", audioBlob, "patient_voice.wav");
        const res  = await axios.post(`${BACKEND_URL}/transcribe`, fd);
        const pt   = res.data.transcription;
        const dl   = res.data.language;
        const langName = LANGUAGE_MAP[dl] || dl;
        const meta = `Detected: ${langName}`;
        setChat(prev => [...prev, { role:"patient", text:"🎤 + 📷 " + pt, meta }]);
        const afd = new FormData();
        afd.append("user_text", pt);
        afd.append("image", imageFile);
        afd.append("language", dl);
        afd.append("user_id", uid);
        const ares = await axios.post(`${BACKEND_URL}/analyze`, afd);
        handleDoctorResponse(ares.data, dl, pt, meta);
      }
    } catch(e) {
      console.error(e);
      setChat(prev => [...prev, { role:"system", text:"⚠️ Connection error. Please try again." }]);
    } finally {
      setLoading(false); setAudioBlob(null); setImageFile(null); setImagePreview(null); setTextInput("");
    }
  };

  // ── Send symptom report to main chat ─────────────────────────────────────
  const handleSymptomToChat = (summary) => {
    setChat(prev => [...prev, { role:"patient", text: summary }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const UserAvatar = () => {
    const initial = (currentUser.displayName || currentUser.email)?.[0]?.toUpperCase();
    return (
      <div className="user-avatar"
        style={currentUser.photoURL ? {
          backgroundImage: `url(${currentUser.photoURL})`,
          backgroundSize: "cover", backgroundPosition: "center"
        } : {}}>
        {!currentUser.photoURL && <span>{initial}</span>}
      </div>
    );
  };

  return (
    <div className="app-layout">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileSidebarOpen(false)} />
      )}

      <Sidebar
        currentUser={currentUser}
        activeConversationId={activeConversationId}
        onSelectConversation={(convo) => { handleSelectConversation(convo); setMobileSidebarOpen(false); }}
        onNewChat={() => { handleNewChat(); setMobileSidebarOpen(false); }}
        refreshTrigger={sidebarRefresh}
        collapsed={sidebarCollapsed}
        activeMember={activeMember}
        mobileOpen={mobileSidebarOpen}
        onToggleCollapse={() => setSidebarCollapsed(p => !p)}
      />

      <div className="app-container">
        <header className="app-header">
          <div className="header-left">
            <button className="hamburger-btn" onClick={() => setMobileSidebarOpen(p => !p)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="logo">AI</div>
            <span className="app-title">{strings.appTitle}</span>
            {activeMember && (
              <button className="active-member-pill" onClick={() => setShowFamily(true)} title="Switch family member">
                <span>{activeMember.avatar}</span>
                <span>{activeMember.name}</span>
                <span className="amp-arrow">▾</span>
              </button>
            )}
          </div>
          <div className="header-right">
            <LanguageSelector />
            <button className="sos-header-btn" onClick={() => setShowSOS(true)} title="Emergency SOS">
              SOS
            </button>
            {chat.length > 0 && (
              <button
                className="theme-toggle-btn report-btn"
                title="Download Health Report PDF"
                onClick={() => generateHealthReport({ chat, currentUser, conversationTitle: strings.consultation })}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <polyline points="9 15 12 18 15 15"/>
                </svg>
              </button>
            )}
            <UserAvatar />
            <span className="user-name">{currentUser.displayName || currentUser.email}</span>
            <button className="header-btn logout-btn" onClick={handleLogout}>{strings.signOut}</button>
            <button className="hamburger-btn" onClick={() => setShowPanel(p => !p)} title="Tools & Features">
              <span /><span /><span />
            </button>
          </div>
        </header>

        <div className="conversation-title">{strings.consultation}</div>

        <main className="chat-window">
          {chat.length === 0 && (
            <div className="welcome-message">
              <h2>{strings.welcome}</h2>
              <p>{strings.welcomeSub}</p>
            </div>
          )}
          {chat.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div className="avatar">
                {msg.role === "doctor" ? "👨‍⚕️" : msg.role === "patient" ? "👤" : "⚠️"}
              </div>
              <div className="bubble">
                <span className="message-label">
                  {msg.role === "patient" ? strings.you : msg.role === "doctor" ? strings.doctor : strings.system}
                </span>
                {msg.imageUrl && (
                  <div className="image-thumbnail-wrapper">
                    <img src={msg.imageUrl} alt="Shared" className="image-thumbnail"
                      onClick={() => window.open(msg.imageUrl, "_blank")} title="Click to view full size" />
                  </div>
                )}
                {msg.text && <span>{msg.text}</span>}
                {msg.meta && <div style={{fontSize:"11px", color:"var(--text-muted)", marginTop:"4px"}}>{msg.meta}</div>}
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message doctor">
              <div className="avatar">👨‍⚕️</div>
              <div className="loading">
                <div className="status-indicator">
                  <span className="status-dot"></span>
                  {strings.analyzing}
                </div>
              </div>
            </div>
          )}
        </main>

        <div className="controls-wrapper">
          {(audioBlob || imageFile) && (
            <div className="status-indicator" style={{marginBottom:"8px", margin:"0 auto 8px", width:"fit-content"}}>
              {audioBlob && <span>🎤 {strings.audioReady}</span>}
              {audioBlob && imageFile && <span style={{margin:"0 8px"}}>•</span>}
              {imageFile && (
                <span style={{display:"flex", alignItems:"center", gap:"6px"}}>
                  {imagePreview && <img src={imagePreview} alt="preview"
                    style={{width:"20px", height:"20px", borderRadius:"4px", objectFit:"cover"}} />}
                  {strings.imageReady}
                </span>
              )}
            </div>
          )}
          <div className="controls">
            {!recording ? (
              <button className="icon-btn" onClick={startRecording}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
            ) : (
              <button className="icon-btn active" onClick={stopRecording}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2"/>
                </svg>
              </button>
            )}
            <label className="icon-btn" title="Upload image">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input" />
            </label>
            <input
              type="text"
              placeholder={strings.placeholder}
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-input"
            />
            <button className="send-btn" onClick={handleSend} disabled={!textInput && !audioBlob && !imageFile}>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <RightPanel
        open={showPanel}
        onClose={() => setShowPanel(false)}
        chat={chat}
        activeConversationId={activeConversationId}
        conversationTitle={strings.consultation}
        currentUser={currentUser}
        onShowReminder={() => setShowReminder(true)}
        onShowSymptomChecker={() => setShowSymptomChecker(true)}
        onShowDashboard={() => setShowDashboard(true)}
        onShowHospitals={() => setShowHospitals(true)}
        onShowNews={() => setShowNews(true)}
        onShowFamily={() => setShowFamily(true)}
        onShowReportAnalyzer={() => setShowReportAnalyzer(true)}
        onGenerateReport={() => generateHealthReport({ chat, currentUser, conversationTitle: strings.consultation })}
      />
      {showReportAnalyzer && (
        <MedicalReportAnalyzer
          currentUser={currentUser}
          activeMember={activeMember}
          onClose={() => setShowReportAnalyzer(false)}
        />
      )}
      {showFamily && (
        <FamilyManager
          currentUser={currentUser}
          activeMember={activeMember}
          onSwitchMember={(member) => {
            setActiveMember(member);
            setChat([]);
            setActiveConversationId(null);
            setSidebarRefresh(p => p + 1);
          }}
          onClose={() => setShowFamily(false)}
        />
      )}
      {showNews && (
        <HealthNews onClose={() => setShowNews(false)} />
      )}
      {showHospitals && (
        <HospitalFinder onClose={() => setShowHospitals(false)} />
      )}
      {showSOS && (
        <EmergencySOS currentUser={currentUser} onClose={() => setShowSOS(false)} />
      )}
      {showReminder && (
        <MedicineReminder currentUser={currentUser} onClose={() => setShowReminder(false)} />
      )}
      {showSymptomChecker && (
        <SymptomChecker
          currentUser={currentUser}
          onClose={() => setShowSymptomChecker(false)}
          onSendToChat={handleSymptomToChat}
        />
      )}
      {showDashboard && (
        <HealthDashboard currentUser={currentUser} onClose={() => setShowDashboard(false)} />
      )}
    </div>
  );
}

// Language map for voice detection display
const LANGUAGE_MAP = {
  'en':'English','hi':'हिंदी','es':'Español','fr':'Français','de':'Deutsch',
  'ar':'العربية','zh-cn':'中文','ru':'Русский','ja':'日本語','ko':'한국어',
  'pt':'Português','bn':'বাংলা','mr':'मराठी','ta':'தமிழ்','te':'తెలుగు','gu':'ગુજરાતી'
};

export default App;
