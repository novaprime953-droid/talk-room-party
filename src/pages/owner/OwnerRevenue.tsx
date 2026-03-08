import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";

const OwnerRevenue = () => {
  const { data: recharges } = useQuery({
    queryKey: ["owner-recharges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("recharge_requests").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["owner-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawal_requests").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const approved = recharges?.filter((r) => r.status === "approved") ?? [];
  const totalIn = approved.reduce((s, r) => s + Number(r.amount), 0);
  const totalOut = withdrawals?.filter((w) => w.status === "approved").reduce((s, w) => s + Number(w.amount), 0) ?? 0;

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Revenue Reports</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2"><ArrowUpRight className="w-4 h-4 text-online" /><span className="text-xs text-muted-foreground">Total Recharges</span></div>
          <p className="text-2xl font-bold text-foreground">${totalIn.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2"><ArrowDownRight className="w-4 h-4 text-destructive" /><span className="text-xs text-muted-foreground">Total Withdrawals</span></div>
          <p className="text-2xl font-bold text-foreground">${totalOut.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-accent" /><span className="text-xs text-muted-foreground">Net Revenue</span></div>
          <p className="text-2xl font-bold text-foreground">${(totalIn - totalOut).toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/50"><h3 className="font-semibold text-foreground">Recent Recharges</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border/50">
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Coins</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Method</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Date</th>
            </tr></thead>
            <tbody>
              {recharges?.slice(0, 15).map((r) => (
                <tr key={r.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3 font-bold text-foreground">${Number(r.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-accent">{r.coins_amount}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.payment_method}</td>
                  <td className="px-4 py-3"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.status === "approved" ? "bg-online/10 text-online" : r.status === "pending" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OwnerRevenue;
