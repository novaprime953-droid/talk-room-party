import { useState } from "react";
import { useBadges, useUserBadges, useGrantBadge, useRevokeBadge } from "@/hooks/useBadges";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Award, X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

const OwnerBadges = () => {
  const { data: badges } = useBadges();
  const [query, setQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<{ user_id: string; display_name: string; user_id_number: number } | null>(null);
  const grant = useGrantBadge();
  const revoke = useRevokeBadge();

  const { data: searchResults } = useQuery({
    queryKey: ["badge-user-search", query],
    queryFn: async () => {
      if (query.length < 2) return [];
      const isNum = /^\d+$/.test(query);
      let q = supabase.from("profiles").select("user_id, display_name, username, user_id_number").limit(10);
      if (isNum) q = q.eq("user_id_number", Number(query));
      else q = q.or(`display_name.ilike.%${query}%,username.ilike.%${query}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: query.length >= 2,
  });

  const { data: userBadges } = useUserBadges(selectedUser?.user_id);
  const ownedKeys = new Set((userBadges ?? []).map((b) => b.key));

  const onGrant = async (key: string) => {
    if (!selectedUser) return;
    try { await grant.mutateAsync({ userId: selectedUser.user_id, badgeKey: key }); toast.success("Badge granted"); }
    catch (e: any) { toast.error(e.message); }
  };
  const onRevoke = async (key: string) => {
    if (!selectedUser) return;
    try { await revoke.mutateAsync({ userId: selectedUser.user_id, badgeKey: key }); toast.success("Badge revoked"); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-400" /> Badges
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Role badges auto-assign. You can manually grant Event Winner & Family Leader badges.</p>
      </div>

      {/* Badges catalog */}
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Catalog</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {badges?.map((b) => (
            <div key={b.key} className="flex flex-col items-center gap-1.5 text-center">
              <img src={b.image_url} alt={b.name} className="w-16 h-16 object-contain" />
              <span className="text-[11px] font-bold text-foreground">{b.name}</span>
              <span className="text-[9px] text-muted-foreground">{b.auto_assign ? "Auto" : "Manual"}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User search */}
      <div className="bg-card rounded-2xl border border-border/50 p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Assign to user</p>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by username or numeric ID" className="pl-9" />
        </div>
        {query.length >= 2 && !selectedUser && (
          <div className="space-y-1 max-h-48 overflow-auto">
            {searchResults?.map((u: any) => (
              <button key={u.user_id} onClick={() => { setSelectedUser(u); setQuery(""); }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/40 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{u.display_name ?? u.username}</span>
                <span className="text-[10px] text-muted-foreground">UID {u.user_id_number}</span>
              </button>
            ))}
            {searchResults?.length === 0 && <p className="text-xs text-muted-foreground px-3 py-2">No matches</p>}
          </div>
        )}
        {selectedUser && (
          <div>
            <div className="flex items-center justify-between mb-3 bg-muted/30 rounded-xl px-3 py-2">
              <div>
                <p className="text-sm font-bold text-foreground">{selectedUser.display_name}</p>
                <p className="text-[10px] text-muted-foreground">UID {selectedUser.user_id_number}</p>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1 text-muted-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {badges?.map((b) => {
                const owned = ownedKeys.has(b.key);
                return (
                  <div key={b.key} className="flex items-center gap-2 bg-muted/20 rounded-xl p-2">
                    <img src={b.image_url} alt="" className="w-10 h-10 object-contain" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{b.name}</p>
                      <p className="text-[9px] text-muted-foreground">{b.auto_assign ? "Auto" : "Manual"}</p>
                    </div>
                    {owned ? (
                      <button onClick={() => onRevoke(b.key)} disabled={b.auto_assign}
                        title={b.auto_assign ? "Remove the role to revoke" : "Revoke"}
                        className="p-1.5 rounded-lg bg-destructive/10 text-destructive disabled:opacity-30">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => onGrant(b.key)} disabled={b.auto_assign}
                        title={b.auto_assign ? "Assign the matching role instead" : "Grant"}
                        className="p-1.5 rounded-lg bg-primary/10 text-primary disabled:opacity-30">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerBadges;