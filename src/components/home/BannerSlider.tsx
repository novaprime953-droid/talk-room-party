import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBanners } from "@/hooks/useBanners";
import { useNavigate } from "react-router-dom";

const BannerSlider = () => {
  const { data: banners } = useBanners();
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const touchStart = useRef(0);

  const activeBanners = banners?.filter((b: any) => {
    const now = new Date();
    if (b.start_date && new Date(b.start_date) > now) return false;
    if (b.end_date && new Date(b.end_date) < now) return false;
    return true;
  }) ?? [];

  const goNext = useCallback(() => {
    if (activeBanners.length > 1) setCurrent((p) => (p + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const goPrev = useCallback(() => {
    if (activeBanners.length > 1) setCurrent((p) => (p - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(goNext, 4000);
    return () => clearInterval(timer);
  }, [goNext, activeBanners.length]);

  const handleClick = (banner: any) => {
    if (banner.redirect_type === "room" && banner.redirect_id) navigate(`/room/${banner.redirect_id}`);
    else if (banner.redirect_type === "event") navigate("/events");
    else if (banner.link_url) window.open(banner.link_url, "_blank");
  };

  if (activeBanners.length === 0) {
    return (
      <div className="mx-4 h-36 sm:h-44 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 flex items-center justify-center shadow-lg shadow-primary/5 border border-border/20">
        <div className="text-center">
          <span className="text-2xl mb-1 block">✨</span>
          <span className="text-sm text-muted-foreground font-semibold">Welcome to Talk Room</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4">
      <div
        className="relative h-36 sm:h-44 rounded-2xl overflow-hidden shadow-lg shadow-primary/5 border border-border/20"
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStart.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 cursor-pointer"
            onClick={() => handleClick(activeBanners[current])}
          >
            <img src={activeBanners[current]?.image_url} alt={activeBanners[current]?.title}
              className="w-full h-full object-cover rounded-2xl" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10 rounded-2xl" />
            <div className="absolute bottom-3 left-4 right-16">
              <p className="text-xs font-bold text-white drop-shadow-lg truncate">{activeBanners[current]?.title}</p>
            </div>
          </motion.div>
        </AnimatePresence>

        {activeBanners.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/50 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/80 hover:bg-black/50 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {activeBanners.length > 1 && (
          <div className="absolute bottom-2.5 right-3 flex gap-1.5">
            {activeBanners.map((_: any, i: number) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className={`rounded-full transition-all duration-300 ${i === current ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerSlider;
