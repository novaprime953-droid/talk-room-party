import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useBanners } from "@/hooks/useBanners";
import { useNavigate } from "react-router-dom";
import defaultBannerImg from "@/assets/default-banner.png";

const DEFAULT_BANNER = {
  id: "default",
  title: "Join Live Voice Rooms",
  image_url: defaultBannerImg,
  link_url: null,
  redirect_type: null,
  redirect_id: null,
};

const BannerSlider = () => {
  const { data: banners } = useBanners();
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const touchStart = useRef(0);
  const autoRef = useRef<ReturnType<typeof setInterval>>();

  const activeBanners = (() => {
    const live = banners?.filter((b: any) => {
      const now = new Date();
      if (b.start_date && new Date(b.start_date) > now) return false;
      if (b.end_date && new Date(b.end_date) < now) return false;
      return true;
    }) ?? [];
    return live.length > 0 ? live : [DEFAULT_BANNER];
  })();

  const goNext = useCallback(() => {
    if (activeBanners.length > 1) setCurrent((p) => (p + 1) % activeBanners.length);
  }, [activeBanners.length]);

  const goPrev = useCallback(() => {
    if (activeBanners.length > 1) setCurrent((p) => (p - 1 + activeBanners.length) % activeBanners.length);
  }, [activeBanners.length]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    autoRef.current = setInterval(goNext, 4000);
    return () => clearInterval(autoRef.current);
  }, [goNext, activeBanners.length]);

  const handleClick = (banner: any) => {
    if (banner.id === "default") return;
    if (banner.redirect_type === "room" && banner.redirect_id) navigate(`/room/${banner.redirect_id}`);
    else if (banner.redirect_type === "event") navigate("/events");
    else if (banner.link_url) window.open(banner.link_url, "_blank");
  };

  const b = activeBanners[current] ?? activeBanners[0];

  return (
    <div className="mx-3 sm:mx-4">
      <div
        className="relative h-40 sm:h-48 rounded-3xl overflow-hidden"
        style={{
          boxShadow: "0 8px 32px rgba(108, 0, 255, 0.25), 0 2px 8px rgba(0,0,0,0.4)",
        }}
        onTouchStart={(e) => { touchStart.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStart.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
        }}
      >
        {/* Glow border */}
        <div className="absolute inset-0 rounded-3xl border border-white/10 z-20 pointer-events-none" />
        <div
          className="absolute -inset-[1px] rounded-3xl z-10 pointer-events-none"
          style={{
            background: "linear-gradient(135deg, rgba(108,0,255,0.3) 0%, transparent 50%, rgba(255,215,0,0.2) 100%)",
          }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 cursor-pointer z-[1]"
            onClick={() => handleClick(b)}
          >
            <img
              src={b.image_url}
              alt={b.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {/* Bottom gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            {/* Title */}
            <div className="absolute bottom-4 left-4 right-20 z-10">
              <p className="text-sm font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] line-clamp-1">
                {b.title}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:bg-white/20 transition-all active:scale-90"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white/90 hover:bg-white/20 transition-all active:scale-90"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Indicator dots */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-3 right-4 z-30 flex items-center gap-1.5">
            {activeBanners.map((_: any, i: number) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                className="transition-all duration-300"
              >
                <div
                  className={`rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-5 h-2 bg-gradient-to-r from-purple-400 to-amber-400"
                      : "w-2 h-2 bg-white/30"
                  }`}
                />
              </button>
            ))}
          </div>
        )}

        {/* Counter badge */}
        {activeBanners.length > 1 && (
          <div className="absolute top-3 right-3 z-30 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
            <span className="text-[10px] font-bold text-white/80">
              {current + 1}/{activeBanners.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BannerSlider;
