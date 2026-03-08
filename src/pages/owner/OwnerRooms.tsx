import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  DoorOpen, Trash2, Users, Lock, Unlock, Search, Eye, Radio,
  Shield, BarChart3, Mic, Globe, EyeOff, ChevronDown, ChevronUp,
  Ban, RefreshCw, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const OwnerRooms = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "locked" | "closed">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"created" | "listeners" | "name">("created");
  const [sortAsc, setSortAsc] = useState(false);

  const { data: rooms, refetch } = useQuery({
    queryKey: ["owner-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_rooms")
        .select("*, profiles!voice_rooms_host_id_fkey(username, display_name, avatar_url, is_online)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  // Participants for expanded room
  const { data: participants } = useQuery({
    queryKey: ["room-participants", expandedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_participants")
        .select("*, profiles!room_participants_user_id_fkey(username, display_name, avatar_url)")
        .eq("room_id", expandedId!)
        .is("left_at", null);
      if (error) throw error;
      return data;
    },
    enabled: !!expandedId,
  });

  // Messages count for expanded room
  const { data: msgCount } = useQuery({
    queryKey: ["room-msg-count", expandedId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("room_messages")
        .select("id", { count: "exact", head: true })
        .eq("room_id", expandedId!);
      if (error) throw error;
      return count ?? 0;
    },
    enabled: !!expandedId,
  });

  // Gift transactions for expanded room
  const { data: roomGifts } = useQuery({
    queryKey: ["room-gifts", expandedId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gift_transactions")
        .select("coins_spent")
        .eq("room_id", expandedId!);
      if (error) throw error;
      return data?.reduce((s, g) => s + g.coins_spent, 0) ?? 0;
    },
    enabled: !!expandedId,
  });

  const deleteRoom = async (id: string, name: string) => {
    if (!confirm(`Permanently delete room "${name}"? This cannot be undone.`)) return;
    // Remove participants first
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
      return r.room_name.toLowerCase().includes(s) ||
        r.profiles?.display_name?.toLowerCase().includes(s) ||
        r.profiles?.username?.toLowerCase().includes(s) ||
        r.category.toLowerCase().includes(s);
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
  const lockedCount = rooms?.filter((r) => r.status === "locked").length ?? 0;
  const totalListeners = rooms?.reduce((s, r) => s + r.listener_count, 0) ?? 0;
  const publicCount = rooms?.filter((r) => r.privacy_type === "public").length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Room Management</h1>
          <p className="text-xs text-muted-foreground">Monitor, lock, and manage all voice rooms</p>
        </div>
        <button onClick={() => refetch()} className="p-2 rounded-xl bg-muted/30 hover:bg-muted/50 text-muted-foreground">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><DoorOpen className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Total Rooms</span></div>
          <p className="text-2xl font-bold text-foreground">{rooms?.length ?? 0}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><Radio className="w-4 h-4 text-online" /><span className="text-xs text-muted-foreground">Live Now</span></div>
          <p className="text-2xl font-bold text-online">{liveCount}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-accent" /><span className="text-xs text-muted-foreground">Total Listeners</span></div>
          <p className="text-2xl font-bold text-foreground">{totalListeners}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><Lock className="w-4 h-4 text-warning" /><span className="text-xs text-muted-foreground">Locked</span></div>
          <p className="text-2xl font-bold text-foreground">{lockedCount}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search rooms, hosts, categories..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1">
          {(["all", "live", "locked", "closed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${filter === f ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
              {f === "live" ? "🔴 Live" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["created", "listeners", "name"] as const).map((s) => (
            <button key={s} onClick={() => { if (sortBy === s) setSortAsc(!sortAsc); else { setSortBy(s); setSortAsc(false); } }}
              className={`px-2.5 py-2 rounded-xl text-[10px] font-bold flex items-center gap-0.5 ${sortBy === s ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {sortBy === s && (sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
            </button>
          ))}
        </div>
      </div>

      {/* Rooms Table */}
      <div className="bg-card rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Room</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Host</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Category</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Privacy</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Listeners</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Created</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered?.map((r: any) => {
                const isExpanded = expandedId === r.id;
                const isLocked = r.status === "locked";
                return (
                  <>
                    <tr key={r.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10 align-top">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {r.is_live && <div className="w-2 h-2 bg-destructive rounded-full animate-pulse flex-shrink-0" />}
                          <div>
                            <p className="font-semibold text-foreground">{r.room_name}</p>
                            {r.description && <p className="text-[10px] text-muted-foreground line-clamp-1">{r.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                              {r.profiles?.avatar_url ? <img src={r.profiles.avatar_url} className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{(r.profiles?.display_name ?? "?")[0]}</span>}
                            </div>
                            {r.profiles?.is_online && <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-online rounded-full border border-card" />}
                          </div>
                          <span className="text-xs text-foreground">{r.profiles?.display_name ?? r.profiles?.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground font-bold">{r.category}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          {r.privacy_type === "public" ? <Globe className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          {r.privacy_type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          r.is_live ? "bg-destructive/10 text-destructive" : isLocked ? "bg-warning/10 text-warning" : r.status === "closed" ? "bg-muted/30 text-muted-foreground" : "bg-online/10 text-online"
                        }`}>
                          {r.is_live ? "🔴 LIVE" : isLocked ? "🔒 LOCKED" : r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-foreground">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="font-bold">{r.listener_count}</span>
                          <span className="text-[10px] text-muted-foreground">/ {r.max_seats}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {/* View Details */}
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setExpandedId(isExpanded ? null : r.id)}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title="View Stats">
                            <Eye className="w-3.5 h-3.5" />
                          </motion.button>

                          {/* Lock / Unlock */}
                          {isLocked ? (
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => unlockRoom(r.id)}
                              className="p-1.5 rounded-lg bg-online/10 text-online hover:bg-online/20" title="Unlock">
                              <Unlock className="w-3.5 h-3.5" />
                            </motion.button>
                          ) : (
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => lockRoom(r.id)}
                              className="p-1.5 rounded-lg bg-warning/10 text-warning hover:bg-warning/20" title="Lock">
                              <Lock className="w-3.5 h-3.5" />
                            </motion.button>
                          )}

                          {/* Close if live */}
                          {r.is_live && (
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => closeRoom(r.id)}
                              className="p-1.5 rounded-lg bg-muted/30 text-muted-foreground hover:bg-muted/50" title="Force Close">
                              <X className="w-3.5 h-3.5" />
                            </motion.button>
                          )}

                          {/* Delete */}
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteRoom(r.id, r.room_name)}
                            className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Room Stats */}
                    {isExpanded && (
                      <tr key={`${r.id}-detail`}>
                        <td colSpan={8} className="px-4 py-4 bg-muted/5">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                            <div className="bg-card rounded-xl p-3 text-center">
                              <p className="text-[10px] text-muted-foreground">Active Users</p>
                              <p className="text-lg font-bold text-foreground">{participants?.length ?? 0}</p>
                            </div>
                            <div className="bg-card rounded-xl p-3 text-center">
                              <p className="text-[10px] text-muted-foreground">Total Messages</p>
                              <p className="text-lg font-bold text-foreground">{msgCount ?? 0}</p>
                            </div>
                            <div className="bg-card rounded-xl p-3 text-center">
                              <p className="text-[10px] text-muted-foreground">Gift Revenue</p>
                              <p className="text-lg font-bold text-accent">{(roomGifts ?? 0).toLocaleString()} coins</p>
                            </div>
                            <div className="bg-card rounded-xl p-3 text-center">
                              <p className="text-[10px] text-muted-foreground">Max Seats</p>
                              <p className="text-lg font-bold text-foreground">{r.max_seats}</p>
                            </div>
                          </div>

                          {/* Current Participants */}
                          {participants && participants.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Current Participants</p>
                              <div className="flex flex-wrap gap-2">
                                {participants.map((p: any) => (
                                  <div key={p.id} className="flex items-center gap-1.5 bg-card rounded-lg px-2.5 py-1.5">
                                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                      {p.profiles?.avatar_url ? <img src={p.profiles.avatar_url} className="w-full h-full object-cover" /> : <span className="text-[8px] font-bold">{(p.profiles?.display_name ?? "?")[0]}</span>}
                                    </div>
                                    <span className="text-xs font-medium text-foreground">{p.profiles?.display_name ?? p.profiles?.username}</span>
                                    {p.is_speaker && <Mic className="w-3 h-3 text-primary" />}
                                    {p.hand_raised && <span className="text-[10px]">✋</span>}
                                    <span className={`text-[8px] px-1 rounded ${p.mic_status === "unmuted" ? "bg-online/10 text-online" : "bg-muted/30 text-muted-foreground"}`}>
                                      {p.mic_status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {(!participants || participants.length === 0) && (
                            <p className="text-xs text-muted-foreground">No active participants</p>
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

export default OwnerRooms;
