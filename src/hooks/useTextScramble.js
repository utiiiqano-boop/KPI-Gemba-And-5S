import { useEffect, useState } from "react";

const CHARS = "!<>-_\\/[]{}—=+*^?#________";

export function useTextScramble(text, duration = 1600, delay = 300) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    let frame = 0;
    let raf;
    const queue = text.split("").map((char) => ({
      from: CHARS[Math.floor(Math.random() * CHARS.length)],
      to: char,
      start: Math.floor(Math.random() * duration * 0.5) + delay,
      end: Math.floor(Math.random() * duration * 0.5) + duration * 0.5 + delay,
      char,
    }));

    let startTime = null;

    function update(timestamp) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      let output = "";
      let complete = 0;
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];
        if (elapsed >= item.end) {
          complete++;
          output += item.to;
        } else if (elapsed >= item.start) {
          if (!frame || Math.random() < 0.28) {
            output += CHARS[Math.floor(Math.random() * CHARS.length)];
          } else {
            output += item.from;
          }
        }
      }
      setDisplay(output);
      frame++;

      if (complete < queue.length) {
        raf = requestAnimationFrame(update);
      } else {
        setDisplay(text);
      }
    }

    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [text, duration, delay]);

  return display;
}
