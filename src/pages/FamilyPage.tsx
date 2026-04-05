import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft, Users, Plus, Crown, LogOut, Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FramedAvatar from "@/components/FramedAvatar";

const MIN_LEVEL = 20;
const MIN_COINS = 100000;

const FamilyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [familyDesc, setFamilyDesc] = useState("");
  const [search, setSearch] = useState("");

  // Current user's family membership
  const { data: myMembership } = useQuery({
    queryKey: ["my-family-membership", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("family_members")
        .select("*, families(*)")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // All families
  const { data: families } = useQuery({
    queryKey: ["families", search],
    queryFn: async () => {
      let q = supabase.from("families").select("*, family_members(count)").order("created_at", { ascending: false });
      if (search) q = q.ilike("name", `%${search}%`);
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Family members (if in a family)
  const familyId = (myMembership as any)?.family_id;
  const { data: members } = useQuery({
    queryKey: ["family-members", familyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("family_members")
        .select("*, profiles:user_id(username, display_name, avatar_url, level)")
        .eq("family_id", familyId);
      if (error) throw error;
      return data;
    },
    enabled: !!familyId,
  });

  const createFamily = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const level = profile?.level ?? 1;
      const coins = profile?.coins_balance ?? 0;
      if (level < MIN_LEVEL && coins < MIN_COINS) {
        throw new Error(`Need Level ${MIN_LEVEL} or ${MIN_COINS.toLocaleString()} coins to create a family`);
      }
      const { error } = await supabase.from("families").insert({ name: familyName, description: familyDesc, owner_id: user.id });
      if (error) throw error;
      // Auto-join as owner
      const { data: fam } = await supabase.from("families").select("id").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(1).single();
      if (fam) {
        await supabase.from("family_members").insert({ family_id: fam.id, user_id: user.id, role: "owner" });
      }
    },
    onSuccess: () => {
      toast.success("Family created!");
      setShowCreate(false);
      setFamilyName("");
      setFamilyDesc("");
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["my-family-membership"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const joinFamily = useMutation({
    mutationFn: async (fId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("family_members").insert({ family_id: fId, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Joined family!");
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["my-family-membership"] });
    },
    onError: () => toast.error("Failed to join. You may already be in a family."),
  });

  const leaveFamily = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("family_members").delete().eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Left family");
      queryClient.invalidateQueries({ queryKey: ["families"] });
      queryClient.invalidateQueries({ queryKey: ["my-family-membership"] });
    },
  });

  const canCreate = (profile?.level ?? 1) >= MIN_LEVEL || (profile?.coins_balance ?? 0) >= MIN_COINS;

  // If user is in a family, show family detail view
  if (myMembership && familyId) {
    const family = (myMembership as any)?.families;
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display font-bold text-lg text-foreground">My Family</h1>
        </div>

        {/* Family Card */}
        <div className="mx-4 mt-4 rounded-2xl border border-border/50 bg-card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">{family?.name}</h2>
              <p className="text-xs text-muted-foreground">Lv.{family?.level ?? 1} • {members?.length ?? 0} members</p>
            </div>
          </div>
          {family?.description && (
            <p className="text-xs text-muted-foreground mb-3">{family.description}</p>
          )}
          <Button variant="destructive" size="sm" onClick={() => leaveFamily.mutate()} className="gap-1">
            <LogOut className="w-3 h-3" /> Leave Family
          </Button>
        </div>

        {/* Members */}
        <div className="mx-4 mt-4">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Members</p>
          <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/30">
            {members?.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <FramedAvatar src={m.profiles?.avatar_url} name={m.profiles?.display_name ?? m.profiles?.username} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{m.profiles?.display_name ?? m.profiles?.username}</p>
                  <p className="text-[10px] text-muted-foreground">Lv.{m.profiles?.level ?? 1}</p>
                </div>
                {m.role === "owner" && <Crown className="w-4 h-4 text-amber-400" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Browse families view
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-lg border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)}>
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display font-bold text-lg text-foreground">Families</h1>
        <button onClick={() => setShowCreate(true)} className="ml-auto">
          <Plus className="w-5 h-5 text-primary" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search families..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-muted/30 border-border/50"
          />
        </div>
      </div>

      {/* Families List */}
      <div className="p-4 space-y-3">
        {families?.map((f: any, i: number) => {
          const memberCount = f.family_members?.[0]?.count ?? 0;
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl border border-border/50 bg-card p-4 flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{f.name}</p>
                <p className="text-[10px] text-muted-foreground">Lv.{f.level} • {memberCount}/{f.max_members} members</p>
              </div>
              <Button size="sm" onClick={() => joinFamily.mutate(f.id)} disabled={joinFamily.isPending}>
                Join
              </Button>
            </motion.div>
          );
        })}
        {families?.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-10">No families found</p>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Create Family</DialogTitle>
          </DialogHeader>
          {!canCreate ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                You need <strong>Level {MIN_LEVEL}</strong> or <strong>{MIN_COINS.toLocaleString()} coins</strong> to create a family.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Your level: {profile?.level ?? 1} | Coins: {(profile?.coins_balance ?? 0).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Input placeholder="Family Name" value={familyName} onChange={(e) => setFamilyName(e.target.value)} />
              <Input placeholder="Description (optional)" value={familyDesc} onChange={(e) => setFamilyDesc(e.target.value)} />
              <Button className="w-full" onClick={() => createFamily.mutate()} disabled={!familyName || createFamily.isPending}>
                Create Family
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FamilyPage;
