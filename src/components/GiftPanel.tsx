import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { useGiftsCatalog, useSendGift } from "@/hooks/useGifts";
import { useProfile } from "@/hooks/useProfile";
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
  const { data: gifts } = useGiftsCatalog();
  const { data: profile } = useProfile();
  const sendGift = useSendGift();

  const handleSend = async (giftId: string, coinValue: number) => {
    if (!hostId) {
      toast.error("No host to send gift to");
      return;
    }
    if ((profile?.coins_balance ?? 0) < coinValue) {
      toast.error("Not enough coins");
      return;
    }
    try {
      await sendGift.mutateAsync({ receiverId: hostId, roomId, giftId });
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
