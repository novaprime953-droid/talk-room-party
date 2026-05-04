import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLiveRooms } from "@/hooks/useRooms";
import FramedAvatar from "@/components/FramedAvatar";

const LiveStoriesBar = () => {
  const navigate = useNavigate();
  const { data: rooms } = useLiveRooms();

  const liveHosts = (rooms ?? []).slice(0, 15).map((r: any) => ({
    id: r.id,
    name: (r.profiles as any)?.display_name ?? (r.profiles as any)?.username ?? "Host",
    avatar: (r.profiles as any)?.avatar_url,
    isLive: r.is_live,
  }));

  if (liveHosts.length === 0) return null;

  return (
    <div className="px-4 pt-3 pb-1">
      <div className="flex gap-3 overflow-x-auto no-scrollbar">
        {liveHosts.map((host, i) => (
          <motion.button
            key={host.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(`/room/${host.id}`)}
            className="flex flex-col items-center gap-1 min-w-[60px]"
          >
            <div className="relative">
              <div className="rounded-full p-[2px] bg-gradient-to-br from-primary via-secondary to-accent animate-pulse-glow">
                <div className="rounded-full p-[2px] bg-background">
                  <FramedAvatar src={host.avatar} name={host.name} size="sm" />
                </div>
              </div>
              {host.isLive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-live text-[7px] font-bold text-white animate-live-pulse">
                  LIVE
                </div>
              )}
            </div>
            <span className="text-[9px] font-semibold text-muted-foreground truncate w-14 text-center">
              {host.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default LiveStoriesBar;