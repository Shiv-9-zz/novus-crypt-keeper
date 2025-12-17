import { motion } from "framer-motion";

interface Props {
  text?: string;
}

export function TerminalLoader({ text = "Processing" }: Props) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
      <motion.span
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {text}
      </motion.span>
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
      >
        .
      </motion.span>
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}
      >
        .
      </motion.span>
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0.4 }}
      >
        .
      </motion.span>
    </div>
  );
}
