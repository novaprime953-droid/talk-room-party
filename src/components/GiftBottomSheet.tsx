import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, X, Plus, ChevronDown, Check, Sparkles, ShoppingCart } from "lucide-react";
import { useGiftsCatalog, useSendGift } from "@/hooks/useGifts";
import { useProfile } from "@/hooks/useProfile";
import { useRoomParticipants } from "@/hooks/useRooms";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface GiftBottomSheetProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  hostId?: string;
}

const giftEmojis: Record<string, string> = {
  standard: "🎁",
  premium: "💎",
  luxury: "👑",
  special: "🌟",
};

const rechargePackages = [
  { coins: 60, price: "$0.99", popular: false },
  { coins: 300, price: "$4.99", popular: false },
  { coins: 600, price: "$9.99", popular: true },
  { coins: 1500, price: "$19.99", popular: false },
  { coins: 3000, price: "$49.99", popular: false },
  { coins: 6500, price: "$99.99", popular: false },
];

type Tab = "gifts" | "recharge";

const GiftBottomSheet = ({ open, onClose, roomId, hostId }: GiftBottomSheetProps) => {
  const { user } = useAuth();
  const { data: gifts } = useGiftsCatalog();
  const { data: profile } = useProfile();
  const { data: participants } = useRoomParticipants(roomId);
  const sendGift = useSendGift();
  const [selectedReceiver, setSelectedReceiver] = useState<string | null>(hostId ?? null);
  const [showReceiverList, setShowReceiverList] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("gifts");
  const [selectedGift, setSelectedGift] = useState<string | null>(null);
  const [sendingGift, setSendingGift] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const activeParticipants = participants?.filter((p) => !p.left_at) ?? [];

  const getReceiverName = () => {
    if (!selectedReceiver) return "Select receiver";
    const p = activeParticipants.find((p) => p.user_id === selectedReceiver);
    const prof = p?.profiles as any;
    return prof?.display_name ?? prof?.username ?? "User";
  };

  const handleSend = async (giftId: string, coinValue: number) => {
    if (!selectedReceiver) {
      toast.error("Select a receiver first");
      return;
    }
    if ((profile?.coins_balance ?? 0) < coinValue * quantity) {
      toast.error("Not enough coins");
      return;
    }
    setSendingGift(giftId);
    try {
      for (let i = 0; i < quantity; i++) {
        await sendGift.mutateAsync({ receiverId: selectedReceiver, roomId, giftId });
      }
      toast.success(`Gift sent x${quantity}! 🎉`);
      setSelectedGift(null);
      setQuantity(1);
    } catch (err: any) {
      toast.error(err.message || "Failed to send gift");
    } finally {
      setSendingGift(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl max-h-[75vh] flex flex-col safe-bottom"
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-2">
              <div className="flex items-center gap-3">
                <button onClick={onClose}>
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
                <div className="flex gap-1">
                  {(["gifts", "recharge"] as Tab[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        activeTab === tab
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted/30"
                      }`}
                    >
                      {tab === "gifts" ? "Gifts" : "Recharge"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Coin balance */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Coins className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-bold text-amber-400">
                  {profile?.coins_balance?.toLocaleString() ?? "0"}
                </span>
                <button className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center ml-1" onClick={() => setActiveTab("recharge")}>
                  <Plus className="w-3 h-3 text-amber-400" />
                </button>
              </div>
            </div>

            {activeTab === "gifts" ? (
              <div className="flex-1 overflow-hidden flex flex-col px-5 pb-4">
                {/* Receiver selector */}
                <div className="relative mb-3">
                  <button
                    onClick={() => setShowReceiverList(!showReceiverList)}
                    className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-muted/30 border border-border/50"
                  >
                    <span className="text-sm text-foreground font-semibold">{getReceiverName()}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {showReceiverList && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute top-full left-0 right-0 z-20 mt-1 bg-card border border-border rounded-xl shadow-2xl max-h-40 overflow-y-auto"
                    >
                      {activeParticipants.map((p) => {
                        const prof = p.profiles as any;
                        const name = prof?.display_name ?? prof?.username ?? "User";
                        const isHost = p.user_id === hostId;
                        return (
                          <button
                            key={p.user_id}
                            onClick={() => { setSelectedReceiver(p.user_id); setShowReceiverList(false); }}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 text-left text-sm"
                          >
                            <span className="text-foreground">{isHost ? "👑 " : ""}{name}</span>
                            {selectedReceiver === p.user_id && <Check className="w-4 h-4 text-primary" />}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </div>

                {/* Gift grid */}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-2">
                    {gifts?.map((gift) => {
                      const isSelected = selectedGift === gift.id;
                      const isSending = sendingGift === gift.id;
                      return (
                        <motion.button
                          key={gift.id}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => {
                            if (isSelected) {
                              handleSend(gift.id, gift.coin_value);
                            } else {
                              setSelectedGift(gift.id);
                            }
                          }}
                          className={`relative flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${
                            isSelected
                              ? "bg-primary/20 border-2 border-primary ring-2 ring-primary/20"
                              : "bg-muted/20 border-2 border-transparent hover:bg-muted/40"
                          }`}
                        >
                          {isSending && (
                            <motion.div
                              initial={{ scale: 1 }}
                              animate={{ scale: [1, 1.5, 0], y: [0, -30, -60], opacity: [1, 1, 0] }}
                              transition={{ duration: 0.6 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <Sparkles className="w-8 h-8 text-amber-400" />
                            </motion.div>
                          )}
                          <span className="text-2xl">{gift.icon_url || giftEmojis[gift.category] || "🎁"}</span>
                          <span className="text-[10px] font-semibold text-foreground truncate w-full text-center">{gift.gift_name}</span>
                          <div className="flex items-center gap-0.5">
                            <Coins className="w-2.5 h-2.5 text-amber-400" />
                            <span className="text-[10px] font-bold text-amber-400">{gift.coin_value}</span>
                          </div>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                            >
                              <span className="text-[8px] font-bold text-primary-foreground">TAP</span>
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Send bar */}
                {selectedGift && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="mt-3 flex items-center gap-3"
                  >
                    <div className="flex items-center gap-1 bg-muted/30 rounded-xl px-3 py-2">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-muted-foreground font-bold text-lg px-1">−</button>
                      <span className="text-sm font-bold text-foreground w-8 text-center">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="text-primary font-bold text-lg px-1">+</button>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        const gift = gifts?.find((g) => g.id === selectedGift);
                        if (gift) handleSend(gift.id, gift.coin_value);
                      }}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2"
                    >
                      Send 🎁
                    </motion.button>
                  </motion.div>
                )}
              </div>
            ) : (
              /* Recharge tab */
              <div className="flex-1 overflow-y-auto px-5 pb-4">
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {rechargePackages.map((pkg) => (
                    <motion.button
                      key={pkg.coins}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toast.info("Payment integration coming soon!")}
                      className="relative flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/20 border border-border/50 hover:border-primary/50 transition-all"
                    >
                      {pkg.popular && (
                        <div className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[8px] font-bold text-white">
                          BEST VALUE
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Coins className="w-5 h-5 text-amber-400" />
                        <span className="text-lg font-bold text-foreground">{pkg.coins.toLocaleString()}</span>
                      </div>
                      <span className="text-sm font-bold text-primary">{pkg.price}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GiftBottomSheet;