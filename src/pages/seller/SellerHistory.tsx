import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { History, Coins, Search, Download } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";

const SellerHistory = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: transactions } = useQuery({
    queryKey: ["seller-all-transactions", typeFilter],
    queryFn: async () => {
      let q = supabase
        .from("coin_transactions")
        .select("*, profiles:user_id(username, display_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (typeFilter !== "all") q = q.eq("type", typeFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const filteredTransactions = search.length >= 2
    ? transactions?.filter((t: any) =>
        (t.profiles?.username?.toLowerCase().includes(search.toLowerCase())) ||
        (t.profiles?.display_name?.toLowerCase().includes(search.toLowerCase())) ||
        (t.description?.toLowerCase().includes(search.toLowerCase()))
      )
    : transactions;

  const types = ["all", "recharge", "seller_transfer", "gift_sent", "gift_received", "owner_gift"];

  const exportCSV = () => {
    if (!filteredTransactions?.length) return;
    const rows = filteredTransactions.map((t: any) =>
      `${t.profiles?.display_name ?? t.profiles?.username ?? "User"},${t.type},${t.amount},${t.description ?? ""},${new Date(t.created_at).toISOString()}`
    );
    const csv = `User,Type,Amount,Description,Date\n${rows.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Exported!");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
          <History className="w-6 h-6 text-accent" /> Transaction History
        </h1>
        <motion.button whileTap={{ scale: 0.95 }} onClick={exportCSV}
          className="bg-muted/40 text-muted-foreground px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1">
          <Download className="w-3 h-3" /> Export CSV
        </motion.button>
      </div>

      {/* Filters */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user or description..." className="pl-9" />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {types.map((t) => (
          <button key={t} onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold capitalize ${
              typeFilter === t ? "gradient-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
            }`}>{t.replace("_", " ")}</button>
        ))}
      </div>

      <div className="bg-card rounded-2xl shadow-card">
        <div className="divide-y divide-border/30">
          {filteredTransactions?.map((t: any) => (
            <div key={t.id} className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                {t.profiles?.avatar_url ? (
                  <img src={t.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">{(t.profiles?.display_name ?? "U").charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {t.profiles?.display_name ?? t.profiles?.username ?? "User"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {t.description ?? t.type} • {new Date(t.created_at).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span className={`text-sm font-bold ${t.amount > 0 ? "text-online" : "text-destructive"}`}>
                  {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
                </span>
                <p className="text-[9px] text-muted-foreground capitalize">{t.type.replace("_", " ")}</p>
              </div>
            </div>
          ))}
          {(!filteredTransactions || filteredTransactions.length === 0) && (
            <p className="text-center text-muted-foreground text-sm py-8">No transactions found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerHistory;
