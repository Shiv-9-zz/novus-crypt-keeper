import { motion } from "framer-motion";
import { forwardRef } from "react";

interface Props {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
  glitch?: boolean;
}

export const Logo = forwardRef<HTMLDivElement, Props>(
  ({ size = "md", animate = true, glitch = true }, ref) => {
    const sizeClasses = {
      sm: "text-xl",
      md: "text-3xl",
      lg: "text-5xl md:text-6xl",
    };

    return (
      <motion.div
        ref={ref}
        className={`font-mono font-bold ${sizeClasses[size]} tracking-wider`}
        initial={animate ? { opacity: 0, y: -20 } : false}
        animate={animate ? { opacity: 1, y: 0 } : false}
        transition={{ duration: 0.5 }}
      >
        <span 
          className={`text-primary text-glow ${glitch ? 'glitch' : ''}`}
          data-text="NOVUS"
        >
          NOVUS
        </span>
        <span className="text-muted-foreground ml-2 text-[0.6em] flicker-slow">CTF</span>
      </motion.div>
    );
  }
);

Logo.displayName = "Logo";
