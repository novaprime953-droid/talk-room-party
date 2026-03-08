import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const SellerVerify = () => {
  const [search, setSearch] = useState("");

  const { data: recharges } = useQuery({
    queryKey: ["seller-verify-recharges", search],
    queryFn: async () => {
      let q = supabase
        .from("recharge_requests")
        .select("*, profiles:user_id(username, display_name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (search.length >= 2) {
        q = q.or(`payment_reference.ilike.%${search}%`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
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
      <h1 className="font-display font-bold text-2xl text-foreground mb-6 flex items-center gap-2">
        <ShieldCheck className="w-6 h-6 text-accent" /> Payment Verification
      </h1>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by payment reference..." className="pl-9" />
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">User</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Reference</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-muted-foreground">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Method</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Date</th>
            </tr>
          </thead>
          <tbody>
            {recharges?.map((r: any) => (
              <tr key={r.id} className="border-b border-border/30 last:border-0">
                <td className="px-4 py-3">
                  <span className="font-semibold text-foreground">{r.profiles?.display_name ?? r.profiles?.username ?? "User"}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-muted-foreground font-mono">{r.payment_reference ?? "—"}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div>
                    <p className="font-bold text-foreground">${Number(r.amount).toFixed(2)}</p>
                    <p className="text-[10px] text-accent">{r.coins_amount.toLocaleString()} coins</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-foreground">{r.payment_method}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusStyle(r.status)}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!recharges || recharges.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No records found</p>
        )}
      </div>
    </div>
  );
};

export default SellerVerify;
