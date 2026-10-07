import { useCustomCursor } from "../hooks/useCustomCursor";
import "./CustomCursor.css";

export default function CustomCursor() {
  const { cursorRef, trailRefs } = useCustomCursor();

  return (
    <>
      <div className="cc-trail-container">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            ref={(el) => (trailRefs.current[i] = el)}
            className="cc-trail"
            style={{
              width: 12 - i * 1.2,
              height: 12 - i * 1.2,
              background: `hsl(${280 - i * 15}, 80%, ${70 - i * 3}%)`,
              boxShadow: `0 0 12px hsl(${280 - i * 15}, 90%, 70%)`,
            }}
          />
        ))}
      </div>
      <div className="cc-cursor" ref={cursorRef}>
        <div className="cc-ring" />
        <div className="cc-dot" />
      </div>
    </>
  );
}
