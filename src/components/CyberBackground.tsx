import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
}

interface GlitchBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  lifetime: number;
  maxLifetime: number;
  color: string;
}

export function CyberBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const glitchBlocksRef = useRef<GlitchBlock[]>([]);
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

    let lastGlitchTime = 0;
    let isGlitching = false;
    let glitchDuration = 0;

    const animate = (timestamp: number) => {
      // Glitch flash effect
      if (Math.random() < 0.001 && !isGlitching) {
        isGlitching = true;
        glitchDuration = Math.random() * 200 + 50;
        lastGlitchTime = timestamp;
      }

      if (isGlitching && timestamp - lastGlitchTime > glitchDuration) {
        isGlitching = false;
      }

      // Clear with trail effect
      ctx.fillStyle = isGlitching ? "rgba(0, 20, 10, 0.3)" : "rgba(3, 7, 10, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Update position with glitch jitter
        const jitter = isGlitching ? (Math.random() - 0.5) * 5 : 0;
        particle.x += particle.vx + jitter;
        particle.y += particle.vy + jitter;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle with glow
        const particleColor = isGlitching && Math.random() < 0.3 
          ? `rgba(255, 0, 100, ${particle.opacity})` 
          : `rgba(0, 255, 157, ${particle.opacity})`;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.shadowColor = isGlitching ? "rgba(255, 0, 100, 0.8)" : "rgba(0, 255, 157, 0.8)";
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
            ctx.strokeStyle = isGlitching 
              ? `rgba(255, 0, 100, ${opacity})` 
              : `rgba(0, 255, 157, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      // Spawn glitch blocks
      if (Math.random() < 0.03) {
        glitchBlocksRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          width: Math.random() * 100 + 20,
          height: Math.random() * 10 + 2,
          lifetime: 0,
          maxLifetime: Math.random() * 10 + 5,
          color: Math.random() < 0.5 ? "0, 255, 157" : "0, 200, 255",
        });
      }

      // Draw and update glitch blocks
      glitchBlocksRef.current = glitchBlocksRef.current.filter((block) => {
        block.lifetime++;
        if (block.lifetime > block.maxLifetime) return false;

        const opacity = (1 - block.lifetime / block.maxLifetime) * 0.15;
        ctx.fillStyle = `rgba(${block.color}, ${opacity})`;
        ctx.fillRect(block.x, block.y, block.width, block.height);

        // Chromatic aberration effect
        ctx.fillStyle = `rgba(255, 0, 100, ${opacity * 0.5})`;
        ctx.fillRect(block.x + 2, block.y, block.width, block.height);
        ctx.fillStyle = `rgba(0, 100, 255, ${opacity * 0.5})`;
        ctx.fillRect(block.x - 2, block.y, block.width, block.height);

        return true;
      });

      // Draw occasional horizontal glitch lines
      if (Math.random() < 0.04) {
        const y = Math.random() * canvas.height;
        const height = Math.random() * 3 + 1;
        const offset = (Math.random() - 0.5) * 20;
        
        // Main line
        ctx.fillStyle = `rgba(0, 255, 157, ${Math.random() * 0.15 + 0.05})`;
        ctx.fillRect(0, y, canvas.width, height);
        
        // Offset chromatic lines
        ctx.fillStyle = `rgba(255, 0, 100, ${Math.random() * 0.1})`;
        ctx.fillRect(offset, y, canvas.width, height);
        ctx.fillStyle = `rgba(0, 100, 255, ${Math.random() * 0.1})`;
        ctx.fillRect(-offset, y, canvas.width, height);
      }

      // Vertical tear effect
      if (Math.random() < 0.01) {
        const x = Math.random() * canvas.width;
        const width = Math.random() * 5 + 2;
        ctx.fillStyle = `rgba(0, 255, 157, 0.05)`;
        ctx.fillRect(x, 0, width, canvas.height);
      }

      // Draw scan line
      const scanLineY = (Date.now() * 0.05) % canvas.height;
      const gradient = ctx.createLinearGradient(0, scanLineY - 50, 0, scanLineY + 50);
      gradient.addColorStop(0, "rgba(0, 255, 157, 0)");
      gradient.addColorStop(0.5, `rgba(0, 255, 157, ${isGlitching ? 0.08 : 0.03})`);
      gradient.addColorStop(1, "rgba(0, 255, 157, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, scanLineY - 50, canvas.width, 100);

      // Static noise during glitch
      if (isGlitching) {
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * canvas.width;
          const y = Math.random() * canvas.height;
          const size = Math.random() * 3 + 1;
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`;
          ctx.fillRect(x, y, size, size);
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Initial clear
    ctx.fillStyle = "rgb(3, 7, 10)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    animate(0);

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
