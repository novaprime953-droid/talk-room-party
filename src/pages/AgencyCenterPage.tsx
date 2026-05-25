import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Users, Plus, LogIn, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRoles } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import planet from "@/assets/empty-planet.png";

type Mode = "menu" | "join" | "create";

const AgencyCenterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: roles } = useUserRoles();
  const [mode, setMode] = useState<Mode>("menu");
  const [agencyCode, setAgencyCode] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [agencyDesc, setAgencyDesc] = useState("");
  const [busy, setBusy] = useState(false);

  // Auto-redirect if user already belongs somewhere
  const { data: myHost } = useQuery({
    queryKey: ["my-host", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("hosts").select("*").eq("user_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: myAgency } = useQuery({
    queryKey: ["my-agency-owner", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("agencies").select("*").eq("owner_id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const isAgencyOwner = roles?.includes("agency_owner") || !!myAgency;
  const isHost = roles?.includes("host") || !!myHost;

  const goHost = () => navigate("/host");
  const goAgency = () => navigate("/agency");

  const submitJoin = async () => {
    if (!agencyCode.trim()) { toast.error("Enter agency code or name"); return; }
    setBusy(true);
    const { data: agency } = await supabase
      .from("agencies")
      .select("id, agency_name, status")
      .or(`id.eq.${agencyCode.trim()},agency_name.ilike.%${agencyCode.trim()}%`)
      .eq("status", "approved")
      .maybeSingle();

    if (!agency) { toast.error("Agency not found or not approved"); setBusy(false); return; }
    const { error } = await supabase.from("hosts").insert({ user_id: user!.id, agency_id: agency.id, status: "pending" });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success(`Joined ${agency.agency_name}! Awaiting approval.`); navigate("/host"); }
  };

  const submitCreate = async () => {
    if (!agencyName.trim()) { toast.error("Enter agency name"); return; }
    setBusy(true);
    const { error } = await supabase.from("agencies").insert({
      owner_id: user!.id,
      agency_name: agencyName.trim(),
      description: agencyDesc.trim() || null,
      status: "pending",
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Agency created! Pending admin approval."); navigate("/agency"); }
  };

  return (
    <div className="min-h-screen bg-background pb-24 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 px-4 pt-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-xl text-foreground">Host & Agency Center</h1>
        </div>

        {/* Quick-jump cards if user already has a role */}
        {(isHost || isAgencyOwner) && mode === "menu" && (
          <div className="grid grid-cols-1 gap-3 mt-4">
            {isAgencyOwner && (
              <motion.button whileTap={{ scale: 0.98 }} onClick={goAgency}
                className="w-full text-left rounded-2xl p-4 gradient-primary text-primary-foreground shadow-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm">Open My Agency</p>
                  <p className="text-[11px] opacity-80">{myAgency?.agency_name ?? "Agency Panel"}</p>
                </div>
              </motion.button>
            )}
            {isHost && (
              <motion.button whileTap={{ scale: 0.98 }} onClick={goHost}
                className="w-full text-left rounded-2xl p-4 bg-card border border-border/50 shadow-card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-foreground">Open Host Center</p>
                  <p className="text-[11px] text-muted-foreground">View earnings & withdrawals</p>
                </div>
              </motion.button>
            )}
          </div>
        )}

        <AnimatePresence mode="wait">
          {mode === "menu" && (
            <motion.div key="menu" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center pt-8">
              <motion.img
                src={planet}
                alt="Empty state"
                width={220}
                height={220}
                loading="lazy"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-52 h-52 object-contain drop-shadow-2xl"
              />
              <p className="text-sm text-muted-foreground mt-4 mb-8">No agency yet — start your journey</p>

              <div className="w-full max-w-sm space-y-3">
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setMode("join")}
                  className="w-full gradient-primary text-primary-foreground rounded-2xl py-4 px-5 flex items-center gap-3 shadow-card glow-primary">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm">Join an Agency</p>
                    <p className="text-[11px] opacity-80">Become a host under an existing agency</p>
                  </div>
                </motion.button>

                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setMode("create")}
                  className="w-full bg-card border border-border/60 rounded-2xl py-4 px-5 flex items-center gap-3 shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm text-foreground">Create Your Own Agency</p>
                    <p className="text-[11px] text-muted-foreground">Apply to run your own agency</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {mode === "join" && (
            <motion.div key="join" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-card rounded-2xl p-5 mt-6 shadow-card max-w-md mx-auto">
              <h3 className="font-display font-bold text-lg text-foreground mb-1">Join an Agency</h3>
              <p className="text-xs text-muted-foreground mb-4">Enter the agency name or invite code you received.</p>
              <Input placeholder="Agency name or code" value={agencyCode} onChange={(e) => setAgencyCode(e.target.value)} className="mb-3" />
              <div className="flex gap-2">
                <button onClick={() => setMode("menu")} className="flex-1 py-2.5 rounded-xl bg-muted/40 text-foreground text-sm font-bold">Back</button>
                <button disabled={busy} onClick={submitJoin}
                  className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold disabled:opacity-60">
                  {busy ? "Joining…" : "Submit"}
                </button>
              </div>
            </motion.div>
          )}

          {mode === "create" && (
            <motion.div key="create" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-card rounded-2xl p-5 mt-6 shadow-card max-w-md mx-auto">
              <h3 className="font-display font-bold text-lg text-foreground mb-1">Create Your Agency</h3>
              <p className="text-xs text-muted-foreground mb-4">Your application will be reviewed by an admin.</p>
              <Input placeholder="Agency name" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} className="mb-3" />
              <Textarea placeholder="Tell us about your agency (optional)" value={agencyDesc} onChange={(e) => setAgencyDesc(e.target.value)} className="mb-3" rows={3} />
              <div className="flex gap-2">
                <button onClick={() => setMode("menu")} className="flex-1 py-2.5 rounded-xl bg-muted/40 text-foreground text-sm font-bold">Back</button>
                <button disabled={busy} onClick={submitCreate}
                  className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold disabled:opacity-60">
                  {busy ? "Submitting…" : "Apply"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AgencyCenterPage;