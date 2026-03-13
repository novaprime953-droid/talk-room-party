import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MoreVertical, Mic, MicOff, Hand, MessageCircle,
  Gift, Gamepad2, Users, LogOut, Trophy, Share2, Crown,
  Lock, UserPlus, Settings,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import VoiceSeat from "@/components/VoiceSeat";
import RoomChat from "@/components/RoomChat";
import GiftPanel from "@/components/GiftPanel";
import RoomGamesPopup from "@/components/RoomGamesPopup";
import RoomRankings from "@/components/RoomRankings";
import RoomEntrance from "@/components/RoomEntrance";
import FramedAvatar from "@/components/FramedAvatar";
import { useRoom, useRoomParticipants, useJoinRoom, useLeaveRoom } from "@/hooks/useRooms";
import { useAuth } from "@/hooks/useAuth";
import { useEquippedProps } from "@/hooks/useProps";
import { supabase } from "@/integrations/supabase/client";

type BottomPanel = "chat" | "gifts" | "rankings" | null;

const RoomPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(true);
  const [activePanel, setActivePanel] = useState<BottomPanel>(null);
  const [handRaised, setHandRaised] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [showHostMenu, setShowHostMenu] = useState(false);

  const { data: room } = useRoom(id!);
  const { data: participants, refetch: refetchParticipants } = useRoomParticipants(id!);
  const joinRoom = useJoinRoom();
  const leaveRoom = useLeaveRoom();
  const { data: myEquipped } = useEquippedProps(user?.id);

  const isHost = room?.host_id === user?.id;

  // Auto-join on mount + send entrance message
  useEffect(() => {
    if (id && user) {
      joinRoom.mutate({ roomId: id });

      // Send entrance notification
      const sendEntrance = async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, username")
          .eq("user_id", user.id)
          .single();
        const name = profile?.display_name ?? profile?.username ?? "User";

        // Check for vehicle prop
        const { data: vehicleProp } = await supabase
          .from("user_props")
          .select("*, props(*)")
          .eq("user_id", user.id)
          .eq("is_equipped", true)
          .eq("status", "active");

        const vehicle = (vehicleProp as any[])?.find(
          (p) => p.props?.category === "vehicle"
        );

        let msg = `${name} entered the room`;
        if (vehicle) {
          msg = `🚗 ${name} entered with ${vehicle.props.name}`;
          // Trigger entrance animation
          (window as any).__triggerEntrance?.({
            id: crypto.randomUUID(),
            username: name,
            vehicleName: vehicle.props.name,
            vehicleEmoji: "🚗",
          });
        }

        await supabase.from("room_messages").insert({
          room_id: id,
          user_id: user.id,
          message: msg,
          type: "entrance",
        });
      };
      sendEntrance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  // Realtime participants
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`room-participants-${id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "room_participants",
        filter: `room_id=eq.${id}`,
      }, () => refetchParticipants())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, refetchParticipants]);

  const handleLeave = async () => {
    if (id) await leaveRoom.mutateAsync(id);
    navigate("/");
  };

  const handleRaiseHand = async () => {
    setHandRaised(!handRaised);
    if (id && user) {
      await supabase
        .from("room_participants")
        .update({ hand_raised: !handRaised })
        .eq("room_id", id)
        .eq("user_id", user.id);
    }
  };

  const handleToggleMic = async () => {
    setIsMuted(!isMuted);
    if (id && user) {
      await supabase
        .from("room_participants")
        .update({ mic_status: isMuted ? "unmuted" : "muted" })
        .eq("room_id", id)
        .eq("user_id", user.id);
    }
  };

  const togglePanel = (panel: BottomPanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  // Build seats
  const maxSeats = room?.max_seats ?? 8;
  const myFrame = myEquipped?.find((p) => (p as any).props?.category === "frame");

  const seats = Array.from({ length: maxSeats }, (_, i) => {
    const p = participants?.find((p) => p.seat_index === i);
    if (!p) return null;
    const profile = p.profiles as any;
    return {
      name: profile?.display_name ?? profile?.username ?? "User",
      avatar: profile?.avatar_url,
      isSpeaking: p.mic_status === "unmuted",
      isMuted: p.mic_status === "muted",
      isHost: room?.host_id === p.user_id,
      frameUrl: null as string | null, // Could fetch per-user frame props
      userId: p.user_id,
    };
  });

  const activeListeners = participants?.filter((p) => !p.left_at)?.length ?? 0;

  return (
    <div className="min-h-screen bg-background gradient-room flex flex-col relative">
      {/* Entrance Animation Overlay */}
      <RoomEntrance />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 relative z-10">
        <button onClick={() => navigate(-1)} className="p-2 text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center flex-1">
          <div className="flex items-center justify-center gap-2">
            {room?.cover_image && (
              <FramedAvatar src={room.cover_image} name={room.room_name} size="xs" />
            )}
            <h1 className="font-display font-bold text-sm text-foreground truncate max-w-[180px]">
              {room?.room_name ?? "Loading..."}
            </h1>
          </div>
          <div className="flex items-center justify-center gap-2 mt-0.5">
            {room?.is_live && (
              <>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-live rounded-full animate-pulse" />
                  <span className="text-[10px] text-live font-bold">LIVE</span>
                </div>
                <span className="text-[10px] text-muted-foreground">•</span>
              </>
            )}
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">{activeListeners}</span>
            </div>
            {room?.country && (
              <>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-xs">{room.country}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isHost && (
            <button
              onClick={() => setShowHostMenu(!showHostMenu)}
              className="p-2 text-foreground"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
          <button className="p-2 text-foreground">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Host Controls Dropdown */}
      <AnimatePresence>
        {showHostMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-14 right-4 z-50 bg-card border border-border rounded-xl p-2 shadow-card min-w-[160px]"
          >
            {[
              { icon: MicOff, label: "Mute All" },
              { icon: Lock, label: "Lock Empty Seats" },
              { icon: UserPlus, label: "Assign Co-Host" },
              { icon: LogOut, label: "End Room", danger: true },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setShowHostMenu(false)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  item.danger
                    ? "text-destructive hover:bg-destructive/10"
                    : "text-foreground hover:bg-muted/30"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Seats Grid */}
      <div className="flex-1 px-4 py-4">
        <div className="grid grid-cols-4 gap-y-6 justify-items-center max-w-sm mx-auto">
          {seats.map((seat, i) => (
            <VoiceSeat
              key={i}
              index={i}
              user={
                seat
                  ? {
                      name: seat.name,
                      avatar: seat.avatar ?? undefined,
                      isSpeaking: seat.isSpeaking,
                      isMuted: seat.isMuted,
                      isHost: seat.isHost,
                      frameUrl: seat.frameUrl,
                    }
                  : undefined
              }
            />
          ))}
        </div>
      </div>

      {/* Bottom Panels */}
      <AnimatePresence>
        {activePanel === "chat" && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "40vh" }}
            exit={{ height: 0 }}
            className="bg-card/90 backdrop-blur-lg border-t border-border/50 overflow-hidden"
          >
            <RoomChat roomId={id!} />
          </motion.div>
        )}
        {activePanel === "gifts" && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "35vh" }}
            exit={{ height: 0 }}
            className="bg-card/90 backdrop-blur-lg border-t border-border/50 overflow-hidden"
          >
            <GiftPanel
              roomId={id!}
              hostId={room?.host_id}
              onClose={() => setActivePanel(null)}
            />
          </motion.div>
        )}
        {activePanel === "rankings" && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "45vh" }}
            exit={{ height: 0 }}
            className="bg-card/90 backdrop-blur-lg border-t border-border/50 overflow-hidden"
          >
            <RoomRankings roomId={id!} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Games Popup */}
      <RoomGamesPopup open={showGames} onClose={() => setShowGames(false)} />

      {/* Bottom Controls */}
      <div className="bg-card/90 backdrop-blur-lg border-t border-border/50 px-4 py-3 safe-bottom">
        <div className="flex items-center justify-around max-w-sm mx-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => togglePanel("chat")}
            className={`p-3 rounded-full ${
              activePanel === "chat"
                ? "bg-primary/20 text-primary"
                : "bg-muted/40 text-muted-foreground"
            }`}
          >
            <MessageCircle className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => togglePanel("gifts")}
            className={`p-3 rounded-full ${
              activePanel === "gifts"
                ? "bg-accent/20 text-accent"
                : "bg-accent/10 text-accent"
            }`}
          >
            <Gift className="w-5 h-5" />
          </motion.button>

          {/* Mic button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleMic}
            className={`p-4 rounded-full ${
              isMuted
                ? "bg-muted/40 text-muted-foreground"
                : "gradient-primary text-primary-foreground glow-primary"
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => togglePanel("rankings")}
            className={`p-3 rounded-full ${
              activePanel === "rankings"
                ? "bg-accent/20 text-accent"
                : "bg-muted/40 text-muted-foreground"
            }`}
          >
            <Trophy className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowGames(true)}
            className={`p-3 rounded-full ${
              showGames
                ? "bg-primary/20 text-primary"
                : "bg-muted/40 text-muted-foreground"
            }`}
          >
            <Gamepad2 className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRaiseHand}
            className={`p-3 rounded-full ${
              handRaised
                ? "bg-accent/20 text-accent"
                : "bg-muted/40 text-muted-foreground"
            }`}
          >
            <Hand className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleLeave}
            className="p-3 rounded-full bg-destructive/10 text-destructive"
          >
            <LogOut className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
