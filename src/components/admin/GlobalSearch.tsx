import { useState, useCallback } from "react";
import { Search, X, User, Hash, Mic } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface GlobalSearchProps {
  basePath?: string; // e.g. "/owner" or "/admin"
}

interface GlobalSearchExternalProps {
  trigger?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
  isOpen?: boolean;
}

const GlobalSearch = ({ basePath = "/owner", trigger, onOpenChange, isOpen }: GlobalSearchProps & GlobalSearchExternalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen ?? internalOpen;
  const setOpen = useCallback((v: boolean) => {
    setInternalOpen(v);
    onOpenChange?.(v);
  }, [onOpenChange]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: results } = useQuery({
    queryKey: ["global-search", query],
    queryFn: async () => {
      const trimmed = query.trim();
      if (!trimmed) return { users: [], rooms: [] };

      const isNumeric = /^\d+$/.test(trimmed);

      const [usersRes, roomsRes] = await Promise.all([
        isNumeric
          ? supabase.from("profiles").select("user_id, display_name, username, avatar_url, user_id_number, level")
              .eq("user_id_number", parseInt(trimmed)).limit(10)
          : supabase.from("profiles").select("user_id, display_name, username, avatar_url, user_id_number, level")
              .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
              .limit(10),
        supabase.from("voice_rooms").select("id, room_name, host_id, is_live, listener_count")
          .ilike("room_name", `%${trimmed}%`).limit(5),
      ]);

      return {
        users: usersRes.data ?? [],
        rooms: roomsRes.data ?? [],
      };
    },
    enabled: query.trim().length >= 1,
  });

  const hasResults = (results?.users?.length ?? 0) + (results?.rooms?.length ?? 0) > 0;

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted/30 border border-border/50 text-xs text-muted-foreground hover:bg-muted/50 transition-colors">
          <Search className="w-3.5 h-3.5" /> Search users / rooms...
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-start justify-center pt-20 px-4"
            onClick={() => setOpen(false)}>
            <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by ID, name, or room..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none" />
                <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {query.trim().length > 0 && !hasResults && (
                  <p className="text-center text-muted-foreground text-xs py-6">No results found</p>
                )}

                {(results?.users?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase px-4 py-2">Users</p>
                    {results!.users.map((u: any) => (
                      <button key={u.user_id}
                        onClick={() => { setOpen(false); setQuery(""); navigate(`/profile/${u.user_id}`); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/10 text-left">
                        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center overflow-hidden">
                          {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> :
                            <User className="w-3.5 h-3.5 text-muted-foreground" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{u.display_name ?? u.username ?? "User"}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-0.5"><Hash className="w-2.5 h-2.5" />{u.user_id_number ?? "—"}</span>
                            <span>Lv.{u.level}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {(results?.rooms?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase px-4 py-2">Rooms</p>
                    {results!.rooms.map((r: any) => (
                      <button key={r.id}
                        onClick={() => { setOpen(false); setQuery(""); navigate(`/room/${r.id}`); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/10 text-left">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">🎙</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{r.room_name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {r.is_live && <span className="text-green-400 font-bold">● LIVE</span>}
                            <span>👥 {r.listener_count}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalSearch;
