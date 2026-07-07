import React, { useState } from "react";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import "./UserProfile.css";

export default function UserProfile({ currentUser, onClose }) {
  const [activeTab, setActiveTab]     = useState("info");
  const [displayName, setDisplayName] = useState(currentUser.displayName || "");
  const [currentPwd, setCurrentPwd]   = useState("");
  const [newPwd, setNewPwd]           = useState("");
  const [confirmPwd, setConfirmPwd]   = useState("");
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState({ msg:"", type:"" });
  const [avatarErr, setAvatarErr]     = useState(false);

  const isGoogleUser = currentUser.providerData?.[0]?.providerId === "google.com";

  const showToast = (msg, type="success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:"", type:"" }), 3500);
  };

  // ── Save Display Name ──────────────────────────────────────────────────────
  const handleSaveName = async () => {
    if (!displayName.trim()) { showToast("Name cannot be empty", "error"); return; }
    setSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      await setDoc(doc(db, "users", currentUser.uid), { name: displayName.trim() }, { merge: true });
      showToast("✅ Name updated successfully!");
    } catch(e) {
      showToast("❌ Failed to update name", "error");
    } finally { setSaving(false); }
  };

  // ── Change Password ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPwd)            { showToast("Enter your current password", "error"); return; }
    if (newPwd.length < 6)      { showToast("New password must be at least 6 characters", "error"); return; }
    if (newPwd !== confirmPwd)  { showToast("Passwords do not match", "error"); return; }

    setSaving(true);
    try {
      // Re-authenticate first
      const credential = EmailAuthProvider.credential(currentUser.email, currentPwd);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPwd);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      showToast("✅ Password changed successfully!");
    } catch(e) {
      const errorMap = {
        "auth/wrong-password":       "Current password is incorrect",
        "auth/too-many-requests":    "Too many attempts. Try again later",
        "auth/weak-password":        "New password is too weak",
        "auth/invalid-credential":   "Current password is incorrect",
      };
      showToast(`❌ ${errorMap[e.code] || "Failed to change password"}`, "error");
    } finally { setSaving(false); }
  };

  // ── Avatar ─────────────────────────────────────────────────────────────────
  const initial = (currentUser.displayName || currentUser.email)?.[0]?.toUpperCase();

  return (
    <div className="profile-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="profile-modal">

        {/* Header */}
        <div className="profile-header">
          <h2>My Profile</h2>
          <button className="profile-close" onClick={onClose}>✕</button>
        </div>

        {/* Avatar + basic info */}
        <div className="profile-hero">
          <div className="profile-avatar"
            style={currentUser.photoURL && !avatarErr ? {
              backgroundImage: `url(${currentUser.photoURL})`,
              backgroundSize: "cover", backgroundPosition: "center"
            } : {}}>
            {(!currentUser.photoURL || avatarErr) && (
              <div className="profile-avatar-fallback">{initial}</div>
            )}
          </div>
          <div className="profile-hero-info">
            <div className="profile-hero-name">{currentUser.displayName || "User"}</div>
            <div className="profile-hero-email">{currentUser.email}</div>
            <div className="profile-provider">
              {isGoogleUser ? "🔵 Google Account" : "📧 Email Account"}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button className={`profile-tab ${activeTab==="info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}>Account Info</button>
          {!isGoogleUser && (
            <button className={`profile-tab ${activeTab==="password" ? "active" : ""}`}
              onClick={() => setActiveTab("password")}>Change Password</button>
          )}
        </div>

        {/* Tab Content */}
        <div className="profile-content">

          {/* Info Tab */}
          {activeTab === "info" && (
            <div className="profile-section">
              <div className="profile-field">
                <label>Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="profile-input"
                />
              </div>
              <div className="profile-field">
                <label>Email Address</label>
                <input
                  type="email"
                  value={currentUser.email}
                  className="profile-input disabled"
                  disabled
                />
                <small>Email cannot be changed</small>
              </div>
              <div className="profile-field">
                <label>Account Created</label>
                <input
                  type="text"
                  value={currentUser.metadata?.creationTime
                    ? new Date(currentUser.metadata.creationTime).toLocaleDateString()
                    : "N/A"}
                  className="profile-input disabled"
                  disabled
                />
              </div>
              <div className="profile-field">
                <label>Last Sign In</label>
                <input
                  type="text"
                  value={currentUser.metadata?.lastSignInTime
                    ? new Date(currentUser.metadata.lastSignInTime).toLocaleString()
                    : "N/A"}
                  className="profile-input disabled"
                  disabled
                />
              </div>
              <button className="profile-save-btn" onClick={handleSaveName} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === "password" && !isGoogleUser && (
            <div className="profile-section">
              <div className="profile-field">
                <label>Current Password</label>
                <input type="password" value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="Enter current password" className="profile-input" />
              </div>
              <div className="profile-field">
                <label>New Password</label>
                <input type="password" value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  placeholder="Min 6 characters" className="profile-input" />
              </div>
              <div className="profile-field">
                <label>Confirm New Password</label>
                <input type="password" value={confirmPwd}
                  onChange={e => setConfirmPwd(e.target.value)}
                  placeholder="Repeat new password" className="profile-input" />
              </div>
              <button className="profile-save-btn" onClick={handleChangePassword} disabled={saving}>
                {saving ? "Updating..." : "Change Password"}
              </button>
            </div>
          )}

          {/* Google user — no password tab */}
          {activeTab === "password" && isGoogleUser && (
            <div className="profile-section">
              <div className="google-notice">
                <span>🔵</span>
                <div>
                  <strong>Google Account</strong>
                  <p>Your account uses Google Sign-In. Password is managed by Google and cannot be changed here.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toast */}
        {toast.msg && (
          <div className={`profile-toast ${toast.type}`}>{toast.msg}</div>
        )}
      </div>
    </div>
  );
}
