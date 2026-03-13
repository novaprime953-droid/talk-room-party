import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface EntranceEvent {
  id: string;
  username: string;
  vehicleName?: string;
  vehicleEmoji?: string;
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
        {entrances.map((e) => (
          <motion.div
            key={e.id}
            initial={{ x: -200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 200, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 200 }}
            className="px-4 py-2 rounded-full gradient-gold shadow-lg flex items-center gap-2"
          >
            {e.vehicleEmoji && <span className="text-xl">{e.vehicleEmoji}</span>}
            <span className="text-xs font-bold text-accent-foreground">
              {e.username} entered
              {e.vehicleName ? ` with ${e.vehicleName}` : ""}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RoomEntrance;
