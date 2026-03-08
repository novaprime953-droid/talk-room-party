import { motion } from "framer-motion";
import { ArrowLeft, Coins, ArrowUpRight, ArrowDownLeft, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();

  const { data: transactions } = useQuery({
    queryKey: ["coin-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("coin_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-xl text-foreground">My Wallet</h1>
        </div>

        {/* Balance Card */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="gradient-primary rounded-2xl p-6 glow-primary mb-6"
        >
          <p className="text-xs text-primary-foreground/70 mb-1">Available Balance</p>
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-8 h-8 text-accent" />
            <span className="text-3xl font-display font-bold text-primary-foreground">
              {profile?.coins_balance?.toLocaleString() ?? "0"}
            </span>
            <span className="text-sm text-primary-foreground/70">coins</span>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-primary-foreground/20 backdrop-blur rounded-xl py-2.5 flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4 text-primary-foreground" />
              <span className="text-xs font-bold text-primary-foreground">Recharge</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-primary-foreground/10 backdrop-blur rounded-xl py-2.5 flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4 text-primary-foreground" />
              <span className="text-xs font-bold text-primary-foreground">Withdraw</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Transaction History */}
        <h2 className="font-display font-bold text-sm text-foreground mb-3">Recent Transactions</h2>
        <div className="space-y-2">
          {transactions && transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-card">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tx.amount > 0 ? "bg-online/10" : "bg-destructive/10"
                }`}>
                  {tx.amount > 0 ? (
                    <ArrowDownLeft className="w-5 h-5 text-online" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{tx.description ?? tx.type}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-sm font-bold ${tx.amount > 0 ? "text-online" : "text-destructive"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground text-sm py-8">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
