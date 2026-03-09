import { motion } from "framer-motion";
import { Calendar, Clock, Gift, Award, Users, Coins } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";

const EventsTab = () => {
  const { user } = useAuth();

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["events-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .in("status", ["active", "upcoming"])
        .order("start_date", { ascending: true })
        .limit(20);
      if (error) throw error;
      return data;
    },
  });

  const { data: competitions, isLoading: compLoading } = useQuery({
    queryKey: ["competitions-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("competitions")
        .select("*")
        .in("status", ["active", "upcoming"])
        .order("start_date", { ascending: true })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const { data: myEntries, refetch: refetchEntries } = useQuery({
    queryKey: ["my-entries-home", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("competition_entries")
        .select("competition_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const joinComp = async (compId: string) => {
    if (!user) return;
    const { error } = await supabase.from("competition_entries").insert({
      competition_id: compId, user_id: user.id,
    });
    if (error) {
      if (error.code === "23505") toast.info("Already joined!");
      else toast.error(error.message);
    } else {
      toast.success("Joined!");
      refetchEntries();
    }
  };

  const isJoined = (id: string) => myEntries?.some(e => e.competition_id === id);
  const isLoading = eventsLoading || compLoading;

  const getStatusColor = (status: string) => {
    if (status === "active") return "text-online bg-online/10";
    if (status === "upcoming") return "text-info bg-info/10";
    return "text-muted-foreground bg-muted/30";
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  const hasContent = (events && events.length > 0) || (competitions && competitions.length > 0);

  if (!hasContent) {
    return <EmptyState title="No Events" subtitle="Events and competitions will appear here" />;
  }

  return (
    <div className="space-y-4">
      {/* Events */}
      {events && events.length > 0 && (
        <section>
          <h3 className="font-display font-bold text-foreground text-base mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-accent" /> Events
          </h3>
          <div className="space-y-3">
            {events.map(event => (
              <motion.div key={event.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="bg-card rounded-2xl overflow-hidden shadow-card">
                {event.banner_url && (
                  <img src={event.banner_url} alt={event.title} className="w-full h-28 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-display font-bold text-sm text-foreground flex-1 pr-2">{event.title}</h4>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(event.status)}`}>
                      {event.status.toUpperCase()}
                    </span>
                  </div>
                  {event.description && <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{event.description}</p>}
                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(event.start_date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(event.end_date).toLocaleDateString()}</span>
                  </div>
                  {event.rewards && (
                    <div className="flex items-center gap-1 mt-2">
                      <Gift className="w-3 h-3 text-accent" />
                      <span className="text-[10px] text-accent font-bold">Rewards available</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Competitions */}
      {competitions && competitions.length > 0 && (
        <section>
          <h3 className="font-display font-bold text-foreground text-base mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" /> Competitions
          </h3>
          <div className="space-y-3">
            {competitions.map(comp => {
              const joined = isJoined(comp.id);
              const rewards: any[] = (comp.rewards as any) ?? [];
              return (
                <motion.div key={comp.id} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  className="bg-card rounded-2xl p-4 shadow-card">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-display font-bold text-sm text-foreground flex-1">{comp.title}</h4>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${getStatusColor(comp.status)}`}>
                      {comp.status.toUpperCase()}
                    </span>
                  </div>
                  {comp.description && <p className="text-[11px] text-muted-foreground mb-2 line-clamp-2">{comp.description}</p>}
                  {rewards.length > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                      {rewards.slice(0, 3).map((r: any, i: number) => (
                        <div key={i} className="bg-accent/5 rounded-xl px-2 py-1 flex items-center gap-1">
                          <Coins className="w-3 h-3 text-accent" />
                          <span className="text-[9px] font-bold text-accent">{r.coins?.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(comp.start_date).toLocaleDateString()}
                    </span>
                    {comp.status === "active" && !joined ? (
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => joinComp(comp.id)}
                        className="gradient-primary text-primary-foreground px-3 py-1.5 rounded-full text-[10px] font-bold">
                        Join
                      </motion.button>
                    ) : joined ? (
                      <span className="text-[10px] text-online font-bold">✓ Joined</span>
                    ) : null}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default EventsTab;
