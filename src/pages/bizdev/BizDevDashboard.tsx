import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone, Calendar, DollarSign, TrendingUp } from "lucide-react";

const BizDevDashboard = () => {
  const { data: events } = useQuery({
    queryKey: ["bizdev-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: recharges } = useQuery({
    queryKey: ["bizdev-revenue"],
    queryFn: async () => {
      const { data, error } = await supabase.from("recharge_requests").select("amount, status").eq("status", "approved");
      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = recharges?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
  const activeEvents = events?.filter((e) => e.status === "active").length ?? 0;
  const upcomingEvents = events?.filter((e) => e.status === "upcoming").length ?? 0;

  const stats = [
    { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-accent" },
    { label: "Active Events", value: activeEvents, icon: Calendar, color: "text-primary" },
    { label: "Upcoming Events", value: upcomingEvents, icon: TrendingUp, color: "text-online" },
    { label: "Total Campaigns", value: events?.length ?? 0, icon: Megaphone, color: "text-warning" },
  ];

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Business Developer Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className={`w-4 h-4 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-4 shadow-card">
        <h3 className="font-semibold text-foreground mb-3">Recent Events</h3>
        {events && events.length > 0 ? (
          <div className="space-y-3">
            {events.slice(0, 5).map((e) => (
              <div key={e.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">{e.title}</p>
                  <p className="text-[10px] text-muted-foreground">{e.event_type} • {new Date(e.start_date).toLocaleDateString()}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  e.status === "active" ? "bg-online/10 text-online"
                    : e.status === "upcoming" ? "bg-primary/10 text-primary"
                    : "bg-muted/30 text-muted-foreground"
                }`}>{e.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No events yet.</p>
        )}
      </div>
    </div>
  );
};

export default BizDevDashboard;
