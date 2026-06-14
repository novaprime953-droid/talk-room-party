import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Trophy, Coins, Users, Award, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const EventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<"events" | "competitions">("events");

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("start_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: competitions, isLoading: compLoading } = useQuery({
    queryKey: ["competitions-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .in("status", ["active", "upcoming", "completed"])
        .order("start_date", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: myEntries, refetch: refetchEntries } = useQuery({
    queryKey: ["my-competition-entries", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("competition_entries")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: entryCounts } = useQuery({
    queryKey: ["competition-entry-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("competition_entries").select("competition_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach((e) => { counts[e.competition_id] = (counts[e.competition_id] || 0) + 1; });
      return counts;
    },
  });

  const joinCompetition = async (compId: string) => {
    if (!user) return;
    const { error } = await supabase.from("competition_entries").insert({
      competition_id: compId,
      user_id: user.id,
    });
    if (error) {
      if (error.code === "23505") toast.info("Already joined!");
      else toast.error(error.message);
    } else {
      toast.success("Joined competition!");
      refetchEntries();
    }
  };

  const isJoined = (compId: string) => myEntries?.some((e) => e.competition_id === compId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "text-online bg-online/10";
      case "upcoming": return "text-info bg-info/10";
      case "completed": return "text-accent bg-accent/10";
      default: return "text-muted-foreground bg-muted/30";
    }
  };

  const isLoading = tab === "events" ? eventsLoading : compLoading;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <Trophy className="w-5 h-5 text-accent" /> Events & Competitions
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["events", "competitions"] as const).map((t) => (
            <motion.button key={t} whileTap={{ scale: 0.95 }} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                tab === t ? "gradient-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
              }`}>
              {t === "events" ? "Events" : "Competitions"}
            </motion.button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tab === "events" ? (
          /* Events Tab */
          events && events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <motion.div key={event.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="bg-card rounded-2xl p-4 shadow-card">
                  {event.banner_url && (
                    <div className="rounded-xl overflow-hidden mb-3 h-36 -mt-1">
                      <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" loading="lazy" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-display font-bold text-sm text-foreground flex-1 pr-2">{event.title}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(event.status)}`}>
                      {event.status.toUpperCase()}
                    </span>
                  </div>
                  {event.description && <p className="text-xs text-muted-foreground mb-3">{event.description}</p>}
                  {event.rewards && (
                    <div className="flex items-center gap-1 mb-2">
                      <Gift className="w-3 h-3 text-accent" />
                      <span className="text-[10px] text-accent font-bold">Rewards available</span>
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{new Date(event.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{new Date(event.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-12">No events yet</p>
          )
        ) : (
          /* Competitions Tab */
          competitions && competitions.length > 0 ? (
            <div className="space-y-3">
              {competitions.map((comp) => {
                const rewards: any[] = (comp.rewards as any) ?? [];
                const joined = isJoined(comp.id);
                const participants = entryCounts?.[comp.id] ?? 0;
                const myEntry = myEntries?.find((e) => e.competition_id === comp.id);

                return (
                  <motion.div key={comp.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    className="bg-card rounded-2xl p-4 shadow-card">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-sm text-foreground">{comp.title}</h3>
                        <p className="text-[10px] text-muted-foreground capitalize">{comp.competition_type} competition</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(comp.status)}`}>
                        {comp.status.toUpperCase()}
                      </span>
                    </div>

                    {comp.description && <p className="text-xs text-muted-foreground mb-3">{comp.description}</p>}

                    {/* Prizes */}
                    {rewards.length > 0 && (
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {rewards.slice(0, 3).map((r: any) => (
                          <div key={r.rank} className="bg-accent/5 rounded-xl px-2.5 py-1.5 flex items-center gap-1">
                            <span className="text-[10px] font-bold text-foreground">{r.label}</span>
                            <Coins className="w-3 h-3 text-accent" />
                            <span className="text-[10px] font-bold text-accent">{r.coins?.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-3 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(comp.start_date).toLocaleDateString()} → {new Date(comp.end_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {participants} joined
                      </span>
                    </div>

                    {/* My status */}
                    {joined && myEntry && (
                      <div className="bg-primary/5 rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
                        <span className="text-[10px] text-primary font-bold">Your Score</span>
                        <span className="text-sm font-bold text-primary">{Number(myEntry.score).toLocaleString()}</span>
                        {myEntry.rank && (
                          <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-bold">
                            Rank #{myEntry.rank}
                          </span>
                        )}
                        {myEntry.reward_claimed && (
                          <span className="text-[10px] bg-online/10 text-online px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Gift className="w-2.5 h-2.5" /> Reward claimed
                          </span>
                        )}
                      </div>
                    )}

                    {/* Join button */}
                    {comp.status === "active" && !joined && (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => joinCompetition(comp.id)}
                        className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold w-full">
                        <Award className="w-3.5 h-3.5 inline mr-1" /> Join Competition
                      </motion.button>
                    )}
                    {joined && (
                      <span className="text-[10px] text-online font-bold flex items-center gap-1">
                        <Award className="w-3 h-3" /> Participating
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground text-sm py-12">No competitions yet</p>
          )
        )}
      </div>
    </div>
  );
};

export default EventsPage;
