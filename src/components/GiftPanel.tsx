import { useState } from "react";
import { motion } from "framer-motion";
import { Coins, ChevronDown, Check } from "lucide-react";
import { useGiftsCatalog, useSendGift } from "@/hooks/useGifts";
import { useProfile } from "@/hooks/useProfile";
import { useRoomParticipants } from "@/hooks/useRooms";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface GiftPanelProps {
  roomId: string;
  hostId?: string;
  onClose: () => void;
}

const giftEmojis: Record<string, string> = {
  standard: "🎁",
  premium: "💎",
  luxury: "👑",
  special: "🌟",
};

const GiftPanel = ({ roomId, hostId, onClose }: GiftPanelProps) => {
  const { user } = useAuth();
  const { data: gifts } = useGiftsCatalog();
  const { data: profile } = useProfile();
  const { data: participants } = useRoomParticipants(roomId);
  const sendGift = useSendGift();
  const [selectedReceiver, setSelectedReceiver] = useState<string | null>(hostId ?? null);
  const [showReceiverList, setShowReceiverList] = useState(false);

  const activeParticipants = participants?.filter(p => !p.left_at) ?? [];

  const getReceiverName = () => {
    if (!selectedReceiver) return "Select receiver";
    if (selectedReceiver === user?.id) return "🎁 Myself";
    const p = activeParticipants.find(p => p.user_id === selectedReceiver);
    const prof = p?.profiles as any;
    return prof?.display_name ?? prof?.username ?? "User";
  };

  const handleSend = async (giftId: string, coinValue: number) => {
    if (!selectedReceiver) {
      toast.error("Select a receiver first");
      return;
    }
    if ((profile?.coins_balance ?? 0) < coinValue) {
      toast.error("Not enough coins");
      return;
    }
    try {
      await sendGift.mutateAsync({ receiverId: selectedReceiver, roomId, giftId });
      toast.success("Gift sent! 🎉");
    } catch (err: any) {
      toast.error(err.message || "Failed to send gift");
    }
  };

  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm text-foreground">Send Gift</h3>
        <div className="flex items-center gap-1">
          <Coins className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-bold text-accent">
            {profile?.coins_balance?.toLocaleString() ?? "0"}
          </span>
        </div>
      </div>

      {/* Receiver selector */}
      <div className="relative mb-3">
        <button
          onClick={() => setShowReceiverList(!showReceiverList)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-muted/30 border border-border/50 text-xs"
        >
          <span className="text-foreground font-semibold">{getReceiverName()}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
        {showReceiverList && (
          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-40 overflow-y-auto">
            {/* Self option */}
            {user && (
              <button
                onClick={() => { setSelectedReceiver(user.id); setShowReceiverList(false); }}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/20 text-left text-xs"
              >
                <span className="text-foreground">🎁 Send to Myself</span>
                {selectedReceiver === user.id && <Check className="w-3 h-3 text-primary" />}
              </button>
            )}
            {activeParticipants.filter(p => p.user_id !== user?.id).map(p => {
              const prof = p.profiles as any;
              const name = prof?.display_name ?? prof?.username ?? "User";
              const isHost = p.user_id === hostId;
              return (
                <button
                  key={p.user_id}
                  onClick={() => { setSelectedReceiver(p.user_id); setShowReceiverList(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/20 text-left text-xs"
                >
                  <span className="text-foreground">
                    {isHost ? "👑 " : ""}{name}
                  </span>
                  {selectedReceiver === p.user_id && <Check className="w-3 h-3 text-primary" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-4 gap-3">
          {gifts?.map((gift) => (
            <motion.button
              key={gift.id}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleSend(gift.id, gift.coin_value)}
              disabled={sendGift.isPending}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <span className="text-2xl">
                {gift.icon_url || giftEmojis[gift.category] || "🎁"}
              </span>
              <span className="text-[10px] font-semibold text-foreground truncate w-full text-center">
                {gift.gift_name}
              </span>
              <div className="flex items-center gap-0.5">
                <Coins className="w-2.5 h-2.5 text-accent" />
                <span className="text-[10px] font-bold text-accent">{gift.coin_value}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GiftPanel;
