import { useEffect, useState, useRef } from "react";
import "./BootSequence.css";

/**
 * Boot sequence cinématique :
 *   Phase 1 : W K W arrivent de partout
 *   Phase 2 : converge au centre
 *   Phase 3 : AUTOMOTIVE s'écrit
 *   Phase 4 : tout s'efface → LOGO IMAGE apparaît
 *   Phase 5 : ZOOM IN puissant du logo
 *   Phase 6 : fade out → login
 */
export default function BootSequence({ onComplete }) {
  const [phase, setPhase] = useState("idle");
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timeline = [
      { at: 150,    to: "letters-in" },   // lettres volent
      { at: 1500,   to: "converge" },     // convergent
      { at: 2200,   to: "tagline" },      // AUTOMOTIVE s'écrit
      { at: 3400,   to: "text-hide" },    // textes s'effacent
      { at: 3800,   to: "logo-show" },    // logo apparaît petit
      { at: 4400,   to: "logo-zoom" },    // zoom-in
      { at: 5600,   to: "fade-out" },     // fade out
      { at: 6200,   to: "done" },
    ];

    const timers = timeline.map(({ at, to }) =>
      setTimeout(() => {
        if (to === "done") onCompleteRef.current?.();
        else setPhase(to);
      }, at)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  const taglineChars = "AUTOMOTIVE".split("");
  const showTagline = ["tagline", "text-hide", "logo-show", "logo-zoom", "fade-out"].includes(phase);
  const showLogo = ["logo-show", "logo-zoom", "fade-out"].includes(phase);
  const zoomLogo = ["logo-zoom", "fade-out"].includes(phase);

  return (
    <div className={`boot-seq phase-${phase}`}>
      {/* Fond */}
      <div className="boot-bg">
        <div className="boot-bg-blob boot-bg-blob-1" />
        <div className="boot-bg-blob boot-bg-blob-2" />
        <div className="boot-bg-grid" />
        <div className="boot-bg-scan" />
      </div>

      {/* Anneaux rotatifs */}
      <div className="boot-rings">
        <div className="boot-ring boot-ring-1" />
        <div className="boot-ring boot-ring-2" />
        <div className="boot-ring boot-ring-3" />
      </div>

      {/* ============ CENTRE ============ */}
      <div className="boot-center">
        {/* Textes WKW + AUTOMOTIVE (cache après phase text-hide) */}
        <div className="boot-texts">
          <div className="boot-wkw">
            <span className="boot-letter boot-letter-1">W</span>
            <span className="boot-letter boot-letter-2">K</span>
            <span className="boot-letter boot-letter-3">W</span>
          </div>

          <div className="boot-line">
            <div className="boot-line-bar" />
          </div>

          <div className="boot-tagline">
            {taglineChars.map((char, i) => (
              <span
                key={i}
                className="boot-tagline-char"
                style={{ animationDelay: `${i * 0.07}s` }}
              >
                {char}
              </span>
            ))}
          </div>
        </div>

        {/* ============ LOGO IMAGE (apparaît après) ============ */}
        <div className="boot-logo-image-wrap">
          <div className="boot-logo-glow" />
          <div className="boot-logo-image">
            <img
              src="/logo-wkw.png"
              alt="WKW Automotive"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.parentElement.classList.add("logo-fallback");
              }}
            />
          </div>
        </div>
      </div>

      {/* Flash final */}
      <div className="boot-flash" />
    </div>
  );
}
