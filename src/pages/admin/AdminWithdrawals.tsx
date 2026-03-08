import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminWithdrawals = () => {
  const { data: requests, refetch } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("withdrawal_requests").update({
      status,
      processed_by: (await supabase.auth.getUser()).data.user!.id,
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Withdrawal ${status}`); refetch(); }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Withdrawal Requests</h1>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Method</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Date</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests?.map((r) => (
                <tr key={r.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{r.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 font-bold text-foreground">${Number(r.amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.payment_method}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      r.status === "approved" ? "bg-online/10 text-online"
                        : r.status === "pending" ? "bg-warning/10 text-warning"
                        : "bg-destructive/10 text-destructive"
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {r.status === "pending" && (
                      <div className="flex gap-1">
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateStatus(r.id, "approved")}
                          className="p-1.5 rounded-lg bg-online/10 text-online hover:bg-online/20">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </motion.button>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => updateStatus(r.id, "rejected")}
                          className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                          <XCircle className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!requests || requests.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No withdrawal requests</p>
        )}
      </div>
    </div>
  );
};

export default AdminWithdrawals;
