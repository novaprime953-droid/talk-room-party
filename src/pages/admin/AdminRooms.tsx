import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DoorOpen, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminRooms = () => {
  const { data: rooms, refetch } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("voice_rooms")
        .select("*, profiles!voice_rooms_host_id_fkey(username, display_name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const deleteRoom = async (id: string, name: string) => {
    if (!confirm(`Delete room "${name}"?`)) return;
    const { error } = await supabase.from("voice_rooms").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Room deleted"); refetch(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Room Management</h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <DoorOpen className="w-4 h-4" />
          <span>{rooms?.length ?? 0} rooms</span>
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
              {rooms?.map((r: any) => (
                <tr key={r.id} className="border-b border-border/30 last:border-0 hover:bg-muted/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {r.is_live && <div className="w-2 h-2 bg-live rounded-full animate-pulse" />}
                      <p className="font-semibold text-foreground">{r.room_name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {r.profiles?.display_name ?? r.profiles?.username ?? "Unknown"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground font-bold">
                      {r.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      r.is_live ? "bg-live/10 text-live" : "bg-muted/30 text-muted-foreground"
                    }`}>
                      {r.is_live ? "LIVE" : r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{r.listener_count}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteRoom(r.id, r.room_name)}
                      className="p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {(!rooms || rooms.length === 0) && (
          <p className="text-center text-muted-foreground text-sm py-8">No rooms found</p>
        )}
      </div>
    </div>
  );
};

export default AdminRooms;
