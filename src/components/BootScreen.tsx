import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BootLine {
  text: string;
  delay: number;
  type: "system" | "success" | "warning" | "error" | "header";
}

const bootSequence: BootLine[] = [
  { text: "NOVUS SECURITY SYSTEMS v3.7.1", delay: 0, type: "header" },
  { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", delay: 200, type: "system" },
  { text: "", delay: 400, type: "system" },
  { text: "[BOOT] Initializing kernel modules...", delay: 600, type: "system" },
  { text: "[BOOT] Loading cryptographic subsystems...", delay: 900, type: "system" },
  { text: "[  OK  ] Cipher modules loaded", delay: 1300, type: "success" },
  { text: "[BOOT] Establishing secure channel...", delay: 1600, type: "system" },
  { text: "[  OK  ] TLS 1.3 handshake complete", delay: 2000, type: "success" },
  { text: "", delay: 2200, type: "system" },
  { text: "[AUTH] Verifying access credentials...", delay: 2400, type: "warning" },
  { text: "[AUTH] Scanning biometric signatures...", delay: 2800, type: "system" },
  { text: "[  OK  ] Identity matrix validated", delay: 3300, type: "success" },
  { text: "", delay: 3500, type: "system" },
  { text: "[VAULT] Decrypting challenge archives...", delay: 3700, type: "system" },
  { text: "[VAULT] Loading CTF protocols...", delay: 4100, type: "system" },
  { text: "[  OK  ] 47 challenges unlocked", delay: 4500, type: "success" },
  { text: "", delay: 4700, type: "system" },
  { text: "[NET] Synchronizing with NOVUS mainframe...", delay: 4900, type: "system" },
  { text: "[NET] Ping: 13ms | Jitter: 2ms", delay: 5300, type: "system" },
  { text: "[  OK  ] Connection established", delay: 5600, type: "success" },
  { text: "", delay: 5800, type: "system" },
  { text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", delay: 6000, type: "system" },
  { text: "", delay: 6200, type: "system" },
  { text: "ACCESS GRANTED", delay: 6400, type: "header" },
  { text: "Welcome to the NOVUS CTF Platform", delay: 6700, type: "system" },
  { text: "", delay: 7000, type: "system" },
  { text: "Redirecting to authentication portal...", delay: 7300, type: "warning" },
];

interface Props {
  onComplete: () => void;
}

export function BootScreen({ onComplete }: Props) {
  const [displayedLines, setDisplayedLines] = useState<BootLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  // Cursor blink effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Random glitch effect
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 100);
      }
    }, 2000);
    return () => clearInterval(glitchInterval);
  }, []);

  // Typing effect
  const typeText = useCallback((text: string, onComplete: () => void) => {
    if (text === "") {
      onComplete();
      return;
    }

    setIsTyping(true);
    let index = 0;
    setCurrentText("");

    const typeChar = () => {
      if (index < text.length) {
        setCurrentText(text.slice(0, index + 1));
        index++;
        // Human-like variable delay
        const delay = 15 + Math.random() * 35;
        setTimeout(typeChar, delay);
      } else {
        setIsTyping(false);
        onComplete();
      }
    };

    typeChar();
  }, []);

  // Process boot sequence
  useEffect(() => {
    if (currentLineIndex >= bootSequence.length) {
      setTimeout(onComplete, 800);
      return;
    }

    const currentLine = bootSequence[currentLineIndex];
    const startDelay = currentLineIndex === 0 ? currentLine.delay : 
      currentLine.delay - (bootSequence[currentLineIndex - 1]?.delay || 0);

    const timer = setTimeout(() => {
      typeText(currentLine.text, () => {
        setDisplayedLines((prev) => [...prev, currentLine]);
        setCurrentText("");
        setCurrentLineIndex((prev) => prev + 1);
      });
    }, startDelay);

    return () => clearTimeout(timer);
  }, [currentLineIndex, typeText, onComplete]);

  const getLineColor = (type: BootLine["type"]) => {
    switch (type) {
      case "header": return "text-primary text-glow font-bold";
      case "success": return "text-primary";
      case "warning": return "text-terminal-cyan";
      case "error": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-background z-50 overflow-hidden scanlines"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 bg-cyber-grid bg-cyber-grid opacity-30" />
      
      {/* Glitch overlay */}
      <AnimatePresence>
        {glitchActive && (
          <motion.div
            className="absolute inset-0 bg-primary/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.05 }}
          />
        )}
      </AnimatePresence>

      {/* Terminal content */}
      <div className="relative h-full flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-4xl">
          {/* Rendered lines */}
          {displayedLines.map((line, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.1 }}
              className={`font-mono text-sm md:text-base ${getLineColor(line.type)} ${
                glitchActive ? "glitch" : ""
              }`}
            >
              {line.text || "\u00A0"}
            </motion.div>
          ))}

          {/* Currently typing line */}
          {isTyping && (
            <div className="font-mono text-sm md:text-base text-muted-foreground">
              {currentText}
              <span className={`${showCursor ? "opacity-100" : "opacity-0"} text-primary`}>
                █
              </span>
            </div>
          )}

          {/* Idle cursor */}
          {!isTyping && currentLineIndex < bootSequence.length && (
            <div className="font-mono text-sm md:text-base">
              <span className={`${showCursor ? "opacity-100" : "opacity-0"} text-primary`}>
                █
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 text-xs text-muted-foreground/50 font-mono">
        [SYS] {new Date().toISOString()}
      </div>
      <div className="absolute top-4 right-4 text-xs text-muted-foreground/50 font-mono">
        NOVUS_CTF_2024
      </div>
      <div className="absolute bottom-4 left-4 text-xs text-muted-foreground/50 font-mono">
        MEM: 4096MB | CPU: 8 CORES
      </div>
      <div className="absolute bottom-4 right-4 text-xs text-primary/50 font-mono animate-pulse">
        ◉ SECURE
      </div>
    </motion.div>
  );
}
