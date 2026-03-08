import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Handshake } from "lucide-react";

const BizDevPartnerships = () => {
  const { data: agencies } = useQuery({
    queryKey: ["bizdev-agencies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agencies").select("*").order("total_earnings", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-2">Partnerships</h1>
      <p className="text-sm text-muted-foreground mb-6">Overview of agency partners and their performance.</p>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Agency</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Commission</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Earnings</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {agencies?.map((a) => (
                <tr key={a.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-foreground">{a.agency_name}</p>
                    <p className="text-[10px] text-muted-foreground">{a.description ?? "No description"}</p>
                  </td>
                  <td className="px-4 py-3 text-foreground">{Number(a.commission_rate)}%</td>
                  <td className="px-4 py-3 text-accent font-bold">${Number(a.total_earnings).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      a.status === "approved" ? "bg-online/10 text-online"
                        : a.status === "pending" ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                    }`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!agencies || agencies.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No agency partners yet</p>
        )}
      </div>
    </div>
  );
};

export default BizDevPartnerships;
