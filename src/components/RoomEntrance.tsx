import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Crown, Shield } from "lucide-react";

interface EntranceEvent {
  id: string;
  username: string;
  vehicleName?: string;
  vehicleEmoji?: string;
  role?: "owner" | "admin" | "super_admin" | "manager" | string | null;
}

const RoomEntrance = () => {
  const [entrances, setEntrances] = useState<EntranceEvent[]>([]);

  // Expose a global function to trigger entrance animations
  useEffect(() => {
    (window as any).__triggerEntrance = (event: EntranceEvent) => {
      setEntrances((prev) => [...prev, event]);
      setTimeout(() => {
        setEntrances((prev) => prev.filter((e) => e.id !== event.id));
      }, 4000);
    };
    return () => {
      delete (window as any).__triggerEntrance;
    };
  }, []);

  return (
    <div className="absolute top-16 left-0 right-0 z-30 pointer-events-none flex flex-col items-center gap-2">
      <AnimatePresence>
        {entrances.map((e) => {
          const isOwner = e.role === "owner";
          const isAdmin = e.role === "admin" || e.role === "super_admin" || e.role === "manager";
          if (isOwner) {
            return (
              <motion.div key={e.id}
                initial={{ scale: 0.6, opacity: 0, y: -40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.6, opacity: 0, y: -40 }}
                transition={{ type: "spring", damping: 18, stiffness: 220 }}
                className="w-[92%] max-w-md px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 relative overflow-hidden"
                style={{ background: "linear-gradient(110deg, #1a0033, #4a0080 35%, #ff8c00 70%, #1a0033)" }}>
                <motion.div className="absolute inset-0 opacity-30"
                  animate={{ x: ["-100%", "100%"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                  style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)" }} />
                <Crown className="w-6 h-6 text-amber-200 drop-shadow relative z-10" />
                <span className="text-sm font-extrabold text-white relative z-10 flex-1">
                  👑 OWNER {e.username} has entered the room
                </span>
                {e.vehicleEmoji && <span className="text-2xl relative z-10">{e.vehicleEmoji}</span>}
              </motion.div>
            );
          }
          if (isAdmin) {
            return (
              <motion.div key={e.id}
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 200, opacity: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 200 }}
                className="px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
                style={{ background: "linear-gradient(110deg, #1e1b4b, #6d28d9)" }}>
                <Shield className="w-4 h-4 text-purple-200" />
                <span className="text-xs font-bold text-white">
                  Admin {e.username} entered{e.vehicleName ? ` with ${e.vehicleName}` : ""}
                </span>
              </motion.div>
            );
          }
          return (
            <motion.div key={e.id}
              initial={{ x: -200, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 200, opacity: 0 }}
              transition={{ type: "spring", damping: 20, stiffness: 200 }}
              className="px-4 py-2 rounded-full gradient-gold shadow-lg flex items-center gap-2">
              {e.vehicleEmoji && <span className="text-xl">{e.vehicleEmoji}</span>}
              <span className="text-xs font-bold text-accent-foreground">
                {e.username} entered{e.vehicleName ? ` with ${e.vehicleName}` : ""}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default RoomEntrance;
