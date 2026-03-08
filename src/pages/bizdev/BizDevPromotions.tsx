import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Megaphone, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const BizDevPromotions = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: hosts } = useQuery({
    queryKey: ["bizdev-hosts-promo", search],
    queryFn: async () => {
      let q = supabase.from("hosts")
        .select("*, profiles!hosts_user_id_fkey(username, display_name, avatar_url)")
        .eq("status", "active")
        .order("total_earnings", { ascending: false })
        .limit(30);
      const { data, error } = await q;
      if (error) throw error;
      if (search) {
        return data?.filter((h: any) =>
          (h.profiles?.display_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (h.profiles?.username ?? "").toLowerCase().includes(search.toLowerCase())
        );
      }
      return data;
    },
  });

  const promoteHost = async (hostUserId: string, hostName: string) => {
    const { error } = await supabase.from("notifications").insert({
      user_id: hostUserId,
      title: "🌟 You've been promoted!",
      message: "A business developer has featured you as a top host. Expect more visitors!",
      type: "promotion",
    });
    if (error) toast.error(error.message);
    else toast.success(`Promoted ${hostName}!`);
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-2">Promotions</h1>
      <p className="text-sm text-muted-foreground mb-6">Feature and promote top-performing hosts.</p>

      <Input placeholder="Search hosts..." className="mb-4" value={search} onChange={(e) => setSearch(e.target.value)} />

      <div className="bg-card rounded-2xl shadow-card divide-y divide-border/30">
        {hosts?.map((h: any) => (
          <div key={h.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {h.profiles?.avatar_url ? (
                  <img src={h.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-bold">{(h.profiles?.display_name ?? "H")[0]}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{h.profiles?.display_name ?? h.profiles?.username}</p>
                <p className="text-[10px] text-muted-foreground">Lv.{h.level} • ${Number(h.total_earnings).toFixed(2)} earned</p>
              </div>
            </div>
            <button
              onClick={() => promoteHost(h.user_id, h.profiles?.display_name ?? h.profiles?.username)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-warning/10 text-warning text-xs font-bold hover:bg-warning/20 transition-colors"
            >
              <Star className="w-3.5 h-3.5" />
              Promote
            </button>
          </div>
        ))}
        {(!hosts || hosts.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No hosts found</p>
        )}
      </div>
    </div>
  );
};

export default BizDevPromotions;
