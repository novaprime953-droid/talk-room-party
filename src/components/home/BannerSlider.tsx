import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useBanners } from "@/hooks/useBanners";

const BannerSlider = () => {
  const { data: banners } = useBanners();
  const [current, setCurrent] = useState(0);

  const activeBanners = banners?.filter((b: any) => {
    const now = new Date();
    if (b.start_date && new Date(b.start_date) > now) return false;
    if (b.end_date && new Date(b.end_date) < now) return false;
    return true;
  }) ?? [];

  const next = useCallback(() => {
    if (activeBanners.length > 1) {
      setCurrent((prev) => (prev + 1) % activeBanners.length);
    }
  }, [activeBanners.length]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(next, 4000);
    return () => clearInterval(timer);
  }, [next, activeBanners.length]);

  if (activeBanners.length === 0) {
    return (
      <div className="mx-4 h-36 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
        <span className="text-sm text-muted-foreground font-semibold">✨ Welcome to Talk Room</span>
      </div>
    );
  }

  return (
    <div className="mx-4">
      <div className="relative h-36 rounded-2xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0"
          >
            <img
              src={activeBanners[current]?.image_url}
              alt={activeBanners[current]?.title}
              className="w-full h-full object-cover rounded-2xl"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
            <div className="absolute bottom-3 left-4">
              <p className="text-xs font-bold text-white drop-shadow-lg">
                {activeBanners[current]?.title}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Dots */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-2 right-3 flex gap-1">
            {activeBanners.map((_: any, i: number) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === current ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerSlider;
