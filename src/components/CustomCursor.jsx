import { useCustomCursor } from "../hooks/useCustomCursor";
import "./CustomCursor.css";

export default function CustomCursor() {
  const { cursorRef, trailRefs } = useCustomCursor();

  return (
    <>
      <div className="cc-trail-container">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            ref={(el) => (trailRefs.current[i] = el)}
            className="cc-trail"
            style={{
              width: 10 - i * 2,
              height: 10 - i * 2,
              background: `hsl(${280 - i * 25}, 80%, 70%)`,
              boxShadow: `0 0 10px hsl(${280 - i * 25}, 90%, 70%)`,
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
