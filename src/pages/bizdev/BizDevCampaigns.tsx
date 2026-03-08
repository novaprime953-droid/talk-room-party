import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Target, Plus, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const BizDevCampaigns = () => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const { data: events, refetch } = useQuery({
    queryKey: ["bizdev-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase.from("events").select("*").eq("event_type", "campaign").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const launchCampaign = async () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    const { error } = await supabase.from("events").insert({
      title: title.trim(),
      description: description.trim() || null,
      event_type: "campaign",
      created_by: user!.id,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: "active",
    });
    if (error) toast.error(error.message);
    else { toast.success("Campaign launched!"); setTitle(""); setDescription(""); refetch(); }
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Marketing Campaigns</h1>

      <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Launch New Campaign
        </h3>
        <div className="space-y-3">
          <Input placeholder="Campaign title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button onClick={launchCampaign} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors">
            <Send className="w-4 h-4" /> Launch
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card divide-y divide-border/30">
        <div className="px-4 py-3 border-b border-border/50">
          <h3 className="font-semibold text-foreground">Active Campaigns ({events?.length ?? 0})</h3>
        </div>
        {events?.map((e) => (
          <div key={e.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{e.title}</p>
              <p className="text-[10px] text-muted-foreground">
                {new Date(e.start_date).toLocaleDateString()} → {new Date(e.end_date).toLocaleDateString()}
              </p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              e.status === "active" ? "bg-online/10 text-online" : "bg-muted/30 text-muted-foreground"
            }`}>{e.status}</span>
          </div>
        ))}
        {(!events || events.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No campaigns yet</p>
        )}
      </div>
    </div>
  );
};

export default BizDevCampaigns;
