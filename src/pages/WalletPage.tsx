import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Coins, ArrowUpRight, ArrowDownLeft, CreditCard, Wallet, Send, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const paymentMethods = ["PayPal", "Bank Transfer", "Crypto (USDT)", "Mobile Money"];

const WalletPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const [showRecharge, setShowRecharge] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeMethod, setRechargeMethod] = useState("PayPal");
  const [rechargeRef, setRechargeRef] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("PayPal");
  const [withdrawDetails, setWithdrawDetails] = useState("");

  const { data: transactions } = useQuery({
    queryKey: ["coin-transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("coin_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: pendingRecharges } = useQuery({
    queryKey: ["my-recharges", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("recharge_requests").select("*").eq("user_id", user!.id).eq("status", "pending");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: pendingWithdrawals } = useQuery({
    queryKey: ["my-withdrawals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("withdrawal_requests").select("*").eq("user_id", user!.id).eq("status", "pending");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Coin packages
  const coinPackages = [
    { amount: 1, coins: 100, label: "$1" },
    { amount: 5, coins: 550, label: "$5", badge: "+10%" },
    { amount: 10, coins: 1200, label: "$10", badge: "+20%" },
    { amount: 25, coins: 3250, label: "$25", badge: "+30%" },
    { amount: 50, coins: 7000, label: "$50", badge: "+40%" },
    { amount: 100, coins: 15000, label: "$100", badge: "+50%" },
  ];

  const submitRecharge = async () => {
    const amount = parseFloat(rechargeAmount);
    if (!amount || amount < 1) { toast.error("Minimum $1"); return; }
    const coins = Math.floor(amount * 100);
    const { error } = await supabase.from("recharge_requests").insert({
      user_id: user!.id,
      amount,
      coins_amount: coins,
      payment_method: rechargeMethod,
      payment_reference: rechargeRef.trim() || null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Recharge request submitted! Awaiting approval."); setShowRecharge(false); setRechargeAmount(""); setRechargeRef(""); }
  };

  const submitWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 1) { toast.error("Minimum $1"); return; }
    const { error } = await supabase.from("withdrawal_requests").insert({
      user_id: user!.id,
      amount,
      payment_method: withdrawMethod,
      payment_details: withdrawDetails ? { account: withdrawDetails } : null,
    });
    if (error) toast.error(error.message);
    else { toast.success("Withdrawal request submitted! Awaiting approval."); setShowWithdraw(false); setWithdrawAmount(""); setWithdrawDetails(""); }
  };

  const selectPackage = (pkg: typeof coinPackages[0]) => {
    setRechargeAmount(String(pkg.amount));
    setShowRecharge(true);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-xl text-foreground">My Wallet</h1>
        </div>

        {/* Balance Card */}
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="gradient-primary rounded-2xl p-6 glow-primary mb-6">
          <p className="text-xs text-primary-foreground/70 mb-1">Available Balance</p>
          <div className="flex items-center gap-2 mb-4">
            <Coins className="w-8 h-8 text-accent" />
            <span className="text-3xl font-display font-bold text-primary-foreground">
              {profile?.coins_balance?.toLocaleString() ?? "0"}
            </span>
            <span className="text-sm text-primary-foreground/70">coins</span>
          </div>

          <div className="flex gap-3">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setShowRecharge(!showRecharge); setShowWithdraw(false); }}
              className="flex-1 bg-primary-foreground/20 backdrop-blur rounded-xl py-2.5 flex items-center justify-center gap-2">
              <CreditCard className="w-4 h-4 text-primary-foreground" />
              <span className="text-xs font-bold text-primary-foreground">Recharge</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setShowWithdraw(!showWithdraw); setShowRecharge(false); }}
              className="flex-1 bg-primary-foreground/10 backdrop-blur rounded-xl py-2.5 flex items-center justify-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-primary-foreground" />
              <span className="text-xs font-bold text-primary-foreground">Withdraw</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Pending Status */}
        {((pendingRecharges?.length ?? 0) > 0 || (pendingWithdrawals?.length ?? 0) > 0) && (
          <div className="bg-warning/10 border border-warning/30 rounded-2xl p-3 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-warning flex-shrink-0" />
            <p className="text-xs text-warning font-semibold">
              {(pendingRecharges?.length ?? 0) > 0 && `${pendingRecharges!.length} recharge pending`}
              {(pendingRecharges?.length ?? 0) > 0 && (pendingWithdrawals?.length ?? 0) > 0 && " • "}
              {(pendingWithdrawals?.length ?? 0) > 0 && `${pendingWithdrawals!.length} withdrawal pending`}
            </p>
          </div>
        )}

        {/* Recharge Form */}
        {showRecharge && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            className="bg-card rounded-2xl p-4 shadow-card mb-4 overflow-hidden">
            <h3 className="font-semibold text-foreground mb-3">Recharge Coins</h3>

            {/* Quick Packages */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {coinPackages.map((pkg) => (
                <motion.button key={pkg.amount} whileTap={{ scale: 0.95 }}
                  onClick={() => setRechargeAmount(String(pkg.amount))}
                  className={`relative rounded-xl p-3 text-center border transition-colors ${
                    rechargeAmount === String(pkg.amount)
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:bg-muted/10"
                  }`}>
                  {pkg.badge && <span className="absolute -top-1.5 -right-1 text-[8px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground font-bold">{pkg.badge}</span>}
                  <p className="text-lg font-bold text-foreground">{pkg.label}</p>
                  <p className="text-[10px] text-accent font-bold">{pkg.coins.toLocaleString()} coins</p>
                </motion.button>
              ))}
            </div>

            <div className="space-y-3">
              <Input type="number" placeholder="Custom amount ($)" min="1" value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value)} />
              <select value={rechargeMethod} onChange={(e) => setRechargeMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm">
                {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <Input placeholder="Payment reference / transaction ID" value={rechargeRef} onChange={(e) => setRechargeRef(e.target.value)} />
              {rechargeAmount && (
                <p className="text-xs text-muted-foreground">
                  You'll receive <span className="text-accent font-bold">{Math.floor(parseFloat(rechargeAmount || "0") * 100).toLocaleString()} coins</span>
                </p>
              )}
              <button onClick={submitRecharge} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                Submit Recharge Request
              </button>
            </div>
          </motion.div>
        )}

        {/* Withdraw Form */}
        {showWithdraw && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            className="bg-card rounded-2xl p-4 shadow-card mb-4 overflow-hidden">
            <h3 className="font-semibold text-foreground mb-3">Withdraw Earnings</h3>
            <div className="space-y-3">
              <Input type="number" placeholder="Amount ($)" min="1" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
              <select value={withdrawMethod} onChange={(e) => setWithdrawMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm">
                {paymentMethods.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <Input placeholder="Account details (email, wallet, bank info)" value={withdrawDetails} onChange={(e) => setWithdrawDetails(e.target.value)} />
              <button onClick={submitWithdraw} className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                Submit Withdrawal Request
              </button>
            </div>
          </motion.div>
        )}

        {/* Transaction History */}
        <h2 className="font-display font-bold text-sm text-foreground mb-3">Recent Transactions</h2>
        <div className="space-y-2">
          {transactions && transactions.length > 0 ? (
            transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-3 bg-card rounded-xl p-3 shadow-card">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  tx.amount > 0 ? "bg-online/10" : "bg-destructive/10"
                }`}>
                  {tx.amount > 0 ? (
                    <ArrowDownLeft className="w-5 h-5 text-online" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-destructive" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{tx.description ?? tx.type}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-sm font-bold ${tx.amount > 0 ? "text-online" : "text-destructive"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground text-sm py-8">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
