import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const ROTATING_WORDS = ["KPI Dashboard", "Gemba Walks", "5S Audits", "Action Plans"];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [wordIndex, setWordIndex] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Rotating headline
  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  // Prefill remembered email
  useEffect(() => {
    const saved = localStorage.getItem("rememberedEmail");
    if (saved) setEmail(saved);
  }, []);

  function validate() {
    const errors = {};
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Enter a valid email address";
    if (!password) errors.password = "Password is required";
    else if (password.length < 6)
      errors.password = "Password must be at least 6 characters";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function friendlyError(code) {
    const map = {
      "auth/invalid-credential": "Invalid email or password.",
      "auth/user-not-found": "No account found with this email.",
      "auth/wrong-password": "Incorrect password. Try again.",
      "auth/invalid-email": "That email address is invalid.",
      "auth/too-many-requests": "Too many attempts. Try again later.",
      "auth/user-disabled": "This account has been disabled.",
      "auth/network-request-failed": "Network error. Check your connection.",
      "auth/operation-not-allowed": "Email/Password sign-in is not enabled.",
    };
    return map[code] || "Login failed. Please try again.";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    try {
      setLoading(true);
      await login(email.trim(), password);
      if (remember) localStorage.setItem("rememberedEmail", email.trim());
      else localStorage.removeItem("rememberedEmail");
      navigate("/dashboard");
    } catch (err) {
      setError(friendlyError(err.code) || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      {/* === Animated background layer === */}
      <div className="bg-layer" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="grid-overlay" />
        <div className="scan-line" />
      </div>

      {/* === Main card === */}
      <div className="login-card-wrap">
        <div className="login-card">
          {/* Animated logo */}
          <div className="logo-wrap">
            <div className="logo-ring" />
            <div className="logo-inner">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 15l4-4 3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          <h1 className="title">Welcome back</h1>
          <p className="subtitle">
            Sign in to manage your{" "}
            <span className="rotating-word" key={wordIndex}>
              {ROTATING_WORDS[wordIndex]}
            </span>
          </p>

          {error && (
            <div className="alert-error" role="alert">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <div className={`input-wrap ${fieldErrors.email ? "has-error" : ""}`}>
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 6L2 7" />
                </svg>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>

            <div className="form-group">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <button type="button" className="link-btn" disabled>
                  Forgot password?
                </button>
              </div>
              <div className={`input-wrap ${fieldErrors.password ? "has-error" : ""}`}>
                <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
            </div>

            <div className="form-row">
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={loading}
                />
                <span>Remember me</span>
              </label>
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              <span className="btn-shine" />
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don&apos;t have an account? <strong>Contact your administrator.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
