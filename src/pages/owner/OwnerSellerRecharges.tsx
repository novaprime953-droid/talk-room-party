import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Coins, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import EmptyState from "@/components/EmptyState";

const OwnerSellerRecharges = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: requests } = useQuery({
    queryKey: ["owner-seller-recharge-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_recharge_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;

      // Fetch seller profiles
      const sellerIds = [...new Set(data.map((r: any) => r.seller_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, username, display_name, avatar_url, coins_balance")
        .in("user_id", sellerIds);

      return data.map((r: any) => ({
        ...r,
        seller: profiles?.find((p) => p.user_id === r.seller_id),
      }));
    },
  });

  const processRequest = async (id: string, sellerId: string, coinsAmount: number, action: "approved" | "rejected") => {
    if (action === "approved") {
      // Send coins to seller via owner_send_coins
      const { error: rpcError } = await supabase.rpc("owner_send_coins", {
        p_owner_id: user!.id,
        p_target_id: sellerId,
        p_amount: coinsAmount,
        p_description: "Seller wallet recharge (approved by owner)",
      });
      if (rpcError) { toast.error(rpcError.message); return; }
    }

    const { error } = await supabase
      .from("seller_recharge_requests")
      .update({ status: action, processed_by: user!.id, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) toast.error(error.message);
    else {
      toast.success(action === "approved" ? `Approved! ${coinsAmount.toLocaleString()} coins sent to seller` : "Request rejected");
      qc.invalidateQueries({ queryKey: ["owner-seller-recharge-requests"] });
    }
  };

  const pendingCount = requests?.filter((r: any) => r.status === "pending").length ?? 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Coins className="w-6 h-6 text-warning" />
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Seller Recharge Requests</h1>
          <p className="text-xs text-muted-foreground">Approve or reject coin seller wallet recharge requests</p>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <Clock className="w-5 h-5 text-warning" />
          <span className="text-sm font-bold text-warning">{pendingCount} pending request{pendingCount > 1 ? "s" : ""} awaiting approval</span>
        </div>
      )}

      <div className="space-y-3">
        {requests?.map((r: any) => (
          <div key={r.id} className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {r.seller?.avatar_url ? (
                    <img src={r.seller.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold">{(r.seller?.display_name ?? "S")[0]}</span>
                  )}
                </div>
                <div>
                  <p className="font-bold text-foreground">{r.seller?.display_name ?? r.seller?.username ?? "Seller"}</p>
                  <p className="text-[10px] text-muted-foreground">Current balance: {r.seller?.coins_balance?.toLocaleString() ?? 0} coins</p>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                r.status === "pending" ? "bg-warning/10 text-warning"
                  : r.status === "approved" ? "bg-online/10 text-online"
                  : "bg-destructive/10 text-destructive"
              }`}>{r.status}</span>
            </div>

            <div className="bg-muted/10 rounded-xl p-3 mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Requested Amount</span>
                <span className="text-lg font-bold text-accent">{r.coins_amount.toLocaleString()} coins</span>
              </div>
              {r.note && (
                <p className="text-xs text-muted-foreground mt-1">Note: {r.note}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
              {r.status === "pending" && (
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => processRequest(r.id, r.seller_id, r.coins_amount, "approved")}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-online/10 text-online text-xs font-bold hover:bg-online/20">
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }}
                    onClick={() => processRequest(r.id, r.seller_id, r.coins_amount, "rejected")}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-bold hover:bg-destructive/20">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        ))}
        {(!requests || requests.length === 0) && (
          <EmptyState icon={Coins} title="No Data Available" subtitle="Seller recharge requests will appear here once submitted" />
        )}
      </div>
    </div>
  );
};

export default OwnerSellerRecharges;
