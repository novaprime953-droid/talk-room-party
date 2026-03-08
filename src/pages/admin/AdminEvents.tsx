import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

const AdminEvents = () => {
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: events, refetch } = useQuery({
    queryKey: ["admin-events"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").order("start_date", { ascending: false }).limit(30);
      if (error) throw error;
      return data;
    },
  });

  const createEvent = async () => {
    if (!title || !startDate || !endDate) { toast.error("Fill required fields"); return; }
    const { error } = await supabase.from("events").insert({
      title, description, start_date: startDate, end_date: endDate, created_by: user!.id,
    });
    if (error) toast.error(error.message);
    else { toast.success("Event created"); setShowCreate(false); setTitle(""); setDescription(""); refetch(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Events</h1>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCreate(!showCreate)}
          className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
          <Plus className="w-4 h-4" /> New Event
        </motion.button>
      </div>

      {showCreate && (
        <div className="bg-card rounded-2xl p-5 shadow-card mb-6 space-y-3">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title"
            className="w-full bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2}
            className="w-full bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground font-bold block mb-1">Start Date</label>
              <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-muted/30 rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-bold block mb-1">End Date</label>
              <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-muted/30 rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={createEvent}
            className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold">
            Create Event
          </motion.button>
        </div>
      )}

      <div className="space-y-3">
        {events?.map((e) => (
          <div key={e.id} className="bg-card rounded-2xl p-4 shadow-card">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-sm text-foreground">{e.title}</h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                e.status === "active" ? "bg-online/10 text-online" : e.status === "upcoming" ? "bg-info/10 text-info" : "bg-muted/30 text-muted-foreground"
              }`}>{e.status}</span>
            </div>
            {e.description && <p className="text-xs text-muted-foreground mb-2">{e.description}</p>}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(e.start_date).toLocaleDateString()} — {new Date(e.end_date).toLocaleDateString()}
            </div>
          </div>
        ))}
        {(!events || events.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No events</p>
        )}
      </div>
    </div>
  );
};

export default AdminEvents;
