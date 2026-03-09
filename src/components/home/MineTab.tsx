import { motion } from "framer-motion";
import { Home, Users, Clock } from "lucide-react";
import RoomCard from "@/components/RoomCard";
import EmptyState from "@/components/EmptyState";
import { useMyRoom, useFollowingRooms, useRecentRooms } from "@/hooks/useRooms";
import { useNavigate } from "react-router-dom";

const RoomGrid = ({ rooms, emptyMsg }: { rooms: any[] | null | undefined; emptyMsg: string }) => {
  if (!rooms || rooms.length === 0) {
    return <EmptyState title="No Rooms" subtitle={emptyMsg} />;
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {rooms.map((room: any) => {
        const hp = room.profiles as any;
        return (
          <RoomCard
            key={room.id}
            id={room.id}
            name={room.room_name}
            host={hp?.display_name ?? hp?.username ?? "Host"}
            hostAvatar={hp?.avatar_url ?? ""}
            listeners={room.listener_count}
            speakers={0}
            isLive={room.is_live}
            isPrivate={room.privacy_type === "private"}
            tags={[room.category]}
            coverImage={room.cover_image}
            countryFlag={room.country ? getFlagEmoji(room.country) : undefined}
          />
        );
      })}
    </div>
  );
};

const MineTab = () => {
  const navigate = useNavigate();
  const { data: myRoom, isLoading: loadingMy } = useMyRoom();
  const { data: followingRooms, isLoading: loadingFollowing } = useFollowingRooms();
  const { data: recentRooms, isLoading: loadingRecent } = useRecentRooms();

  return (
    <div className="space-y-6">
      {/* My Room */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Home className="w-4 h-4 text-primary" />
          <h2 className="font-display font-bold text-foreground text-base">My Room</h2>
        </div>
        {loadingMy ? (
          <div className="h-36 rounded-2xl bg-card animate-pulse" />
        ) : myRoom ? (
          <RoomGrid rooms={[myRoom]} emptyMsg="" />
        ) : (
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/create")}
            className="border-2 border-dashed border-border/60 rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <p className="text-xs font-bold text-foreground">Create Your Room</p>
            <p className="text-[10px] text-muted-foreground">Start hosting now</p>
          </motion.div>
        )}
      </section>

      {/* Following Rooms */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          <h2 className="font-display font-bold text-foreground text-base">Following</h2>
        </div>
        {loadingFollowing ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => <div key={i} className="h-36 rounded-2xl bg-card animate-pulse" />)}
          </div>
        ) : (
          <RoomGrid rooms={followingRooms} emptyMsg="Follow users to see their rooms here" />
        )}
      </section>

      {/* Recent Rooms */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="font-display font-bold text-foreground text-base">Recent</h2>
        </div>
        {loadingRecent ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => <div key={i} className="h-36 rounded-2xl bg-card animate-pulse" />)}
          </div>
        ) : (
          <RoomGrid rooms={recentRooms} emptyMsg="Join rooms to see your history" />
        )}
      </section>
    </div>
  );
};

function getFlagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return "🌍";
  return String.fromCodePoint(...[...code].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export default MineTab;
