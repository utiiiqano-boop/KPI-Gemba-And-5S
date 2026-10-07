import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground";
import Logo from "../components/Logo";
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
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [focusedField, setFocusedField] = useState(null);
  const cardRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("rememberedEmail");
    if (saved) setEmail(saved);
  }, []);

  useEffect(() => {
    function handleMouseMove(e) {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
      setMousePos({ x, y });
    }
    function handleMouseLeave() {
      setMousePos({ x: 0, y: 0 });
    }
    const card = cardRef.current;
    if (card) {
      card.addEventListener("mousemove", handleMouseMove);
      card.addEventListener("mouseleave", handleMouseLeave);
      return () => {
        card.removeEventListener("mousemove", handleMouseMove);
        card.removeEventListener("mouseleave", handleMouseLeave);
      };
    }
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

  const tiltStyle = {
    transform: `perspective(1000px) rotateY(${mousePos.x * 4}deg) rotateX(${-mousePos.y * 4}deg)`,
    transition: "transform 0.15s ease-out",
  };

  return (
    <div className="login-container">
      {/* Background ultra-animé */}
      <AnimatedBackground />

      {/* Brand panel (gauche) */}
      <div className="login-brand">
        <div className="brand-content">
          <div className="brand-logo-wrap">
            <div className="brand-logo-ring" />
            <div className="brand-logo-inner">
              <Logo size={56} />
            </div>
          </div>

          <h1 className="brand-h1">
            <span className="brand-line">KPI Gemba</span>
            <span className="brand-line brand-line-accent">& 5S Suite</span>
          </h1>

          <p className="brand-tagline">
            Pilotez la performance de votre shopfloor avec des KPI en temps réel,
            des audits Gemba et des évaluations 5S.
          </p>

          <ul className="brand-features">
            <li className="brand-feat">
              <span className="feat-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" />
                  <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>Dashboards temps réel</span>
            </li>
            <li className="brand-feat">
              <span className="feat-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" />
                  <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>Gemba walks structurés</span>
            </li>
            <li className="brand-feat">
              <span className="feat-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" />
                  <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>Audits 5S standardisés</span>
            </li>
            <li className="brand-feat">
              <span className="feat-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" />
                  <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span>Rapports PDF pro</span>
            </li>
          </ul>

          <div className="brand-stats">
            <div className="brand-stat">
              <div className="brand-stat-value">145</div>
              <div className="brand-stat-label">Audits 5S</div>
            </div>
            <div className="brand-stat-sep" />
            <div className="brand-stat">
              <div className="brand-stat-value">683</div>
              <div className="brand-stat-label">Lignes Gemba</div>
            </div>
            <div className="brand-stat-sep" />
            <div className="brand-stat">
              <div className="brand-stat-value">24/7</div>
              <div className="brand-stat-label">Disponible</div>
            </div>
          </div>
        </div>

        <div className="brand-footer">
          © {new Date().getFullYear()} KPI Gemba & 5S — Suite de pilotage qualité
        </div>
      </div>

      {/* Form panel (droite) */}
      <div className="login-form-panel">
        <div className="login-card-wrap" ref={cardRef} style={tiltStyle}>
          <div className="login-card">
            <div className="card-shimmer" />

            <div className="login-header">
              <div className="login-badge">
                <span className="badge-dot" />
                <span>Plateforme sécurisée</span>
              </div>
              <h2>Connexion</h2>
              <p className="subtitle">
                Accédez à vos{" "}
                <span className="rotating-word" key={wordIndex}>
                  {ROTATING_WORDS[wordIndex]}
                </span>
              </p>
            </div>

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
                <div className={`input-wrap ${fieldErrors.email ? "has-error" : ""} ${focusedField === "email" ? "is-focused" : ""}`}>
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 6L2 7" />
                  </svg>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder=" "
                    autoComplete="email"
                    disabled={loading}
                  />
                  <label htmlFor="email" className="floating-label">Adresse email</label>
                </div>
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </div>

              <div className="form-group">
                <div className={`input-wrap ${fieldErrors.password ? "has-error" : ""} ${focusedField === "password" ? "is-focused" : ""}`}>
                  <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder=" "
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <label htmlFor="password" className="floating-label">Mot de passe</label>
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
                  <span className="checkmark" />
                  <span className="checkbox-label">Se souvenir de moi</span>
                </label>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                <span className="btn-shine" />
                {loading ? (
                  <>
                    <span className="spinner" />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    <span>Se connecter</span>
                    <svg className="btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <div className="login-footer">
              <div className="footer-line" />
              <p>Pas de compte ? <strong>Contactez votre administrateur</strong></p>
              <div className="footer-line" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
