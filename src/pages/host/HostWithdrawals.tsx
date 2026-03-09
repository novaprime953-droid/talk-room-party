import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowUpRight, Coins, Plus } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const paymentMethods = ["Bank Transfer", "PayPal", "Crypto (USDT)", "Mobile Money"];

const HostWithdrawals = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const [details, setDetails] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["host-profile-balance", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("coins_balance").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: withdrawals } = useQuery({
    queryKey: ["host-withdrawals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const submitWithdrawal = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 1) { toast.error("Enter a valid amount"); return; }
    if (!details.trim()) { toast.error("Enter payment details"); return; }

    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user!.id,
      amount: amt,
      payment_method: method,
      payment_details: { account: details.trim() } as any,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Withdrawal request submitted!");
      setShowForm(false);
      setAmount("");
      setDetails("");
      qc.invalidateQueries({ queryKey: ["host-withdrawals"] });
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case "approved": return "bg-online/10 text-online";
      case "pending": return "bg-warning/10 text-warning";
      case "rejected": return "bg-destructive/10 text-destructive";
      default: return "bg-muted/30 text-muted-foreground";
    }
  };

  const pendingCount = withdrawals?.filter((w) => w.status === "pending").length ?? 0;
  const approvedTotal = withdrawals?.filter((w) => w.status === "approved").reduce((s, w) => s + Number(w.amount), 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
          <ArrowUpRight className="w-6 h-6 text-accent" /> Withdrawals
        </h1>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(!showForm)}
          className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
          <Plus className="w-4 h-4" /> New Request
        </motion.button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-lg font-bold text-foreground">{(profile?.coins_balance ?? 0).toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Available Coins</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-lg font-bold text-warning">{pendingCount}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-lg font-bold text-online">${approvedTotal.toFixed(2)}</p>
          <p className="text-[10px] text-muted-foreground">Total Withdrawn</p>
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="bg-card rounded-2xl p-5 shadow-card mb-6 space-y-3">
              <h3 className="font-bold text-sm text-foreground">Request Withdrawal</h3>
              <div>
                <label className="text-[10px] text-muted-foreground font-bold block mb-1">Amount ($)</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-bold block mb-1">Payment Method</label>
                <div className="flex gap-2 flex-wrap">
                  {paymentMethods.map((m) => (
                    <button key={m} onClick={() => setMethod(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        method === m ? "gradient-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
                      }`}>{m}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground font-bold block mb-1">Account Details</label>
                <Input value={details} onChange={(e) => setDetails(e.target.value)} placeholder="e.g. Bank account number, PayPal email" />
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={submitWithdrawal}
                className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold w-full">
                Submit Request
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      <div className="bg-card rounded-2xl shadow-card">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-bold text-sm text-foreground">Withdrawal History</h3>
        </div>
        <div className="divide-y divide-border/30">
          {withdrawals?.map((w) => (
            <div key={w.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">${Number(w.amount).toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">{w.payment_method} • {new Date(w.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusStyle(w.status)}`}>
                {w.status}
              </span>
            </div>
          ))}
          {(!withdrawals || withdrawals.length === 0) && (
            <EmptyState icon={ArrowUpRight} title="No Data Available" subtitle="Withdrawal records will appear here once requests are submitted" />
          )}
        </div>
      </div>
    </div>
  );
};

export default HostWithdrawals;
