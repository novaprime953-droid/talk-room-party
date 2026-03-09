import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Coins, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import EmptyState from "@/components/EmptyState";

const HostGifts = () => {
  const { user } = useAuth();

  const { data: giftTransactions } = useQuery({
    queryKey: ["host-gift-transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_transactions")
        .select("*, gifts(gift_name, icon_url, coin_value, category), sender:sender_id(username, display_name, avatar_url)")
        .eq("receiver_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const totalCoins = giftTransactions?.reduce((s, g) => s + g.coins_spent, 0) ?? 0;
  const totalGifts = giftTransactions?.length ?? 0;
  const uniqueSenders = new Set(giftTransactions?.map((g) => g.sender_id)).size;

  // Top gifts
  const giftCounts: Record<string, { name: string; icon: string | null; count: number; coins: number }> = {};
  giftTransactions?.forEach((g: any) => {
    const name = g.gifts?.gift_name ?? "Unknown";
    if (!giftCounts[name]) giftCounts[name] = { name, icon: g.gifts?.icon_url, count: 0, coins: 0 };
    giftCounts[name].count += g.quantity;
    giftCounts[name].coins += g.coins_spent;
  });
  const topGifts = Object.values(giftCounts).sort((a, b) => b.coins - a.coins).slice(0, 5);

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
        <Gift className="w-6 h-6 text-accent" /> Gifts Received
      </h1>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Gifts", value: totalGifts },
          { label: "Coins Earned", value: totalCoins.toLocaleString() },
          { label: "Unique Fans", value: uniqueSenders },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-3 shadow-card text-center">
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Top Gifts */}
      {topGifts.length > 0 && (
        <div className="bg-card rounded-2xl shadow-card mb-6">
          <div className="px-4 py-3 border-b border-border/50">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Top Gifts
            </h3>
          </div>
          <div className="divide-y divide-border/30">
            {topGifts.map((g) => (
              <div key={g.name} className="px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  {g.icon ? <img src={g.icon} alt="" className="w-6 h-6 object-contain" /> : <Gift className="w-5 h-5 text-accent" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{g.name}</p>
                  <p className="text-[10px] text-muted-foreground">{g.count}x received</p>
                </div>
                <span className="text-sm font-bold text-accent flex items-center gap-1">
                  <Coins className="w-3 h-3" /> {g.coins.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gift History */}
      <div className="bg-card rounded-2xl shadow-card">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-bold text-sm text-foreground">Gift History</h3>
        </div>
        <div className="divide-y divide-border/30">
          {giftTransactions?.map((g: any) => (
            <div key={g.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                {g.sender?.avatar_url ? (
                  <img src={g.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">{(g.sender?.display_name ?? "U").charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {g.sender?.display_name ?? g.sender?.username ?? "Anonymous"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {g.gifts?.gift_name} {g.quantity > 1 ? `x${g.quantity}` : ""} • {new Date(g.created_at).toLocaleString()}
                </p>
              </div>
              <span className="text-xs font-bold text-accent">{g.coins_spent}</span>
            </div>
          ))}
          {(!giftTransactions || giftTransactions.length === 0) && (
            <EmptyState icon={Gift} title="No Data Available" subtitle="Gift records will appear here once you receive gifts" />
          )}
        </div>
      </div>
    </div>
  );
};

export default HostGifts;
