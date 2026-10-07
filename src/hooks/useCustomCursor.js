import { useEffect, useRef } from "react";

export function useCustomCursor() {
  const cursorRef = useRef(null);
  const trailRefs = useRef([]);
  const posRef = useRef({ x: 0, y: 0 });
  const trailPositions = useRef(
    Array.from({ length: 8 }, () => ({ x: 0, y: 0 }))
  );

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    let animationId;

    function handleMouseMove(e) {
      posRef.current = { x: e.clientX, y: e.clientY };
    }

    function handleMouseDown() {
      if (cursor) cursor.classList.add("cursor-click");
    }
    function handleMouseUp() {
      if (cursor) cursor.classList.remove("cursor-click");
    }

    function animate() {
      // Cursor principal
      if (cursor) {
        cursor.style.transform = `translate(${posRef.current.x - 16}px, ${posRef.current.y - 16}px)`;
      }
      // Trail
      let prevX = posRef.current.x;
      let prevY = posRef.current.y;
      trailRefs.current.forEach((el, i) => {
        if (!el) return;
        const speed = 0.35 - i * 0.03;
        trailPositions.current[i].x += (prevX - trailPositions.current[i].x) * speed;
        trailPositions.current[i].y += (prevY - trailPositions.current[i].y) * speed;
        const size = 12 - i * 1.2;
        el.style.transform = `translate(${trailPositions.current[i].x - size / 2}px, ${trailPositions.current[i].y - size / 2}px)`;
        el.style.opacity = (1 - i / 8) * 0.7;
        prevX = trailPositions.current[i].x;
        prevY = trailPositions.current[i].y;
      });
      animationId = requestAnimationFrame(animate);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return { cursorRef, trailRefs };
}
