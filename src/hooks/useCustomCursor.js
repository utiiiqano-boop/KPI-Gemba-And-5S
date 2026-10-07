import { useEffect, useRef } from "react";

export function useCustomCursor() {
  const cursorRef = useRef(null);
  const trailRefs = useRef([]);
  const posRef = useRef({ x: 0, y: 0 });
  const trailPositions = useRef(
    Array.from({ length: 3 }, () => ({ x: 0, y: 0 }))
  );

  useEffect(() => {
    // Skip mobile / reduced-motion
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const cursor = cursorRef.current;
    if (!cursor) return;

    let animationId;
    let needsUpdate = false;

    function handleMouseMove(e) {
      posRef.current.x = e.clientX;
      posRef.current.y = e.clientY;
      needsUpdate = true;
    }

    function handleMouseDown() {
      cursor?.classList.add("cursor-click");
    }
    function handleMouseUp() {
      cursor?.classList.remove("cursor-click");
    }

    function animate() {
      if (needsUpdate) {
        needsUpdate = false;

        // Position directe (pas de lerp) = instantané
        const { x, y } = posRef.current;
        if (cursor) {
          cursor.style.transform = `translate3d(${x - 16}px, ${y - 16}px, 0)`;
        }

        // Trails
        let prevX = x;
        let prevY = y;
        trailRefs.current.forEach((el, i) => {
          if (!el) return;
          trailPositions.current[i].x += (prevX - trailPositions.current[i].x) * 0.4;
          trailPositions.current[i].y += (prevY - trailPositions.current[i].y) * 0.4;
          const size = 10 - i * 2;
          el.style.transform = `translate3d(${trailPositions.current[i].x - size / 2}px, ${trailPositions.current[i].y - size / 2}px, 0)`;
          prevX = trailPositions.current[i].x;
          prevY = trailPositions.current[i].y;
        });
      }
      animationId = requestAnimationFrame(animate);
    }

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mousedown", handleMouseDown, { passive: true });
    window.addEventListener("mouseup", handleMouseUp, { passive: true });
    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return { cursorRef, trailRefs };
}
