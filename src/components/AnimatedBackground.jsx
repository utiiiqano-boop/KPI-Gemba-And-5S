import { useEffect, useRef } from "react";
import "./AnimatedBackground.css";

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  // ==========================================================
  // Canvas : constellation de particules connectées
  // ==========================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let animId;
    let particles = [];
    let mouse = { x: -9999, y: -9999 };

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    }

    function initParticles() {
      const count = Math.min(90, Math.floor((canvas.width * canvas.height) / 18000));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.6 + 0.6,
          hue: Math.random() > 0.5 ? 260 : 200,
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Déplace + dessine les particules
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Rebond sur les bords
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // Dessin
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, 0.7)`;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(${p.hue}, 90%, 70%, 0.8)`;
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Lignes entre particules proches
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.35;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // Lignes vers la souris
      particles.forEach((p) => {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const alpha = (1 - dist / 180) * 0.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(draw);
    }

    function handleMouse(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }
    function handleMouseLeave() {
      mouse.x = -9999;
      mouse.y = -9999;
    }

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouse);
    window.addEventListener("mouseleave", handleMouseLeave);

    resize();
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div className="ab-root" aria-hidden="true">
      {/* Couche 1 : fond dégradé animé (mesh) */}
      <div className="ab-mesh" />

      {/* Couche 2 : blobs morphing */}
      <div className="ab-blobs">
        <div className="ab-blob ab-blob-1" />
        <div className="ab-blob ab-blob-2" />
        <div className="ab-blob ab-blob-3" />
        <div className="ab-blob ab-blob-4" />
      </div>

      {/* Couche 3 : grille pulsante */}
      <div className="ab-grid" />

      {/* Couche 4 : étoiles filantes */}
      <div className="ab-shooting-stars">
        <div className="ab-star ab-star-1" />
        <div className="ab-star ab-star-2" />
        <div className="ab-star ab-star-3" />
        <div className="ab-star ab-star-4" />
      </div>

      {/* Couche 5 : vagues lumineuses horizontales */}
      <div className="ab-waves">
        <div className="ab-wave ab-wave-1" />
        <div className="ab-wave ab-wave-2" />
        <div className="ab-wave ab-wave-3" />
      </div>

      {/* Couche 6 : orbes lumineux rotatifs */}
      <div className="ab-orbs">
        <div className="ab-orb ab-orb-1" />
        <div className="ab-orb ab-orb-2" />
        <div className="ab-orb ab-orb-3" />
      </div>

      {/* Couche 7 : rayons diagonaux */}
      <div className="ab-rays">
        <div className="ab-ray ab-ray-1" />
        <div className="ab-ray ab-ray-2" />
        <div className="ab-ray ab-ray-3" />
        <div className="ab-ray ab-ray-4" />
      </div>

      {/* Couche 8 : canvas constellation */}
      <canvas ref={canvasRef} className="ab-canvas" />

      {/* Couche 9 : vignette */}
      <div className="ab-vignette" />
    </div>
  );
}
