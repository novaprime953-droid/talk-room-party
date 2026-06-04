import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Mic, MicOff, MessageCircle, Gift, Gamepad2,
  Users, LogOut, Trophy, Share2, Crown, Lock, UserPlus,
  Settings, Music, Smile, DoorOpen, Volume2, MoreVertical,
  Megaphone, Flag, Rocket, Armchair,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import roomBgCastle from "@/assets/room-bg-castle.jpg";
import VoiceSeat from "@/components/VoiceSeat";
import RoomChat from "@/components/RoomChat";
import GiftPanel from "@/components/GiftPanel";
import RoomGamesPopup from "@/components/RoomGamesPopup";
import RoomRankings from "@/components/RoomRankings";
import RoomEntrance from "@/components/RoomEntrance";
import FramedAvatar from "@/components/FramedAvatar";
import GiftAnimation from "@/components/GiftAnimation";
import PKBattle from "@/components/PKBattle";
import GiftBottomSheet from "@/components/GiftBottomSheet";
import { useRoom, useRoomParticipants, useJoinRoom, useLeaveRoom } from "@/hooks/useRooms";
import { useAuth } from "@/hooks/useAuth";
import { useEquippedProps } from "@/hooks/useProps";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

type BottomPanel = "chat" | "gifts" | "rankings" | null;

const RoomPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(true);
  const [activePanel, setActivePanel] = useState<BottomPanel>("chat");
  const [handRaised, setHandRaised] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [showHostMenu, setShowHostMenu] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [giftAnim, setGiftAnim] = useState<{ sender: string; receiver: string; giftName: string; emoji: string } | null>(null);
  const [showPK, setShowPK] = useState(false);
  const [showGiftSheet, setShowGiftSheet] = useState(false);
  const [pendingSeatIndex, setPendingSeatIndex] = useState<number | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState<{ open: boolean; seatIndex: number | null }>({ open: false, seatIndex: null });
  const [takeoverConfirm, setTakeoverConfirm] = useState<{ open: boolean; seatIndex: number | null; ownerName?: string }>({ open: false, seatIndex: null });
  const [incomingTakeover, setIncomingTakeover] = useState<any>(null);
  const [respondingTakeover, setRespondingTakeover] = useState(false);

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
      const sendEntrance = async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, username, user_id_number")
          .eq("user_id", user.id)
          .single();
        const name = profile?.display_name ?? profile?.username ?? "User";
        const { data: vehicleProp } = await supabase
          .from("user_props")
          .select("*, props(*)")
          .eq("user_id", user.id)
          .eq("is_equipped", true)
          .eq("status", "active");
        const vehicle = (vehicleProp as any[])?.find((p) => p.props?.category === "vehicle");
        let msg = `${name} entered the room`;
        if (vehicle) {
          msg = `🚗 ${name} entered with ${vehicle.props.name}`;
          (window as any).__triggerEntrance?.({
            id: crypto.randomUUID(),
            username: name,
            vehicleName: vehicle.props.name,
            vehicleEmoji: "🚗",
          });
        }
        await supabase.from("room_messages").insert({
          room_id: id, user_id: user.id, message: msg, type: "entrance",
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
      .on("postgres_changes", { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${id}` }, () => refetchParticipants())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, refetchParticipants]);

  // Realtime takeover requests targeting me
  useEffect(() => {
    if (!id || !user) return;
    const channel = supabase
      .channel(`takeover-${id}-${user.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "seat_takeover_requests",
        filter: `current_owner_id=eq.${user.id}`,
      }, async (payload) => {
        const req = payload.new as any;
        if (req.room_id !== id || req.status !== "pending") return;
        const { data: prof } = await supabase
          .from("profiles").select("display_name, username")
          .eq("user_id", req.requester_id).single();
        setIncomingTakeover({
          ...req,
          requesterName: prof?.display_name ?? prof?.username ?? "Someone",
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, user?.id]);

  // Listen for gift transactions in realtime for animations
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`room-gifts-${id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "gift_transactions", filter: `room_id=eq.${id}`,
      }, async (payload) => {
        const tx = payload.new as any;
        const [senderRes, receiverRes, giftRes] = await Promise.all([
          supabase.from("profiles").select("display_name, username").eq("user_id", tx.sender_id).single(),
          supabase.from("profiles").select("display_name, username").eq("user_id", tx.receiver_id).single(),
          supabase.from("gifts").select("gift_name, icon_url, category").eq("id", tx.gift_id).single(),
        ]);
        const sName = senderRes.data?.display_name ?? senderRes.data?.username ?? "User";
        const rName = receiverRes.data?.display_name ?? receiverRes.data?.username ?? "User";
        const gName = giftRes.data?.gift_name ?? "Gift";
        const emoji = giftRes.data?.icon_url || (giftRes.data?.category === "luxury" ? "👑" : giftRes.data?.category === "premium" ? "💎" : "🎁");
        setGiftAnim({ sender: sName, receiver: rName, giftName: gName, emoji });
        setTimeout(() => setGiftAnim(null), 3500);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const handleLeave = async () => {
    if (id) await leaveRoom.mutateAsync(id);
    navigate("/");
  };

  const handleRaiseHand = async () => {
    setHandRaised(!handRaised);
    if (id && user) {
      await supabase.from("room_participants").update({ hand_raised: !handRaised }).eq("room_id", id).eq("user_id", user.id);
    }
  };

  const handleToggleMic = async () => {
    setIsMuted(!isMuted);
    if (id && user) {
      await supabase.from("room_participants").update({ mic_status: isMuted ? "unmuted" : "muted" }).eq("room_id", id).eq("user_id", user.id);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: room?.room_name, url });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Room link copied!");
    }
  };

  const togglePanel = (panel: BottomPanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const myCurrentSeatIndex = participants?.find(
    (p) => p.user_id === user?.id && !p.left_at,
  )?.seat_index ?? null;

  const errorMessages: Record<string, string> = {
    already_seated: "You already have a seat. Leave it first.",
    seat_taken: "That seat is already taken.",
    not_in_room: "You need to be in the room first.",
    invalid_index: "Invalid seat.",
    room_not_found: "Room not found.",
    unauthenticated: "Please sign in.",
  };

  const claimSeat = async (index: number) => {
    if (!id) return;
    setPendingSeatIndex(index);
    const { data, error } = await supabase.rpc("claim_seat", {
      p_room_id: id, p_seat_index: index,
    });
    setPendingSeatIndex(null);
    if (error) { toast.error(error.message); return; }
    const res = data as any;
    if (!res?.success) {
      toast.error(errorMessages[res?.error_code] ?? res?.message ?? "Could not take seat", {
        icon: <Lock className="w-4 h-4 text-destructive" />,
      });
      return;
    }
    refetchParticipants();
  };

  const leaveSeat = async () => {
    if (!id) return;
    const seatIdx = leaveConfirm.seatIndex;
    setPendingSeatIndex(seatIdx);
    const { data, error } = await supabase.rpc("leave_seat", { p_room_id: id });
    setPendingSeatIndex(null);
    setLeaveConfirm({ open: false, seatIndex: null });
    if (error) { toast.error(error.message); return; }
    if ((data as any)?.success) {
      toast.success("You left the seat");
      refetchParticipants();
    }
  };

  const requestTakeover = async () => {
    if (!id || takeoverConfirm.seatIndex == null) return;
    const idx = takeoverConfirm.seatIndex;
    setPendingSeatIndex(idx);
    const { data, error } = await supabase.rpc("request_seat_takeover", {
      p_room_id: id, p_seat_index: idx,
    });
    setPendingSeatIndex(null);
    setTakeoverConfirm({ open: false, seatIndex: null });
    if (error) { toast.error(error.message); return; }
    const res = data as any;
    if (!res?.success) { toast.error(res?.message ?? "Could not request seat"); return; }
    toast.success("Takeover request sent — waiting for response");
  };

  const respondTakeover = async (accept: boolean) => {
    if (!incomingTakeover) return;
    setRespondingTakeover(true);
    const { data, error } = await supabase.rpc("respond_seat_takeover", {
      p_request_id: incomingTakeover.id, p_accept: accept,
    });
    setRespondingTakeover(false);
    if (error) { toast.error(error.message); return; }
    const res = data as any;
    if (res?.success) {
      toast.success(accept ? "Seat handed over" : "Takeover denied");
      setIncomingTakeover(null);
      refetchParticipants();
    } else {
      toast.error(res?.error_code ?? "Failed");
      setIncomingTakeover(null);
    }
  };

  const handleSeatTap = async (index: number) => {
    if (!user || !id) return;
    if (pendingSeatIndex !== null) return;
    const occupied = participants?.find((p) => p.seat_index === index && !p.left_at);

    // Tapping own seat → confirm leave
    if (myCurrentSeatIndex === index) {
      setLeaveConfirm({ open: true, seatIndex: index });
      return;
    }

    // Occupied by someone else → confirm takeover request
    if (occupied && occupied.user_id !== user.id) {
      const prof = occupied.profiles as any;
      setTakeoverConfirm({
        open: true,
        seatIndex: index,
        ownerName: prof?.display_name ?? prof?.username ?? "this user",
      });
      return;
    }

    // Already on another seat → quick error
    if (myCurrentSeatIndex !== null && myCurrentSeatIndex !== index) {
      toast.error(errorMessages.already_seated, {
        description: `Tap seat ${myCurrentSeatIndex + 1} to leave first.`,
        icon: <Lock className="w-4 h-4 text-destructive" />,
      });
      return;
    }

    await claimSeat(index);
  };

  const maxSeats = room?.max_seats ?? 8;
  const hostParticipant = participants?.find(
    (p) => p.user_id === room?.host_id && !p.left_at,
  );
  const hostHasOtherSeat =
    hostParticipant?.seat_index !== null &&
    hostParticipant?.seat_index !== undefined &&
    hostParticipant?.seat_index !== 0;
  const seats = Array.from({ length: maxSeats }, (_, i) => {
    let p = participants?.find((p) => p.seat_index === i && !p.left_at);
    // Show host on seat 0 only if host hasn't already taken a different seat
    if (i === 0 && !p && room?.host_id && !hostHasOtherSeat) {
      p = hostParticipant ?? (null as any);
    }
    if (!p) return null;
    const profile = p.profiles as any;
    return {
      name: profile?.display_name ?? profile?.username ?? "User",
      avatar: profile?.avatar_url,
      isSpeaking: p.mic_status === "unmuted",
      isMuted: p.mic_status === "muted",
      isHost: room?.host_id === p.user_id,
      frameUrl: null as string | null,
      userId: p.user_id,
    };
  });

  const activeListeners = participants?.filter((p) => !p.left_at)?.length ?? 0;
  const seatsFilled = participants?.filter((p) => !p.left_at && p.seat_index !== null && p.seat_index !== undefined).length ?? 0;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: `url(${room?.background_url ?? roomBgCastle})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Background dim overlay */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-background/70 via-background/30 to-background/80" />

      {/* Entrance Animation Overlay */}
      <RoomEntrance />

      {/* Gift Animation Overlay */}
      <GiftAnimation animation={giftAnim} />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-3 pt-3 pb-2">
        {/* Left: Room info */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative">
            <FramedAvatar src={room?.cover_image} name={room?.room_name} size="sm" />
            {room?.is_live && (
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-live rounded-full border-2 border-background animate-pulse" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display font-bold text-xs text-foreground truncate">
              {room?.room_name ?? "Loading..."}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] text-muted-foreground">ID: {id?.slice(0, 8)}</span>
              <span className="text-[9px] text-muted-foreground">•</span>
              <Users className="w-2.5 h-2.5 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">{activeListeners}</span>
              <span className="text-[9px] text-muted-foreground">•</span>
              <Armchair className="w-2.5 h-2.5 text-emerald-400" />
              <span className="text-[9px] font-semibold text-emerald-400">{seatsFilled}/{maxSeats}</span>
              {room?.country && (
                <>
                  <span className="text-[9px] text-muted-foreground">•</span>
                  <span className="text-[9px]">{room.country}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Action icons */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => setMusicOn(!musicOn)} className={`p-2 rounded-full ${musicOn ? "text-primary" : "text-muted-foreground"}`}>
            <Music className="w-4 h-4" />
          </button>
          <button onClick={handleShare} className="p-2 text-muted-foreground">
            <Share2 className="w-4 h-4" />
          </button>
          <button onClick={() => setShowMembers(!showMembers)} className="p-2 text-muted-foreground">
            <Users className="w-4 h-4" />
          </button>
          <button onClick={handleLeave} className="p-2 text-destructive">
            <DoorOpen className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ranking pill row */}
      <div className="relative z-10 px-3 mb-1 flex items-center gap-2">
        <button className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-500/30 to-rose-700/30 ring-1 ring-rose-400/40 flex items-center justify-center">
          <Megaphone className="w-3.5 h-3.5 text-rose-300" />
        </button>
        <div className="flex-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md ring-1 ring-white/10">
          <Trophy className="w-3.5 h-3.5 text-amber-300" />
          <span className="text-[10px] font-semibold text-foreground/80">No ranking yet</span>
        </div>
        <button className="relative w-8 h-8 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-700/30 ring-1 ring-amber-400/40 flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-amber-200" />
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-gradient-to-br from-orange-500 to-rose-600 text-[9px] font-bold text-white flex items-center justify-center ring-1 ring-background">
            {activeListeners}
          </span>
        </button>
      </div>

      {/* PK Battle overlay */}
      <PKBattle open={showPK} onClose={() => setShowPK(false)} />

      {/* Seats Grid */}
      <div className="flex-1 relative z-10 px-3 py-2 min-h-0">
        <div className="grid grid-cols-4 gap-y-4 gap-x-2 justify-items-center max-w-sm mx-auto">
        {seats.map((seat, i) => (
          <VoiceSeat
            key={i}
            index={i}
            isMySeat={myCurrentSeatIndex === i}
            alreadySeatedElsewhere={myCurrentSeatIndex !== null && myCurrentSeatIndex !== i}
            user={seat ? {
              name: seat.name,
              avatar: seat.avatar ?? undefined,
              isSpeaking: seat.isSpeaking,
              isMuted: seat.isMuted,
              isHost: seat.isHost,
              frameUrl: seat.frameUrl,
            } : undefined}
            onTap={() => handleSeatTap(i)}
          />
        ))}
        </div>
      </div>

      {/* Members Panel */}
      <AnimatePresence>
        {showMembers && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-y-0 right-0 w-72 z-50 bg-card border-l border-border shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-sm text-foreground">Members ({activeListeners})</h3>
              <button onClick={() => setShowMembers(false)} className="text-muted-foreground">✕</button>
            </div>
            <div className="p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-60px)]">
              {participants?.filter(p => !p.left_at).map(p => {
                const prof = p.profiles as any;
                return (
                  <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20">
                    <FramedAvatar src={prof?.avatar_url} name={prof?.display_name} size="xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{prof?.display_name ?? prof?.username ?? "User"}</p>
                      <p className="text-[9px] text-muted-foreground">
                        {p.user_id === room?.host_id ? "👑 Host" : p.seat_index !== null ? `🎤 Seat ${p.seat_index + 1}` : "👀 Listener"}
                      </p>
                    </div>
                    {p.mic_status === "unmuted" && <Volume2 className="w-3 h-3 text-primary" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              { icon: Settings, label: "Change Background", action: async () => {
                const url = prompt("Enter background image URL:");
                if (url && id) {
                  await supabase.from("voice_rooms").update({ background_url: url }).eq("id", id);
                  toast.success("Background updated!");
                  setShowHostMenu(false);
                }
              }},
              { icon: LogOut, label: "End Room", danger: true },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => item.action ? item.action() : setShowHostMenu(false)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  (item as any).danger ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-muted/30"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Panels */}
      <AnimatePresence>
        {activePanel === "chat" && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "35vh" }}
            exit={{ height: 0 }}
            className="relative z-10 bg-card/95 backdrop-blur-xl border-t border-border/50 overflow-hidden"
          >
            <RoomChat roomId={id!} />
          </motion.div>
        )}
        {activePanel === "gifts" && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "35vh" }}
            exit={{ height: 0 }}
            className="relative z-10 bg-card/95 backdrop-blur-xl border-t border-border/50 overflow-hidden"
          >
            <GiftPanel roomId={id!} hostId={room?.host_id} onClose={() => { setActivePanel(null); setShowGiftSheet(true); }} />
          </motion.div>
        )}
        {activePanel === "rankings" && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "40vh" }}
            exit={{ height: 0 }}
            className="relative z-10 bg-card/95 backdrop-blur-xl border-t border-border/50 overflow-hidden"
          >
            <RoomRankings roomId={id!} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Games Popup */}
      <RoomGamesPopup open={showGames} onClose={() => setShowGames(false)} />

      {/* Gift Bottom Sheet (full) */}
      <GiftBottomSheet open={showGiftSheet} onClose={() => setShowGiftSheet(false)} roomId={id!} hostId={room?.host_id} />

      {/* Bottom Controls Bar */}
      <div className="relative z-10 bg-card/95 backdrop-blur-xl border-t border-border/50 px-2 py-2 safe-bottom">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {/* Chat */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => togglePanel("chat")}
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl min-w-[44px] ${activePanel === "chat" ? "text-primary" : "text-muted-foreground"}`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-[8px] font-bold">Chat</span>
          </motion.button>

          {/* Mic (center, larger) */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={handleToggleMic}
            className={`p-3.5 rounded-full ${isMuted ? "bg-muted/50 text-muted-foreground" : "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30"}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </motion.button>

          {/* Emoji */}
          <motion.button whileTap={{ scale: 0.9 }} className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl min-w-[44px] text-muted-foreground">
            <Smile className="w-5 h-5" />
            <span className="text-[8px] font-bold">Emoji</span>
          </motion.button>

          {/* Gift */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => togglePanel("gifts")}
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl min-w-[44px] ${activePanel === "gifts" ? "text-accent" : "text-accent/70"}`}
          >
            <Gift className="w-5 h-5" />
            <span className="text-[8px] font-bold">Gift</span>
          </motion.button>

          {/* Games */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowGames(true)}
            className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl min-w-[44px] text-muted-foreground"
          >
            <Gamepad2 className="w-5 h-5" />
            <span className="text-[8px] font-bold">Game</span>
          </motion.button>

          {/* Rankings */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => togglePanel("rankings")}
            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl min-w-[44px] ${activePanel === "rankings" ? "text-accent" : "text-muted-foreground"}`}
          >
            <Trophy className="w-5 h-5" />
            <span className="text-[8px] font-bold">Rank</span>
          </motion.button>

          {/* Settings (host only) or Hand raise */}
          {isHost ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowHostMenu(!showHostMenu)}
              className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl min-w-[44px] text-muted-foreground"
            >
              <Settings className="w-5 h-5" />
              <span className="text-[8px] font-bold">More</span>
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.9 }} onClick={handleRaiseHand}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl min-w-[44px] ${handRaised ? "text-accent" : "text-muted-foreground"}`}
            >
              <span className="text-lg">✋</span>
              <span className="text-[8px] font-bold">Hand</span>
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
