import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CreditCard, Check, X, Coins, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import EmptyState from "@/components/EmptyState";

const SellerRecharges = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");

  const { data: requests } = useQuery({
    queryKey: ["seller-recharge-requests", filter],
    queryFn: async () => {
      let q = supabase
        .from("recharge_requests")
        .select("*, profiles:user_id(username, display_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const processRequest = async (id: string, _userId: string, _coinsAmount: number, status: "approved" | "rejected") => {
    if (status === "approved") {
      const { error } = await supabase.rpc("approve_recharge", { p_request_id: id });
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.rpc("reject_recharge", { p_request_id: id });
      if (error) { toast.error(error.message); return; }
    }
    toast.success(`Request ${status}`);
    qc.invalidateQueries({ queryKey: ["seller-recharge-requests"] });
  };

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
      <h1 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
        <CreditCard className="w-6 h-6 text-accent" /> Recharge Requests
      </h1>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <motion.button key={f} whileTap={{ scale: 0.95 }} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize ${
              filter === f ? "gradient-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
            }`}>{f} {f === "pending" && requests && filter === "pending" ? `(${requests.length})` : ""}</motion.button>
        ))}
      </div>

      <div className="space-y-3">
        {requests?.map((r: any) => (
          <div key={r.id} className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                  {r.profiles?.avatar_url ? (
                    <img src={r.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold">{(r.profiles?.display_name ?? "U").charAt(0)}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{r.profiles?.display_name ?? r.profiles?.username ?? "User"}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusStyle(r.status)}`}>{r.status}</span>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="bg-muted/20 rounded-xl p-2 text-center">
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="text-sm font-bold text-foreground">${Number(r.amount).toFixed(2)}</p>
              </div>
              <div className="bg-muted/20 rounded-xl p-2 text-center">
                <p className="text-xs text-muted-foreground">Coins</p>
                <p className="text-sm font-bold text-accent">{r.coins_amount.toLocaleString()}</p>
              </div>
              <div className="bg-muted/20 rounded-xl p-2 text-center">
                <p className="text-xs text-muted-foreground">Method</p>
                <p className="text-sm font-bold text-foreground">{r.payment_method}</p>
              </div>
            </div>

            {r.payment_reference && (
              <p className="text-[10px] text-muted-foreground mb-3">Ref: {r.payment_reference}</p>
            )}

            {r.status === "pending" && (
              <div className="flex gap-2">
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => processRequest(r.id, r.user_id, r.coins_amount, "approved")}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-online/10 text-online text-xs font-bold hover:bg-online/20 transition-colors">
                  <Check className="w-3.5 h-3.5" /> Approve
                </motion.button>
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => processRequest(r.id, r.user_id, r.coins_amount, "rejected")}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20 transition-colors">
                  <X className="w-3.5 h-3.5" /> Reject
                </motion.button>
              </div>
            )}
          </div>
        ))}
        {(!requests || requests.length === 0) && (
          <EmptyState icon={CreditCard} title="No Data Available" subtitle="Recharge requests will appear here once users submit them" />
        )}
      </div>
    </div>
  );
};

export default SellerRecharges;
