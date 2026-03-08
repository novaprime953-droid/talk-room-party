import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Search, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const AgencyRecruit = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: agency } = useQuery({
    queryKey: ["my-agency"],
    queryFn: async () => {
      const { data, error } = await supabase.from("agencies").select("id").eq("owner_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: profiles } = useQuery({
    queryKey: ["recruit-search", search],
    queryFn: async () => {
      let q = supabase.from("profiles").select("user_id, username, display_name, avatar_url, level").limit(20);
      if (search) q = q.or(`username.ilike.%${search}%,display_name.ilike.%${search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: !!agency && search.length >= 2,
  });

  const { data: existingHosts, refetch: refetchHosts } = useQuery({
    queryKey: ["agency-host-ids", agency?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("hosts").select("user_id").eq("agency_id", agency!.id);
      if (error) throw error;
      return data?.map((h) => h.user_id) ?? [];
    },
    enabled: !!agency?.id,
  });

  const recruitHost = async (userId: string) => {
    // Check if already a host
    const { data: existing } = await supabase.from("hosts").select("id, agency_id").eq("user_id", userId).maybeSingle();
    if (existing) {
      if (existing.agency_id) {
        toast.error("This user is already with an agency");
        return;
      }
      const { error } = await supabase.from("hosts").update({ agency_id: agency!.id }).eq("id", existing.id);
      if (error) { toast.error(error.message); return; }
    } else {
      const { error } = await supabase.from("hosts").insert({ user_id: userId, agency_id: agency!.id });
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Host recruited successfully!");
    refetchHosts();
  };

  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-2">Recruit Hosts</h1>
      <p className="text-sm text-muted-foreground mb-6">Search for users and add them to your agency.</p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by username or display name..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {search.length < 2 ? (
        <p className="text-center text-muted-foreground text-sm py-12">Type at least 2 characters to search</p>
      ) : (
        <div className="bg-card rounded-2xl shadow-card divide-y divide-border/30">
          {profiles?.map((p) => {
            const isRecruited = existingHosts?.includes(p.user_id);
            return (
              <div key={p.user_id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{(p.display_name ?? p.username ?? "U")[0]}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.display_name ?? p.username}</p>
                    <p className="text-[10px] text-muted-foreground">Lv.{p.level}</p>
                  </div>
                </div>
                {isRecruited ? (
                  <span className="text-xs text-online font-bold">Recruited</span>
                ) : (
                  <button
                    onClick={() => recruitHost(p.user_id)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Recruit
                  </button>
                )}
              </div>
            );
          })}
          {profiles?.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-8">No users found</p>
          )}
        </div>
      )}
    </div>
  );
};

export default AgencyRecruit;
