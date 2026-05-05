import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Headphones, Users, Sparkles, ChevronRight } from "lucide-react";

interface SplashPageProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Mic,
    title: "Live Voice Rooms",
    subtitle: "Join premium voice chat rooms with hosts worldwide",
    gradient: "from-primary via-purple-500 to-pink-500",
    emoji: "🎙️",
  },
  {
    icon: Users,
    title: "Global Community",
    subtitle: "Connect with millions of people across 100+ countries",
    gradient: "from-blue-500 via-cyan-500 to-teal-500",
    emoji: "🌍",
  },
  {
    icon: Sparkles,
    title: "Gifts & Rewards",
    subtitle: "Send gifts, earn coins, and climb the leaderboard",
    gradient: "from-amber-500 via-orange-500 to-red-500",
    emoji: "🎁",
  },
];

const SplashPage = ({ onComplete }: SplashPageProps) => {
  const [currentSlide, setCurrentSlide] = useState(-1); // -1 = logo reveal
  const [showLogo, setShowLogo] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogo(false);
      setCurrentSlide(0);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => onComplete();

  // Logo reveal phase
  if (showLogo) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[150px]" />

        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 15, stiffness: 100, duration: 1.2 }}
          className="relative z-10"
        >
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl shadow-primary/40">
            <Mic className="w-14 h-14 text-white" />
          </div>
          <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl -z-10"
          />
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="font-display text-4xl font-bold text-foreground mt-6 tracking-tight"
        >
          Talk Room
        </motion.h1>
        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-muted-foreground text-sm mt-2"
        >
          Premium Voice Chat
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1.2 }}
          className="mt-12"
        >
          <div className="w-8 h-8 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
        </motion.div>
      </div>
    );
  }

  // Onboarding slides
  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />

      {/* Skip button */}
      <div className="relative z-10 flex justify-end p-6">
        <button onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Skip
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="flex flex-col items-center text-center"
          >
            {/* Icon circle */}
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br ${slide.gradient} flex items-center justify-center shadow-2xl mb-8 relative`}>
              <slide.icon className="w-16 h-16 text-white" />
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className={`absolute inset-0 rounded-full bg-gradient-to-br ${slide.gradient} opacity-30 blur-xl -z-10`}
              />
              <motion.span
                animate={{ y: [-5, 5, -5], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -top-3 -right-3 text-3xl"
              >
                {slide.emoji}
              </motion.span>
            </div>

            <h2 className="font-display text-3xl font-bold text-foreground mb-3">{slide.title}</h2>
            <p className="text-muted-foreground text-base max-w-xs leading-relaxed">{slide.subtitle}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom: dots + CTAs */}
      <div className="relative z-10 px-8 pb-12 space-y-6">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i === currentSlide ? 24 : 8, opacity: i === currentSlide ? 1 : 0.4 }}
              className="h-2 rounded-full bg-primary"
            />
          ))}
        </div>

        {currentSlide === slides.length - 1 ? (
          <div className="space-y-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onComplete}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white font-bold text-base shadow-lg shadow-primary/30"
            >
              Join Free 🎉
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onComplete}
              className="w-full py-4 rounded-2xl border border-border bg-card/50 backdrop-blur-sm text-foreground font-semibold text-base"
            >
              Sign In
            </motion.button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-purple-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
          >
            Next <ChevronRight className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default SplashPage;