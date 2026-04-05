import { motion } from "framer-motion";
import {
  ChevronLeft, Crown, Shield, Sparkles, Gift, Mic, ShoppingBag, Star,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { usePurchaseVIP } from "@/hooks/useProgression";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

const vipTiers = [
  { level: 1, cost: 1000, label: "VIP 1", benefits: ["Basic VIP Frame", "Name highlight"] },
  { level: 2, cost: 5000, label: "VIP 2", benefits: ["Animated Frame", "Chat badge"] },
  { level: 3, cost: 10000, label: "VIP 3", benefits: ["Entry effect", "Priority seat"] },
  { level: 4, cost: 25000, label: "VIP 4", benefits: ["Exclusive gifts", "Gift discount 5%"] },
  { level: 5, cost: 50000, label: "VIP 5", benefits: ["Premium entry animation", "Special mic badge"] },
  { level: 6, cost: 100000, label: "VIP 6", benefits: ["VIP-only props", "Gift discount 10%"] },
  { level: 7, cost: 200000, label: "VIP 7", benefits: ["Glowing name", "Exclusive vehicle"] },
  { level: 8, cost: 500000, label: "VIP 8", benefits: ["Custom entrance", "Gift discount 15%"] },
  { level: 9, cost: 1000000, label: "VIP 9", benefits: ["Elite frame set", "Room boost"] },
  { level: 10, cost: 2000000, label: "VIP 10", benefits: ["Full premium access", "All benefits unlocked"] },
];

const benefitIcons = [
  { icon: Shield, label: "VIP Frame", desc: "Exclusive animated profile frame" },
  { icon: Sparkles, label: "Entry Animation", desc: "Grand entrance effect in rooms" },
  { icon: Mic, label: "Priority Seat", desc: "Jump queue for mic seats" },
  { icon: Gift, label: "Gift Discount", desc: "Up to 15% off gift purchases" },
  { icon: ShoppingBag, label: "VIP Shop", desc: "Access exclusive VIP-only items" },
  { icon: Star, label: "Name Glow", desc: "Highlighted name in chat and rooms" },
];

const VIPPage = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const purchaseVIP = usePurchaseVIP();

  const currentVIP = profile?.vip_level ?? 0;
  const vipEnd = profile?.vip_end ? new Date(profile.vip_end) : null;
  const isActive = vipEnd ? vipEnd > new Date() : false;
  const daysLeft = vipEnd ? Math.max(0, Math.ceil((vipEnd.getTime() - Date.now()) / 86400000)) : 0;

  const handlePurchase = (tier: typeof vipTiers[0]) => {
    if ((profile?.coins_balance ?? 0) < tier.cost) {
      toast.error("Insufficient coins!");
      return;
    }
    purchaseVIP.mutate(
      { vipLevel: tier.level, cost: tier.cost },
      {
        onSuccess: () => toast.success(`VIP ${tier.level} activated! 🎉`),
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display font-bold text-lg text-foreground">VIP Center</h1>
      </div>

      {/* Current VIP Status */}
      <div className="mx-4 mt-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, hsl(30 80% 25%), hsl(45 100% 20%))" }}
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-amber-300/80 font-bold">Current Status</p>
                <p className="font-display font-bold text-3xl text-amber-300">
                  {currentVIP > 0 ? `VIP ${currentVIP}` : "No VIP"}
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-8 h-8 text-amber-300" />
              </div>
            </div>

            {isActive ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-amber-300/80">
                  <span>Active</span>
                  <span>{daysLeft} days remaining</span>
                </div>
                <Progress value={(daysLeft / 30) * 100} className="h-2 bg-amber-900/50" />
              </div>
            ) : (
              <p className="text-xs text-amber-300/60">
                {currentVIP > 0 ? "VIP expired. Renew to keep benefits!" : "Purchase VIP to unlock premium benefits"}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* VIP Benefits */}
      <div className="mx-4 mt-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          VIP Benefits
        </p>
        <div className="grid grid-cols-3 gap-2">
          {benefitIcons.map((b, i) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-border/50 bg-card p-3 flex flex-col items-center text-center gap-1.5"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <b.icon className="w-5 h-5 text-amber-400" />
              </div>
              <span className="text-[9px] font-bold text-foreground">{b.label}</span>
              <span className="text-[7px] text-muted-foreground leading-tight">{b.desc}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* VIP Tiers */}
      <div className="mx-4 mt-4">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          VIP Packages
        </p>
        <div className="space-y-2">
          {vipTiers.map((tier, i) => {
            const owned = currentVIP >= tier.level && isActive;
            return (
              <motion.div
                key={tier.level}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-2xl border p-4 flex items-center gap-3 ${
                  owned
                    ? "border-amber-500/30 bg-amber-500/5"
                    : "border-border/50 bg-card"
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                  owned ? "bg-amber-500/20" : "bg-muted/30"
                }`}>
                  <Crown className={`w-5 h-5 ${owned ? "text-amber-400" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground">{tier.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {tier.benefits.join(" • ")}
                  </p>
                </div>
                {owned ? (
                  <span className="text-[9px] font-bold text-amber-400">ACTIVE</span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handlePurchase(tier)}
                    disabled={purchaseVIP.isPending}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs"
                  >
                    {tier.cost.toLocaleString()} 🪙
                  </Button>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VIPPage;
