import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Send, Coins, Search, UserCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import EmptyState from "@/components/EmptyState";

const SellerSendCoins = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  const { data: searchResults } = useQuery({
    queryKey: ["seller-search-users", search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, coins_balance, level")
        .or(`username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2,
  });

  const { data: recentSends } = useQuery({
    queryKey: ["seller-recent-sends"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_transactions")
        .select("*, profiles:user_id(username, display_name, avatar_url)")
        .eq("type", "seller_transfer")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const sendCoins = async () => {
    if (!selectedUser) { toast.error("Select a user"); return; }
    const amt = parseInt(amount);
    if (!amt || amt < 1) { toast.error("Enter a valid amount"); return; }

    const { data, error } = await supabase.rpc("seller_send_coins", {
      p_seller_id: user!.id,
      p_target_id: selectedUser.user_id,
      p_amount: amt,
      p_description: description.trim() || "Coins purchase",
    });

    if (error) toast.error(error.message);
    else {
      toast.success(`Sent ${amt.toLocaleString()} coins to ${selectedUser.display_name ?? selectedUser.username}!`);
      setSelectedUser(null);
      setAmount("");
      setDescription("");
      setSearch("");
      qc.invalidateQueries({ queryKey: ["seller-recent-sends"] });
    }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
        <Send className="w-6 h-6 text-accent" /> Send Coins
      </h1>

      {/* Send Form */}
      <div className="bg-card rounded-2xl p-5 shadow-card mb-6 space-y-4">
        {/* User Search */}
        <div>
          <label className="text-[10px] text-muted-foreground font-bold block mb-1">Find User</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setSelectedUser(null); }}
              placeholder="Search by username, name, or email" className="pl-9" />
          </div>
          {searchResults && searchResults.length > 0 && !selectedUser && (
            <div className="mt-2 bg-muted/20 rounded-xl overflow-hidden border border-border/30">
              {searchResults.map((u) => (
                <button key={u.user_id} onClick={() => { setSelectedUser(u); setSearch(u.display_name ?? u.username ?? ""); }}
                  className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                    {u.avatar_url ? (
                      <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{(u.display_name ?? u.username ?? "U").charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{u.display_name ?? u.username}</p>
                    <p className="text-[10px] text-muted-foreground">@{u.username} • Lv.{u.level} • {u.coins_balance.toLocaleString()} coins</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected User */}
        {selectedUser && (
          <div className="bg-primary/5 rounded-xl p-3 flex items-center gap-3">
            <UserCheck className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{selectedUser.display_name ?? selectedUser.username}</p>
              <p className="text-[10px] text-muted-foreground">Current balance: {selectedUser.coins_balance.toLocaleString()} coins</p>
            </div>
            <button onClick={() => { setSelectedUser(null); setSearch(""); }}
              className="text-xs text-muted-foreground hover:text-foreground">Change</button>
          </div>
        )}

        {/* Amount */}
        <div>
          <label className="text-[10px] text-muted-foreground font-bold block mb-1">Amount</label>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-accent" />
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter coin amount" />
          </div>
          {/* Quick amounts */}
          <div className="flex gap-2 mt-2 flex-wrap">
            {[100, 500, 1000, 5000, 10000, 50000].map((a) => (
              <button key={a} onClick={() => setAmount(String(a))}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  amount === String(a) ? "gradient-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
                }`}>{a.toLocaleString()}</button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] text-muted-foreground font-bold block mb-1">Note (optional)</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Payment via PayPal" />
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={sendCoins}
          disabled={!selectedUser || !amount}
          className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold w-full disabled:opacity-50 flex items-center justify-center gap-2">
          <Send className="w-4 h-4" /> Send Coins
        </motion.button>
      </div>

      {/* Recent Sends */}
      <div className="bg-card rounded-2xl shadow-card">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-bold text-sm text-foreground">Recent Transfers</h3>
        </div>
        <div className="divide-y divide-border/30">
          {recentSends?.map((t: any) => (
            <div key={t.id} className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                  {t.profiles?.avatar_url ? (
                    <img src={t.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs font-bold">{(t.profiles?.display_name ?? "U").charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">{t.profiles?.display_name ?? t.profiles?.username ?? "User"}</p>
                  <p className="text-[10px] text-muted-foreground">{t.description} • {new Date(t.created_at).toLocaleString()}</p>
                </div>
              </div>
              <span className="text-sm font-bold text-online">+{t.amount.toLocaleString()}</span>
            </div>
          ))}
          {(!recentSends || recentSends.length === 0) && (
            <p className="text-center text-muted-foreground text-sm py-8">No transfers yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerSendCoins;
