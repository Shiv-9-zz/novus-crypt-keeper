import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles
    const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 15000);
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    const animate = () => {
      ctx.fillStyle = "rgba(3, 7, 10, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 255, 157, ${particle.opacity})`;
        ctx.shadowColor = "rgba(0, 255, 157, 0.8)";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            const opacity = (1 - distance / 150) * 0.3;
            ctx.strokeStyle = `rgba(0, 255, 157, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      // Draw occasional glitch lines
      if (Math.random() < 0.02) {
        const y = Math.random() * canvas.height;
        const height = Math.random() * 3 + 1;
        ctx.fillStyle = `rgba(0, 255, 157, ${Math.random() * 0.1})`;
        ctx.fillRect(0, y, canvas.width, height);
      }

      // Draw scan line
      const scanLineY = (Date.now() * 0.05) % canvas.height;
      const gradient = ctx.createLinearGradient(0, scanLineY - 50, 0, scanLineY + 50);
      gradient.addColorStop(0, "rgba(0, 255, 157, 0)");
      gradient.addColorStop(0.5, "rgba(0, 255, 157, 0.03)");
      gradient.addColorStop(1, "rgba(0, 255, 157, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanLineY - 50, canvas.width, 100);

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initial clear
    ctx.fillStyle = "rgb(3, 7, 10)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
