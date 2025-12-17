import { motion } from "framer-motion";

interface Props {
  size?: "sm" | "md" | "lg";
  animate?: boolean;
}

export function Logo({ size = "md", animate = true }: Props) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl md:text-6xl",
  };

  return (
    <motion.div
      className={`font-mono font-bold ${sizeClasses[size]} tracking-wider`}
      initial={animate ? { opacity: 0, y: -20 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.5 }}
    >
      <span className="text-primary text-glow">NOVUS</span>
      <span className="text-muted-foreground ml-2 text-[0.6em]">CTF</span>
    </motion.div>
  );
}
