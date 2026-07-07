import React, { useState } from "react";
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from "./firebase";
import "./Login.css";

export default function Login({ initialSignUp = false, onBack = null }) {
  const [isSignUp, setIsSignUp]   = useState(initialSignUp);
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [error, setError]         = useState("");
  const [loading, setLoading]     = useState(false);

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      // AuthContext will detect the login and redirect automatically
    } catch (err) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err) {
      // Firebase error codes → friendly messages
      const errorMap = {
        "auth/user-not-found":       "No account found with this email.",
        "auth/wrong-password":       "Incorrect password.",
        "auth/email-already-in-use": "An account already exists with this email.",
        "auth/invalid-email":        "Please enter a valid email address.",
        "auth/too-many-requests":    "Too many attempts. Please try again later.",
        "auth/invalid-credential":   "Invalid email or password.",
      };
      setError(errorMap[err.code] || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background particles */}
      <div className="login-bg">
        <div className="particle p1"></div>
        <div className="particle p2"></div>
        <div className="particle p3"></div>
        <div className="particle p4"></div>
      </div>

      <div className="login-card">
        {/* Back to landing */}
        {onBack && (
          <button className="login-back-btn" onClick={onBack}>
            ← Back to Home
          </button>
        )}
        {/* Logo & Title */}
        <div className="login-header">
          <div className="login-logo">AI</div>
          <h1 className="login-title">Dr.AI</h1>
          <p className="login-subtitle">Your AI Healthcare Companion</p>
        </div>

        {/* Tab Toggle */}
        <div className="login-tabs">
          <button
            className={`tab-btn ${!isSignUp ? "active" : ""}`}
            onClick={() => { setIsSignUp(false); setError(""); }}
          >
            Sign In
          </button>
          <button
            className={`tab-btn ${isSignUp ? "active" : ""}`}
            onClick={() => { setIsSignUp(true); setError(""); }}
          >
            Sign Up
          </button>
        </div>

        {/* Google Login */}
        <button
          className="google-btn"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <svg viewBox="0 0 24 24" className="google-icon">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailAuth} className="login-form">
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Please wait..." : isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        <p className="login-footer">
          By continuing, you agree to our Terms of Service and Privacy Policy.
          <br/>
          <small>For educational purposes only. Not a substitute for real medical advice.</small>
        </p>
      </div>
    </div>
  );
}
