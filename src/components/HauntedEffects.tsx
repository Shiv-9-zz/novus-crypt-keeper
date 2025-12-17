import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import hauntedHandImg from "@/assets/haunted-hand.png";

interface BloodDrip {
  id: number;
  left: string;
  delay: number;
  duration: number;
}

interface BloodSplatter {
  id: number;
  left: string;
  top: string;
  size: number;
}

export function HauntedEffects() {
  const [bloodDrips, setBloodDrips] = useState<BloodDrip[]>([]);
  const [splatters, setSplatters] = useState<BloodSplatter[]>([]);
  const [showLeftHand, setShowLeftHand] = useState(false);
  const [showRightHand, setShowRightHand] = useState(false);

  useEffect(() => {
    // Generate random blood drips
    const drips: BloodDrip[] = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 10,
      duration: 6 + Math.random() * 4,
    }));
    setBloodDrips(drips);

    // Generate random blood splatters
    const newSplatters: BloodSplatter[] = Array.from({ length: 3 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: 20 + Math.random() * 40,
    }));
    setSplatters(newSplatters);

    // Randomly show hands
    const handInterval = setInterval(() => {
      if (Math.random() < 0.15) {
        setShowLeftHand(true);
        setTimeout(() => setShowLeftHand(false), 3000);
      }
      if (Math.random() < 0.1) {
        setShowRightHand(true);
        setTimeout(() => setShowRightHand(false), 2500);
      }
    }, 8000);

    // Show hands initially after a delay
    setTimeout(() => {
      setShowLeftHand(true);
      setTimeout(() => setShowLeftHand(false), 3000);
    }, 5000);

    return () => clearInterval(handInterval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {/* Blood drips from top */}
      {bloodDrips.map((drip) => (
        <div
          key={drip.id}
          className="blood-drip"
          style={{
            left: drip.left,
            animationDelay: `${drip.delay}s`,
            animationDuration: `${drip.duration}s`,
          }}
        />
      ))}

      {/* Blood splatters */}
      {splatters.map((splatter) => (
        <div
          key={splatter.id}
          className="blood-splatter"
          style={{
            left: splatter.left,
            top: splatter.top,
            width: splatter.size,
            height: splatter.size,
          }}
        />
      ))}

      {/* Haunted hands */}
      <AnimatePresence>
        {showLeftHand && (
          <motion.img
            src={hauntedHandImg}
            alt=""
            initial={{ x: -150, opacity: 0 }}
            animate={{ x: 0, opacity: 0.7 }}
            exit={{ x: -150, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="fixed left-0 bottom-[15%] w-32 md:w-48 rotate-[20deg] drop-shadow-[0_0_30px_rgba(0,255,100,0.6)] z-[60]"
            style={{ filter: "hue-rotate(-10deg)" }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRightHand && (
          <motion.img
            src={hauntedHandImg}
            alt=""
            initial={{ x: 150, opacity: 0 }}
            animate={{ x: 0, opacity: 0.6 }}
            exit={{ x: 150, opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="fixed right-0 top-[25%] w-28 md:w-40 -rotate-[25deg] scale-x-[-1] drop-shadow-[0_0_25px_rgba(0,255,100,0.5)] z-[60]"
            style={{ filter: "hue-rotate(-10deg)" }}
          />
        )}
      </AnimatePresence>

      {/* Vignette blood overlay on edges */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at top left, rgba(80, 0, 0, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse at bottom right, rgba(80, 0, 0, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at top right, rgba(60, 0, 0, 0.08) 0%, transparent 30%)
          `,
        }}
      />
    </div>
  );
}
