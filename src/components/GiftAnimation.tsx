import { motion, AnimatePresence } from "framer-motion";

interface GiftAnimationProps {
  animation: {
    sender: string;
    receiver: string;
    giftName: string;
    emoji: string;
  } | null;
}

const GiftAnimation = ({ animation }: GiftAnimationProps) => {
  return (
    <AnimatePresence>
      {animation && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.3, y: -100 }}
          transition={{ type: "spring", damping: 15 }}
          className="fixed inset-x-0 top-1/3 z-[100] flex flex-col items-center pointer-events-none"
        >
          {/* Glow background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full bg-accent/20 blur-3xl animate-pulse" />
          </div>
          
          {/* Gift emoji */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.8, repeat: 2 }}
            className="text-7xl relative z-10 drop-shadow-2xl"
          >
            {animation.emoji}
          </motion.div>

          {/* Info banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative z-10 mt-3 px-5 py-2.5 rounded-2xl bg-card/90 backdrop-blur-xl border border-accent/30 shadow-xl"
          >
            <p className="text-xs text-center">
              <span className="font-bold text-primary">{animation.sender}</span>
              <span className="text-muted-foreground"> sent </span>
              <span className="font-bold text-accent">{animation.giftName}</span>
              <span className="text-muted-foreground"> to </span>
              <span className="font-bold text-primary">{animation.receiver}</span>
            </p>
          </motion.div>

          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 1, x: 0, y: 0 }}
              animate={{
                opacity: 0,
                x: (Math.random() - 0.5) * 200,
                y: -Math.random() * 150 - 50,
              }}
              transition={{ duration: 1.5 + Math.random(), delay: 0.2 + i * 0.1 }}
              className="absolute top-1/2 text-2xl"
              style={{ left: `${40 + Math.random() * 20}%` }}
            >
              ✨
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GiftAnimation;
