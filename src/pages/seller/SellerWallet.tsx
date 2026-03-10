import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, Coins, Send, TrendingUp, Clock, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { motion } from "framer-motion";
import EmptyState from "@/components/EmptyState";

const SellerWallet = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showRequest, setShowRequest] = useState(false);
  const [requestAmount, setRequestAmount] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["seller-profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("coins_balance")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: todayStats } = useQuery({
    queryKey: ["seller-wallet-today", user?.id],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("coin_transactions")
        .select("amount")
        .eq("user_id", user!.id)
        .eq("type", "seller_transfer_out")
        .gte("created_at", today.toISOString());
      if (error) throw error;
      const sent = data?.reduce((s, t) => s + Math.abs(t.amount), 0) ?? 0;
      return { sentToday: sent };
    },
    enabled: !!user,
  });

  const { data: totalSold } = useQuery({
    queryKey: ["seller-wallet-total", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coin_transactions")
        .select("amount")
        .eq("user_id", user!.id)
        .eq("type", "seller_transfer_out");
      if (error) throw error;
      return data?.reduce((s, t) => s + Math.abs(t.amount), 0) ?? 0;
    },
    enabled: !!user,
  });

  const { data: rechargeRequests } = useQuery({
    queryKey: ["seller-recharge-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_recharge_requests")
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitRechargeRequest = async () => {
    const amount = parseInt(requestAmount);
    if (!amount || amount < 100) {
      toast.error("Minimum request is 100 coins");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("seller_recharge_requests").insert({
      seller_id: user!.id,
      coins_amount: amount,
      note: requestNote.trim() || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Recharge request submitted! Owner will review it.");
      setRequestAmount("");
      setRequestNote("");
      setShowRequest(false);
      qc.invalidateQueries({ queryKey: ["seller-recharge-requests"] });
    }
    setSubmitting(false);
  };

  const stats = [
    { label: "Wallet Balance", value: (profile?.coins_balance ?? 0).toLocaleString(), icon: Wallet, color: "text-primary" },
    { label: "Sent Today", value: (todayStats?.sentToday ?? 0).toLocaleString(), icon: Send, color: "text-warning" },
    { label: "Total Sold", value: (totalSold ?? 0).toLocaleString(), icon: TrendingUp, color: "text-online" },
  ];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
        <Wallet className="w-6 h-6 text-primary" /> Seller Wallet
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }} className="bg-card rounded-2xl p-4 shadow-card">
            <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Low balance warning */}
      {(profile?.coins_balance ?? 0) < 100 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Coins className="w-5 h-5 text-destructive" />
          <div className="flex-1">
            <p className="text-sm font-bold text-destructive">Low Wallet Balance</p>
            <p className="text-xs text-destructive/70">Your wallet is running low. Request a recharge from the Owner.</p>
          </div>
        </div>
      )}

      {/* Request Recharge Button */}
      <motion.button whileTap={{ scale: 0.97 }}
        onClick={() => setShowRequest(!showRequest)}
        className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold w-full flex items-center justify-center gap-2 mb-6">
        <Plus className="w-4 h-4" /> Request Recharge from Owner
      </motion.button>

      {/* Recharge Form */}
      {showRequest && (
        <div className="bg-card rounded-2xl p-5 shadow-card mb-6 space-y-4">
          <h3 className="font-bold text-foreground flex items-center gap-2">
            <Coins className="w-5 h-5 text-accent" /> Recharge Request
          </h3>
          <div>
            <label className="text-[10px] text-muted-foreground font-bold block mb-1">Coins Amount</label>
            <Input type="number" placeholder="Min 100 coins" value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} />
            <div className="flex gap-2 mt-2 flex-wrap">
              {[1000, 5000, 10000, 50000, 100000].map((a) => (
                <button key={a} onClick={() => setRequestAmount(String(a))}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    requestAmount === String(a) ? "gradient-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
                  }`}>{a.toLocaleString()}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground font-bold block mb-1">Note / Message (optional)</label>
            <Textarea value={requestNote} onChange={(e) => setRequestNote(e.target.value)} placeholder="e.g. Need coins for upcoming sales" rows={2} />
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={submitRechargeRequest} disabled={submitting}
            className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold w-full disabled:opacity-50">
            {submitting ? "Submitting..." : "Submit Request"}
          </motion.button>
        </div>
      )}

      {/* Recharge Request History */}
      <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" /> Recharge History
      </h3>
      <div className="space-y-2">
        {rechargeRequests?.map((r: any) => (
          <div key={r.id} className="bg-card rounded-2xl p-4 shadow-card flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">{r.coins_amount.toLocaleString()} coins</p>
              {r.note && <p className="text-[10px] text-muted-foreground">{r.note}</p>}
              <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              r.status === "pending" ? "bg-warning/10 text-warning"
                : r.status === "approved" ? "bg-online/10 text-online"
                : "bg-destructive/10 text-destructive"
            }`}>{r.status}</span>
          </div>
        ))}
        {(!rechargeRequests || rechargeRequests.length === 0) && (
          <EmptyState icon={Clock} title="No Data Available" subtitle="Your recharge requests will appear here" />
        )}
      </div>
    </div>
  );
};

export default SellerWallet;
