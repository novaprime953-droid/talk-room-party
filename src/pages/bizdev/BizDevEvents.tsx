import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const BizDevEvents = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: events, refetch } = useQuery({
    queryKey: ["bizdev-all-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("start_date", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });

  const createEvent = async () => {
    if (!title.trim() || !startDate || !endDate) { toast.error("Fill all fields"); return; }
    const { error } = await supabase.from("events").insert({
      title: title.trim(),
      created_by: user!.id,
      start_date: new Date(startDate).toISOString(),
      end_date: new Date(endDate).toISOString(),
      event_type: "general",
      status: "upcoming",
    });
    if (error) toast.error(error.message);
    else { toast.success("Event created!"); setTitle(""); setStartDate(""); setEndDate(""); refetch(); }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Event Management</h1>

      <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Create Event
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <Input placeholder="Event title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button onClick={createEvent} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
          Create Event
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow-card divide-y divide-border/30">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-semibold text-foreground">All Events ({events?.length ?? 0})</h3>
        </div>
        {events?.map((e) => (
          <div key={e.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{e.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {e.event_type} • {new Date(e.start_date).toLocaleDateString()} → {new Date(e.end_date).toLocaleDateString()}
              </p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              e.status === "active" ? "bg-online/10 text-online"
                : e.status === "upcoming" ? "bg-primary/10 text-primary"
                : "bg-muted/30 text-muted-foreground"
            }`}>{e.status}</span>
          </div>
        ))}
        {(!events || events.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No events yet</p>
        )}
      </div>
    </div>
  );
};

export default BizDevEvents;
