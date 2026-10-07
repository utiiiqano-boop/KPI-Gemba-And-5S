import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground";
import BootSequence from "../components/BootSequence";
import CustomCursor from "../components/CustomCursor";
import { useTextScramble } from "../hooks/useTextScramble";
import "./Login.css";

const ROTATING_WORDS = ["KPI Dashboard", "Gemba Walks", "5S Audits", "Action Plans"];

export default function Login() {
  const [booted, setBooted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [wordIndex, setWordIndex] = useState(0);
  const [focusedField, setFocusedField] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [success, setSuccess] = useState(false);
  const [ripples, setRipples] = useState([]);
  const [btnOffset, setBtnOffset] = useState({ x: 0, y: 0 });
  const [capsLock, setCapsLock] = useState(false);
  const [pwdStrength, setPwdStrength] = useState(0);
  const [explosion, setExplosion] = useState(false);
  const handleBootComplete = useCallback(() => {
    setBooted(true);
  }, []);

  const cardRef = useRef(null);
  const btnRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Text scramble
  const scrambledTitle = useTextScramble("KPI Gemba", 1800, 400);

  // Rotation words
  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  // Prefill email
  useEffect(() => {
    const saved = localStorage.getItem("rememberedEmail");
    if (saved) setEmail(saved);
  }, []);

  // Password strength
  useEffect(() => {
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    setPwdStrength(s);
  }, [password]);

  // Caps lock
  function checkCapsLock(e) {
    if (e.getModifierState) {
      setCapsLock(e.getModifierState("CapsLock"));
    }
  }

  // Tilt
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
  }, [booted]);

  // Magnetic button
  function handleBtnMove(e) {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setBtnOffset({ x: x * 0.25, y: y * 0.25 });
  }
  function handleBtnLeave() {
    setBtnOffset({ x: 0, y: 0 });
  }

  function validate() {
    const errors = {};
    if (!email.trim()) errors.email = "Email requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = "Format email invalide";
    if (!password) errors.password = "Mot de passe requis";
    else if (password.length < 6)
      errors.password = "Minimum 6 caractères";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function friendlyError(code) {
    const map = {
      "auth/invalid-credential": "Identifiants invalides",
      "auth/user-not-found": "Aucun compte trouvé",
      "auth/wrong-password": "Mot de passe incorrect",
      "auth/invalid-email": "Email invalide",
      "auth/too-many-requests": "Trop de tentatives",
      "auth/user-disabled": "Compte désactivé",
      "auth/network-request-failed": "Erreur réseau",
    };
    return map[code] || "Échec de connexion";
  }

  function handleBtnClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 700);
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
      // Explosion de succès
      setExplosion(true);
      setSuccess(true);
      setTimeout(() => navigate("/dashboard"), 1400);
    } catch (err) {
      setError(friendlyError(err.code) || err.message);
      // Shake card
      cardRef.current?.classList.add("shake-error");
      setTimeout(() => cardRef.current?.classList.remove("shake-error"), 500);
    } finally {
      setLoading(false);
    }
  }

  const tiltStyle = {
    transform: `perspective(1200px) rotateY(${mousePos.x * 4}deg) rotateX(${-mousePos.y * 4}deg)`,
    transition: "transform 0.15s ease-out",
  };

  if (!booted) {
    return (
      <>
        <BootSequence onComplete={handleBootComplete} duration={3400} />
        <AnimatedBackground />
      </>
    );
  }

  return (
    <div className="login-container">
      <CustomCursor />
      <AnimatedBackground />

      {/* HUD corners */}
      <div className="hud hud-tl" />
      <div className="hud hud-tr" />
      <div className="hud hud-bl" />
      <div className="hud hud-br" />

      {/* Succès : explosion de particules */}
      {explosion && (
        <div className="success-explosion">
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i / 60) * Math.PI * 2;
            const distance = 300 + Math.random() * 400;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            return (
              <div
                key={i}
                className="explosion-particle"
                style={{
                  "--tx": `${x}px`,
                  "--ty": `${y}px`,
                  background: `hsl(${140 + Math.random() * 60}, 90%, 65%)`,
                  animationDelay: `${Math.random() * 0.2}s`,
                }}
              />
            );
          })}
        </div>
      )}

      {/* ============ LEFT — BRAND ============ */}
      <div className="login-brand">
        <div className="brand-content">
          <div className="brand-status-bar">
            <span className="status-dot" />
            <span className="status-text">SYSTEM ONLINE</span>
            <span className="status-sep" />
            <span className="status-time">
              {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>

          <div className="brand-logo-wrap">
            <div className="brand-logo-ring brand-logo-ring-1" />
            <div className="brand-logo-ring brand-logo-ring-2" />
            <div className="brand-logo-inner">
              <img
                src="/logo-wkw.png"
                alt="WKW"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            </div>
          </div>

          <h1 className="brand-h1">
            <span className="brand-line brand-line-1">
              {scrambledTitle}
            </span>
            <span className="brand-line brand-line-2">
              & 5S Suite
            </span>
          </h1>

          <p className="brand-tagline">
            Pilotez la performance de votre shopfloor
            avec <span className="tagline-accent">des KPI en temps réel</span>,
            des audits Gemba et des évaluations 5S.
          </p>

          <ul className="brand-features">
            {[
              "Dashboards temps réel",
              "Gemba walks structurés",
              "Audits 5S standardisés",
              "Rapports PDF pro",
            ].map((label, i) => (
              <li key={i} className="brand-feat" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                <span className="feat-icon">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" strokeLinecap="round" />
                    <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>{label}</span>
              </li>
            ))}
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
          © {new Date().getFullYear()} WKW — Suite de pilotage qualité
        </div>
      </div>

      {/* ============ RIGHT — FORM ============ */}
      <div className="login-form-panel">
        <div className="login-card-wrap" ref={cardRef} style={tiltStyle}>
          <div className={`login-card ${success ? "card-success" : ""}`}>
            <div className="card-border card-border-top" />
            <div className="card-border card-border-right" />
            <div className="card-border card-border-bottom" />
            <div className="card-border card-border-left" />
            <div className="card-shimmer" />

            <div className="login-header">
              <div className="login-badge">
                <span className="badge-dot" />
                <span>Connexion sécurisée</span>
              </div>
              <h2>Bienvenue</h2>
              <p className="subtitle">
                Accédez à vos{" "}
                <span className="rotating-word-wrap">
                  <span className="rotating-word" key={wordIndex}>
                    {ROTATING_WORDS[wordIndex]}
                  </span>
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

            {success && (
              <div className="alert-success" role="alert">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Authentification réussie — redirection…</span>
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
                    disabled={loading || success}
                  />
                  <label htmlFor="email" className="floating-label">Adresse email</label>
                  {focusedField === "email" && <div className="input-focus-line" />}
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
                    onKeyDown={checkCapsLock}
                    onKeyUp={checkCapsLock}
                    placeholder=" "
                    autoComplete="current-password"
                    disabled={loading || success}
                  />
                  <label htmlFor="password" className="floating-label">Mot de passe</label>
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                  {focusedField === "password" && <div className="input-focus-line" />}
                </div>
                {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}

                {/* Password strength meter */}
                {password.length > 0 && (
                  <div className="pwd-strength">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`pwd-bar ${pwdStrength > i ? "active" : ""}`}
                        style={{
                          background: pwdStrength > i
                            ? pwdStrength <= 2
                              ? "#ef4444"
                              : pwdStrength <= 3
                                ? "#f59e0b"
                                : "#22c55e"
                            : "rgba(148,163,184,0.15)",
                        }}
                      />
                    ))}
                  </div>
                )}

                {capsLock && (
                  <div className="caps-warning">
                    ⚠️ Verrouillage majuscules activé
                  </div>
                )}
              </div>

              <div className="form-row">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    disabled={loading || success}
                  />
                  <span className="checkmark" />
                  <span className="checkbox-label">Se souvenir de moi</span>
                </label>
              </div>

              <button
                ref={btnRef}
                type="submit"
                className="login-button"
                disabled={loading || success}
                onClick={handleBtnClick}
                onMouseMove={handleBtnMove}
                onMouseLeave={handleBtnLeave}
                style={{
                  transform: `translate(${btnOffset.x}px, ${btnOffset.y}px)`,
                }}
              >
                <span className="btn-shine" />
                <span className="btn-glow" />
                {ripples.map((r) => (
                  <span key={r.id} className="ripple" style={{ left: r.x, top: r.y }} />
                ))}
                {loading ? (
                  <>
                    <span className="spinner" />
                    Vérification…
                  </>
                ) : success ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Redirection…
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
              <p>Pas de compte ? <strong>Contactez votre admin</strong></p>
              <div className="footer-line" />
            </div>
          </div>

          <div className="security-badges">
            <div className="sec-badge">🔒 SSL</div>
            <div className="sec-badge">🛡️ Chiffré</div>
            <div className="sec-badge">✅ RGPD</div>
          </div>
        </div>
      </div>
    </div>
  );
}
