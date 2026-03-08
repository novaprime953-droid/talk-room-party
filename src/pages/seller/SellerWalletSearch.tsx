import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserSearch, Coins, Clock, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const SellerWalletSearch = () => {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: searchResults } = useQuery({
    queryKey: ["seller-wallet-search", search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, coins_balance, level, phone, email, created_at")
        .or(`username.ilike.%${search}%,display_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: search.length >= 2,
  });

  const { data: rechargeHistory } = useQuery({
    queryKey: ["seller-wallet-recharges", selectedUser?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recharge_requests")
        .select("*")
        .eq("user_id", selectedUser.user_id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUser?.user_id,
  });

  const { data: lastTransaction } = useQuery({
    queryKey: ["seller-wallet-last-tx", selectedUser?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_transactions")
        .select("*")
        .eq("user_id", selectedUser.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!selectedUser?.user_id,
  });

  const getStatusStyle = (s: string) => {
    switch (s) {
      case "approved": return "bg-online/10 text-online";
      case "pending": return "bg-warning/10 text-warning";
      case "rejected": return "bg-destructive/10 text-destructive";
      default: return "bg-muted/30 text-muted-foreground";
    }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-2 flex items-center gap-2">
        <UserSearch className="w-6 h-6 text-accent" /> User Wallet Search
      </h1>
      <p className="text-xs text-muted-foreground mb-6">Search by User ID, username, email, or phone</p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setSelectedUser(null); }}
          placeholder="Search by username, email, phone..."
          className="pl-9"
        />
      </div>

      {/* Search Results */}
      {searchResults && searchResults.length > 0 && !selectedUser && (
        <div className="bg-card rounded-2xl shadow-card overflow-hidden mb-6">
          {searchResults.map((u) => (
            <button
              key={u.user_id}
              onClick={() => { setSelectedUser(u); setSearch(u.display_name ?? u.username ?? ""); }}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-muted/30 transition-colors text-left border-b border-border/30 last:border-0"
            >
              <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-foreground">{(u.display_name ?? u.username ?? "U").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">{u.display_name ?? u.username}</p>
                <p className="text-[10px] text-muted-foreground">@{u.username} • Lv.{u.level}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-accent">{u.coins_balance.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">coins</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected User Details */}
      {selectedUser && (
        <div className="space-y-4">
          {/* User Info Card */}
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl shadow-card p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-foreground">{(selectedUser.display_name ?? selectedUser.username ?? "U").charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-lg text-foreground">{selectedUser.display_name ?? selectedUser.username}</h3>
                <p className="text-xs text-muted-foreground">@{selectedUser.username} • Lv.{selectedUser.level}</p>
                {selectedUser.email && <p className="text-[10px] text-muted-foreground">{selectedUser.email}</p>}
                {selectedUser.phone && <p className="text-[10px] text-muted-foreground">{selectedUser.phone}</p>}
              </div>
              <button onClick={() => { setSelectedUser(null); setSearch(""); }}
                className="text-xs text-muted-foreground hover:text-foreground">Clear</button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/20 rounded-xl p-3 text-center">
                <Coins className="w-4 h-4 text-accent mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{selectedUser.coins_balance.toLocaleString()}</p>
                <p className="text-[9px] text-muted-foreground">Wallet Balance</p>
              </div>
              <div className="bg-muted/20 rounded-xl p-3 text-center">
                <Clock className="w-4 h-4 text-info mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{rechargeHistory?.length ?? 0}</p>
                <p className="text-[9px] text-muted-foreground">Recharges</p>
              </div>
              <div className="bg-muted/20 rounded-xl p-3 text-center">
                <TrendingUp className="w-4 h-4 text-online mx-auto mb-1" />
                <p className="text-xs font-bold text-foreground">
                  {lastTransaction ? new Date(lastTransaction.created_at).toLocaleDateString() : "N/A"}
                </p>
                <p className="text-[9px] text-muted-foreground">Last Transaction</p>
              </div>
            </div>
          </motion.div>

          {/* Last Transaction */}
          {lastTransaction && (
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
              className="bg-card rounded-2xl shadow-card p-4">
              <h4 className="font-bold text-sm text-foreground mb-3">Last Transaction</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted/20 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Amount</p>
                  <p className={`text-sm font-bold ${lastTransaction.amount > 0 ? "text-online" : "text-destructive"}`}>
                    {lastTransaction.amount > 0 ? "+" : ""}{lastTransaction.amount.toLocaleString()}
                  </p>
                </div>
                <div className="bg-muted/20 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Type</p>
                  <p className="text-sm font-bold text-foreground capitalize">{lastTransaction.type.replace("_", " ")}</p>
                </div>
                <div className="bg-muted/20 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Balance After</p>
                  <p className="text-sm font-bold text-foreground">{lastTransaction.balance_after.toLocaleString()}</p>
                </div>
                <div className="bg-muted/20 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-muted-foreground">Date</p>
                  <p className="text-sm font-bold text-foreground">{new Date(lastTransaction.created_at).toLocaleString()}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Recharge History */}
          <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
            className="bg-card rounded-2xl shadow-card">
            <div className="px-4 py-3 border-b border-border/50">
              <h4 className="font-bold text-sm text-foreground">Recharge History</h4>
            </div>
            <div className="divide-y divide-border/30">
              {rechargeHistory?.map((r) => (
                <div key={r.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-foreground">${Number(r.amount).toFixed(2)} → {r.coins_amount.toLocaleString()} coins</p>
                    <p className="text-[10px] text-muted-foreground">{r.payment_method} • {new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusStyle(r.status)}`}>{r.status}</span>
                </div>
              ))}
              {(!rechargeHistory || rechargeHistory.length === 0) && (
                <p className="text-center text-muted-foreground text-sm py-6">No recharge history</p>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {search.length >= 2 && searchResults?.length === 0 && !selectedUser && (
        <p className="text-center text-muted-foreground text-sm py-8">No users found for "{search}"</p>
      )}
    </div>
  );
};

export default SellerWalletSearch;
