import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Plus, Gift, Coins, ImageIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";

const AdminEvents = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [eventType, setEventType] = useState("general");
  const [rewardCoins, setRewardCoins] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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
    const rewards = rewardCoins ? { coins: parseInt(rewardCoins), description: rewardDescription } : null;
    let banner_url: string | null = null;
    if (bannerFile) {
      setUploading(true);
      const ext = bannerFile.name.split(".").pop() ?? "jpg";
      const key = `events/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("post-media")
        .upload(key, bannerFile, { upsert: true, contentType: bannerFile.type });
      setUploading(false);
      if (upErr) { toast.error(upErr.message); return; }
      const { data: pub } = supabase.storage.from("post-media").getPublicUrl(key);
      banner_url = pub.publicUrl;
    }
    const { error } = await supabase.from("events").insert({
      title, description, start_date: startDate, end_date: endDate,
      created_by: user!.id, event_type: eventType, rewards: rewards as any,
      banner_url,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Event created");
      setShowCreate(false); setTitle(""); setDescription("");
      setRewardCoins(""); setRewardDescription(""); setBannerFile(null);
      refetch();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("events").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Status → ${status}`); refetch(); }
  };

  const eventTypes = ["general", "campaign", "special", "holiday", "competition"];

  const activeCount = events?.filter((e) => e.status === "active").length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Events</h1>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCreate(!showCreate)}
          className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
          <Plus className="w-4 h-4" /> New Event
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-lg font-bold text-foreground">{events?.length ?? 0}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-lg font-bold text-online">{activeCount}</p>
          <p className="text-[10px] text-muted-foreground">Active</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-lg font-bold text-accent">
            {events?.filter((e) => e.rewards).length ?? 0}
          </p>
          <p className="text-[10px] text-muted-foreground">With Rewards</p>
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="bg-card rounded-2xl p-5 shadow-card mb-6 space-y-3">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={2}
                className="w-full bg-muted/30 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none" />

              <div>
                <label className="text-[10px] text-muted-foreground font-bold block mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Banner Image (shown on event card)
                </label>
                <div className="flex items-center gap-2">
                  <input type="file" accept="image/*"
                    onChange={(e) => setBannerFile(e.target.files?.[0] ?? null)}
                    className="text-xs text-muted-foreground flex-1" />
                  {bannerFile && (
                    <img src={URL.createObjectURL(bannerFile)} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground font-bold block mb-1">Type</label>
                <div className="flex gap-2 flex-wrap">
                  {eventTypes.map((t) => (
                    <button key={t} onClick={() => setEventType(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${
                        eventType === t ? "gradient-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"
                      }`}>{t}</button>
                  ))}
                </div>
              </div>

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

              {/* Rewards Section */}
              <div className="border-t border-border/30 pt-3">
                <label className="text-[10px] text-muted-foreground font-bold block mb-2 flex items-center gap-1">
                  <Gift className="w-3 h-3" /> Rewards (Optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-accent" />
                    <input type="number" value={rewardCoins} onChange={(e) => setRewardCoins(e.target.value)}
                      placeholder="Coin reward" className="w-full bg-muted/30 rounded-lg px-2 py-1.5 text-sm text-foreground outline-none" />
                  </div>
                  <Input value={rewardDescription} onChange={(e) => setRewardDescription(e.target.value)} placeholder="Reward note" className="text-sm" />
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={createEvent} disabled={uploading}
                className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold w-full">
                {uploading ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</span> : "Create Event"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {events?.map((e) => (
          <div key={e.id} className="bg-card rounded-2xl p-4 shadow-card">
            {e.banner_url && (
              <div className="rounded-xl overflow-hidden mb-3 h-32">
                <img src={e.banner_url} alt={e.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-bold text-sm text-foreground">{e.title}</h3>
                <span className="text-[10px] text-muted-foreground capitalize">{e.event_type}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                e.status === "active" ? "bg-online/10 text-online" : e.status === "upcoming" ? "bg-info/10 text-info" : "bg-muted/30 text-muted-foreground"
              }`}>{e.status}</span>
            </div>
            {e.description && <p className="text-xs text-muted-foreground mb-2">{e.description}</p>}
            
            {e.rewards && (
              <div className="flex items-center gap-1 mb-2">
                <Gift className="w-3 h-3 text-accent" />
                <span className="text-[10px] text-accent font-bold">
                  {(e.rewards as any).coins?.toLocaleString()} coins reward
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Calendar className="w-3 h-3" />
                {new Date(e.start_date).toLocaleDateString()} — {new Date(e.end_date).toLocaleDateString()}
              </div>
              <div className="flex gap-1">
                {e.status === "upcoming" && (
                  <button onClick={() => updateStatus(e.id, "active")}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-online/10 text-online font-bold">Activate</button>
                )}
                {e.status === "active" && (
                  <button onClick={() => updateStatus(e.id, "ended")}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground font-bold">End</button>
                )}
              </div>
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
