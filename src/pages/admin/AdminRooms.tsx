import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DoorOpen, Trash2, Users, Lock, Unlock, Search, Eye, Radio,
  Globe, EyeOff, X, RefreshCw, BarChart3, ChevronDown, ChevronUp
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminRooms = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "locked" | "closed">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"created" | "listeners" | "name">("created");
  const [sortAsc, setSortAsc] = useState(false);

  const { data: rooms, refetch } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_rooms")
        .select("*, profiles!voice_rooms_host_id_fkey(username, display_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: participants } = useQuery({
    queryKey: ["admin-room-participants", expandedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_participants")
        .select("*, profiles!room_participants_user_id_fkey(username, display_name)")
        .eq("room_id", expandedId!)
        .is("left_at", null);
      if (error) throw error;
      return data;
    },
    enabled: !!expandedId,
  });

  const { data: msgCount } = useQuery({
    queryKey: ["admin-room-msgs", expandedId],
    queryFn: async () => {
      const { count, error } = await supabase.from("room_messages").select("id", { count: "exact", head: true }).eq("room_id", expandedId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!expandedId,
  });

  const { data: roomGifts } = useQuery({
    queryKey: ["admin-room-gifts", expandedId],
    queryFn: async () => {
      const { data, error } = await supabase.from("gift_transactions").select("coins_spent").eq("room_id", expandedId!);
      if (error) throw error;
      return data?.reduce((s, g) => s + g.coins_spent, 0) ?? 0;
    },
    enabled: !!expandedId,
  });

  const deleteRoom = async (id: string, name: string) => {
    if (!confirm(`Delete room "${name}"?`)) return;
    await supabase.from("room_participants").delete().eq("room_id", id);
    const { error } = await supabase.from("voice_rooms").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Room deleted"); refetch(); }
  };

  const lockRoom = async (id: string) => {
    const { error } = await supabase.from("voice_rooms").update({ privacy_type: "private", status: "locked" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Room locked"); refetch(); }
  };

  const unlockRoom = async (id: string) => {
    const { error } = await supabase.from("voice_rooms").update({ privacy_type: "public", status: "active" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Room unlocked"); refetch(); }
  };

  const closeRoom = async (id: string) => {
    const { error } = await supabase.from("voice_rooms").update({ is_live: false, status: "closed" }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Room closed"); refetch(); }
  };

  const filtered = rooms?.filter((r: any) => {
    if (filter === "live" && !r.is_live) return false;
    if (filter === "locked" && r.status !== "locked") return false;
    if (filter === "closed" && r.status !== "closed") return false;
    if (search) {
      const s = search.toLowerCase();
      return r.room_name.toLowerCase().includes(s) || r.profiles?.display_name?.toLowerCase().includes(s) || r.profiles?.username?.toLowerCase().includes(s) || r.category.toLowerCase().includes(s);
    }
    return true;
  }).sort((a: any, b: any) => {
    let cmp = 0;
    if (sortBy === "listeners") cmp = b.listener_count - a.listener_count;
    else if (sortBy === "name") cmp = a.room_name.localeCompare(b.room_name);
    else cmp = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return sortAsc ? -cmp : cmp;
  });

  const liveCount = rooms?.filter((r) => r.is_live).length ?? 0;
  const totalListeners = rooms?.reduce((s, r) => s + r.listener_count, 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Room Management</h1>
        <button onClick={() => refetch()} className="p-2 rounded-xl bg-muted/30 hover:bg-muted/50 text-muted-foreground"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-bold text-foreground">{rooms?.length ?? 0}</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-xs text-muted-foreground">Live</p>
          <p className="text-lg font-bold text-online">{liveCount}</p>
        </div>
        <div className="bg-card rounded-2xl p-3 shadow-card text-center">
          <p className="text-xs text-muted-foreground">Listeners</p>
          <p className="text-lg font-bold text-accent">{totalListeners}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search rooms, hosts..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {(["all", "live", "locked", "closed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-bold ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
              {f === "live" ? "🔴 Live" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Room</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Host</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Listeners</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((r: any) => {
                const isExpanded = expandedId === r.id;
                const isLocked = r.status === "locked";
                return (
                  <>
                    <tr key={r.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {r.is_live && <div className="w-2 h-2 bg-destructive rounded-full animate-pulse" />}
                          <p className="font-semibold text-foreground">{r.room_name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-foreground text-xs">{r.profiles?.display_name ?? r.profiles?.username}</td>
                      <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground font-bold">{r.category}</span></td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${r.is_live ? "bg-destructive/10 text-destructive" : isLocked ? "bg-warning/10 text-warning" : "bg-online/10 text-online"}`}>
                          {r.is_live ? "LIVE" : isLocked ? "LOCKED" : r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className="flex items-center gap-1"><Users className="w-3 h-3 text-muted-foreground" />{r.listener_count}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setExpandedId(isExpanded ? null : r.id)} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title="Stats"><Eye className="w-3.5 h-3.5" /></motion.button>
                          {isLocked ? (
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => unlockRoom(r.id)} className="p-1.5 rounded-lg bg-online/10 text-online hover:bg-online/20" title="Unlock"><Unlock className="w-3.5 h-3.5" /></motion.button>
                          ) : (
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => lockRoom(r.id)} className="p-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20" title="Lock"><Lock className="w-3.5 h-3.5" /></motion.button>
                          )}
                          {r.is_live && <motion.button whileTap={{ scale: 0.9 }} onClick={() => closeRoom(r.id)} className="p-1.5 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50" title="Close"><X className="w-3.5 h-3.5" /></motion.button>}
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteRoom(r.id, r.room_name)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Delete"><Trash2 className="w-3.5 h-3.5" /></motion.button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${r.id}-stats`}>
                        <td colSpan={6} className="px-4 py-3 bg-muted/5">
                          <div className="grid grid-cols-3 gap-3 mb-2">
                            <div className="text-center"><p className="text-[10px] text-muted-foreground">Active Users</p><p className="font-bold text-foreground">{participants?.length ?? 0}</p></div>
                            <div className="text-center"><p className="text-[10px] text-muted-foreground">Messages</p><p className="font-bold text-foreground">{msgCount ?? 0}</p></div>
                            <div className="text-center"><p className="text-[10px] text-muted-foreground">Gift Revenue</p><p className="font-bold text-accent">{(roomGifts ?? 0).toLocaleString()}</p></div>
                          </div>
                          {participants && participants.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {participants.map((p: any) => (
                                <span key={p.id} className="text-[10px] bg-card px-2 py-1 rounded-lg font-medium text-foreground">{p.profiles?.display_name ?? p.profiles?.username}</span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        {(!filtered || filtered.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No rooms found</p>}
      </div>
    </div>
  );
};

export default AdminRooms;
