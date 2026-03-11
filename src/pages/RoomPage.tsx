import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MoreVertical, Mic, MicOff, Hand, MessageCircle, Gift, Gamepad2, Users, LogOut } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import VoiceSeat from "@/components/VoiceSeat";
import RoomChat from "@/components/RoomChat";
import GiftPanel from "@/components/GiftPanel";
import RoomGamesPopup from "@/components/RoomGamesPopup";
import { useRoom, useRoomParticipants, useJoinRoom, useLeaveRoom } from "@/hooks/useRooms";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const RoomPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showGifts, setShowGifts] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showGames, setShowGames] = useState(false);

  const { data: room } = useRoom(id!);
  const { data: participants, refetch: refetchParticipants } = useRoomParticipants(id!);
  const joinRoom = useJoinRoom();
  const leaveRoom = useLeaveRoom();

  // Auto-join on mount
  useEffect(() => {
    if (id && user) {
      joinRoom.mutate({ roomId: id });
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
      }, () => {
        refetchParticipants();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id, refetchParticipants]);

  const handleLeave = async () => {
    if (id) {
      await leaveRoom.mutateAsync(id);
    }
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

  // Build seats array
  const maxSeats = room?.max_seats ?? 8;
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
      userId: p.user_id,
    };
  });

  const activeListeners = participants?.filter((p) => !p.left_at)?.length ?? 0;

  return (
    <div className="min-h-screen bg-background gradient-room flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center flex-1">
          <h1 className="font-display font-bold text-sm text-foreground truncate px-2">
            {room?.room_name ?? "Loading..."}
          </h1>
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
          </div>
        </div>
        <button className="p-2 text-foreground">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Seats Grid */}
      <div className="flex-1 px-4 py-4">
        <div className="grid grid-cols-4 gap-y-6 justify-items-center max-w-sm mx-auto">
          {seats.map((seat, i) => (
            <VoiceSeat
              key={i}
              index={i}
              user={seat ? { name: seat.name, avatar: seat.avatar ?? undefined, isSpeaking: seat.isSpeaking, isMuted: seat.isMuted, isHost: seat.isHost } : undefined}
            />
          ))}
        </div>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "40vh" }}
            exit={{ height: 0 }}
            className="bg-card/90 backdrop-blur-lg border-t border-border/50 overflow-hidden"
          >
            <RoomChat roomId={id!} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift Panel */}
      <AnimatePresence>
        {showGifts && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "35vh" }}
            exit={{ height: 0 }}
            className="bg-card/90 backdrop-blur-lg border-t border-border/50 overflow-hidden"
          >
            <GiftPanel roomId={id!} hostId={room?.host_id} onClose={() => setShowGifts(false)} />
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
            onClick={() => { setShowChat(!showChat); setShowGifts(false); }}
            className={`p-3 rounded-full ${showChat ? "bg-primary/20 text-primary" : "bg-muted/40 text-muted-foreground"}`}
          >
            <MessageCircle className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => { setShowGifts(!showGifts); setShowChat(false); }}
            className={`p-3 rounded-full ${showGifts ? "bg-accent/20 text-accent" : "bg-accent/10 text-accent"}`}
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
            onClick={() => setShowGames(true)}
            className={`p-3 rounded-full ${showGames ? "bg-primary/20 text-primary" : "bg-muted/40 text-muted-foreground"}`}
          >
            <Gamepad2 className="w-5 h-5" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleRaiseHand}
            className={`p-3 rounded-full ${handRaised ? "bg-accent/20 text-accent" : "bg-muted/40 text-muted-foreground"}`}
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
