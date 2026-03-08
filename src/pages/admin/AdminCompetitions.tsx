import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Trophy, Plus, Gift, Users, Award, ChevronDown, ChevronUp, Coins, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Reward {
  rank: number;
  coins: number;
  label: string;
}

const competitionTypes = [
  { value: "gifting", label: "Top Gifters", metric: "coins_spent" },
  { value: "hosting", label: "Top Hosts", metric: "hours_hosted" },
  { value: "earning", label: "Top Earners", metric: "coins_earned" },
  { value: "engagement", label: "Most Active", metric: "messages_sent" },
];

const AdminCompetitions = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [compType, setCompType] = useState("gifting");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rewards, setRewards] = useState<Reward[]>([
    { rank: 1, coins: 5000, label: "🥇 1st Place" },
    { rank: 2, coins: 3000, label: "🥈 2nd Place" },
    { rank: 3, coins: 1000, label: "🥉 3rd Place" },
  ]);

  const { data: competitions } = useQuery({
    queryKey: ["admin-competitions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: entriesMap } = useQuery({
    queryKey: ["admin-competition-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competition_entries")
        .select("*, profiles:user_id(username, display_name, avatar_url)")
        .order("score", { ascending: false });
      if (error) throw error;
      const map: Record<string, any[]> = {};
      data?.forEach((e: any) => {
        if (!map[e.competition_id]) map[e.competition_id] = [];
        map[e.competition_id].push(e);
      });
      return map;
    },
  });

  const createCompetition = async () => {
    if (!title || !startDate || !endDate) {
      toast.error("Fill title, start & end dates");
      return;
    }
    const typeInfo = competitionTypes.find((t) => t.value === compType)!;
    const { error } = await supabase.from("competitions").insert({
      title,
      description: description || null,
      competition_type: compType,
      metric: typeInfo.metric,
      start_date: startDate,
      end_date: endDate,
      created_by: user!.id,
      rewards: rewards as any,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Competition created!");
      setShowCreate(false);
      setTitle("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["admin-competitions"] });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("competitions").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Status → ${status}`);
      qc.invalidateQueries({ queryKey: ["admin-competitions"] });
    }
  };

  const distributeRewards = async (comp: any) => {
    const entries = entriesMap?.[comp.id];
    if (!entries?.length) { toast.error("No participants"); return; }
    const rewardsList: Reward[] = comp.rewards || [];
    let distributed = 0;
    for (const reward of rewardsList) {
      const entry = entries.find((e: any) => e.rank === reward.rank);
      if (entry && !entry.reward_claimed && reward.coins > 0) {
        // Credit coins
        await supabase.rpc("owner_send_coins", {
          p_owner_id: user!.id,
          p_target_id: entry.user_id,
          p_amount: reward.coins,
          p_description: `Competition reward: ${comp.title} - Rank #${reward.rank}`,
        });
        await supabase.from("competition_entries").update({ reward_claimed: true, reward_amount: reward.coins }).eq("id", entry.id);
        distributed++;
      }
    }
    if (distributed > 0) {
      toast.success(`Distributed rewards to ${distributed} winners!`);
      qc.invalidateQueries({ queryKey: ["admin-competition-entries"] });
    } else {
      toast.info("No unclaimed rewards to distribute");
    }
  };

  const updateRank = async (entryId: string, rank: number) => {
    const { error } = await supabase.from("competition_entries").update({ rank }).eq("id", entryId);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-competition-entries"] });
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case "active": return "bg-online/10 text-online";
      case "upcoming": return "bg-info/10 text-info";
      case "completed": return "bg-accent/10 text-accent";
      default: return "bg-muted/30 text-muted-foreground";
    }
  };

  const activeCount = competitions?.filter((c) => c.status === "active").length ?? 0;
  const totalParticipants = Object.values(entriesMap ?? {}).flat().length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-accent" /> Competitions
        </h1>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCreate(!showCreate)}
          className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
          <Plus className="w-4 h-4" /> New Competition
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total", value: competitions?.length ?? 0, icon: Trophy },
          { label: "Active", value: activeCount, icon: Award },
          { label: "Participants", value: totalParticipants, icon: Users },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-3 shadow-card text-center">
            <s.icon className="w-4 h-4 text-accent mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="bg-card rounded-2xl p-5 shadow-card mb-6 space-y-3">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4 text-primary" /> Create Competition
              </h3>
              <Input placeholder="Competition title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
              
              <div>
                <label className="text-[10px] text-muted-foreground font-bold block mb-1">Type</label>
                <div className="flex gap-2 flex-wrap">
                  {competitionTypes.map((t) => (
                    <button key={t.value} onClick={() => setCompType(t.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        compType === t.value ? "gradient-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
                      }`}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold block mb-1">Start</label>
                  <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-muted/30 rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-bold block mb-1">End</label>
                  <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-muted/30 rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
                </div>
              </div>

              {/* Rewards config */}
              <div>
                <label className="text-[10px] text-muted-foreground font-bold block mb-2">Rewards</label>
                <div className="space-y-2">
                  {rewards.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground w-20">{r.label}</span>
                      <div className="flex items-center gap-1 flex-1">
                        <Coins className="w-3.5 h-3.5 text-accent" />
                        <input type="number" value={r.coins}
                          onChange={(e) => {
                            const newR = [...rewards];
                            newR[i].coins = parseInt(e.target.value) || 0;
                            setRewards(newR);
                          }}
                          className="w-full bg-muted/30 rounded-lg px-2 py-1.5 text-sm text-foreground outline-none" />
                      </div>
                    </div>
                  ))}
                  {rewards.length < 10 && (
                    <button onClick={() => setRewards([...rewards, { rank: rewards.length + 1, coins: 500, label: `#${rewards.length + 1}` }])}
                      className="text-xs text-primary font-bold">+ Add Rank</button>
                  )}
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={createCompetition}
                className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold w-full">
                Create Competition
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Competition List */}
      <div className="space-y-3">
        {competitions?.map((comp) => {
          const entries = entriesMap?.[comp.id] ?? [];
          const isExpanded = expanded === comp.id;
          const compRewards: Reward[] = (comp.rewards as any) ?? [];

          return (
            <div key={comp.id} className="bg-card rounded-2xl shadow-card overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-bold text-sm text-foreground">{comp.title}</h3>
                    <p className="text-[10px] text-muted-foreground capitalize">{comp.competition_type} • {comp.metric}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getStatusStyle(comp.status)}`}>
                    {comp.status}
                  </span>
                </div>

                {comp.description && <p className="text-xs text-muted-foreground mb-2">{comp.description}</p>}

                <div className="flex items-center gap-4 mb-3 text-[10px] text-muted-foreground">
                  <span>{new Date(comp.start_date).toLocaleDateString()} → {new Date(comp.end_date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{entries.length}</span>
                </div>

                {/* Rewards summary */}
                {compRewards.length > 0 && (
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {compRewards.slice(0, 3).map((r: Reward) => (
                      <span key={r.rank} className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Coins className="w-2.5 h-2.5" /> {r.label}: {r.coins.toLocaleString()}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {comp.status === "upcoming" && (
                    <button onClick={() => updateStatus(comp.id, "active")}
                      className="text-[10px] px-3 py-1 rounded-full bg-online/10 text-online font-bold">Start</button>
                  )}
                  {comp.status === "active" && (
                    <button onClick={() => updateStatus(comp.id, "completed")}
                      className="text-[10px] px-3 py-1 rounded-full bg-accent/10 text-accent font-bold">End</button>
                  )}
                  {comp.status === "completed" && (
                    <button onClick={() => distributeRewards(comp)}
                      className="text-[10px] px-3 py-1 rounded-full bg-primary/10 text-primary font-bold flex items-center gap-1">
                      <Gift className="w-3 h-3" /> Distribute Rewards
                    </button>
                  )}
                  <button onClick={() => setExpanded(isExpanded ? null : comp.id)}
                    className="text-[10px] px-3 py-1 rounded-full bg-muted/40 text-muted-foreground font-bold flex items-center gap-1">
                    Rankings {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Rankings panel */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="border-t border-border/30 px-4 py-3">
                      {entries.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">No participants yet</p>
                      ) : (
                        <div className="space-y-2">
                          {entries.map((entry: any, i: number) => (
                            <div key={entry.id} className="flex items-center gap-3">
                              <div className="flex items-center gap-1 w-12">
                                {entry.rank && entry.rank <= 3 ? (
                                  <Crown className={`w-4 h-4 ${entry.rank === 1 ? "text-accent" : entry.rank === 2 ? "text-muted-foreground" : "text-orange-400"}`} />
                                ) : (
                                  <span className="text-xs text-muted-foreground font-bold">#{entry.rank ?? "-"}</span>
                                )}
                                <input type="number" value={entry.rank ?? ""} min={1}
                                  onChange={(e) => updateRank(entry.id, parseInt(e.target.value))}
                                  className="w-8 bg-muted/30 rounded text-xs text-center py-0.5 outline-none text-foreground" />
                              </div>
                              <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                                {entry.profiles?.avatar_url ? (
                                  <img src={entry.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-[10px] font-bold">{(entry.profiles?.display_name ?? "U").charAt(0)}</span>
                                )}
                              </div>
                              <span className="text-xs font-semibold text-foreground flex-1">
                                {entry.profiles?.display_name ?? entry.profiles?.username ?? "User"}
                              </span>
                              <span className="text-xs font-bold text-accent">{Number(entry.score).toLocaleString()}</span>
                              {entry.reward_claimed && (
                                <span className="text-[10px] bg-online/10 text-online px-1.5 py-0.5 rounded-full font-bold">Paid</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
        {(!competitions || competitions.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No competitions yet</p>
        )}
      </div>
    </div>
  );
};

export default AdminCompetitions;
