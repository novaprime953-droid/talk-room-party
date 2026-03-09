import { useReports } from "@/hooks/useAdmin";
import { useState } from "react";
import { FileText, CheckCircle, XCircle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminReports = () => {
  const [filter, setFilter] = useState<string>("pending");
  const { data: reports, refetch } = useReports(filter || undefined);

  const resolveReport = async (id: string, status: string) => {
    const { error } = await supabase.from("reports").update({
      status,
      resolved_by: (await supabase.auth.getUser()).data.user!.id,
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Report ${status}`); refetch(); }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Reports</h1>

      <div className="flex gap-2 mb-6">
        {["all", "pending", "resolved", "dismissed"].map((f) => (
          <motion.button
            key={f}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(f === "all" ? "" : f)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
              (f === "all" ? !filter : filter === f)
                ? "gradient-primary text-primary-foreground"
                : "bg-muted/40 text-muted-foreground"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </motion.button>
        ))}
      </div>

      <div className="space-y-3">
        {reports?.map((r: any) => (
          <div key={r.id} className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-sm text-foreground">{r.reason}</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  By @{r.reporter?.username ?? "unknown"} → @{r.reported?.username ?? "unknown"}
                </p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                r.status === "pending" ? "bg-warning/10 text-warning"
                  : r.status === "resolved" ? "bg-online/10 text-online"
                  : "bg-muted/30 text-muted-foreground"
              }`}>{r.status}</span>
            </div>
            {r.description && <p className="text-xs text-muted-foreground mb-3">{r.description}</p>}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString()}
              </span>
              {r.status === "pending" && (
                <div className="flex gap-1">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => resolveReport(r.id, "resolved")}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-online/10 text-online text-xs font-bold">
                    <CheckCircle className="w-3 h-3" /> Resolve
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => resolveReport(r.id, "dismissed")}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-muted/30 text-muted-foreground text-xs font-bold">
                    <XCircle className="w-3 h-3" /> Dismiss
                  </motion.button>
                </div>
              )}
            </div>
          </div>
        ))}
        {(!reports || reports.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No reports</p>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
