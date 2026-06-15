import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTitles, useGrantTitle, useRevokeTitle, useUserTitles } from "@/hooks/useTitles";
import { toast } from "sonner";
import { Award, Plus, Trash2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const OwnerTitles = () => {
  const qc = useQueryClient();
  const { data: titles } = useTitles();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", image_url: "", sort_order: 0 });

  const saveTitle = useMutation({
    mutationFn: async () => {
      if (!form.name || !form.image_url) throw new Error("Name and image required");
      const { error } = await supabase.from("titles").insert({
        name: form.name, image_url: form.image_url, sort_order: form.sort_order, is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["titles-catalog"] });
      toast.success("Title added");
      setShowAdd(false); setForm({ name: "", image_url: "", sort_order: 0 });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTitle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("titles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["titles-catalog"] }); toast.success("Deleted"); },
  });

  // Assign UI
  const [query, setQuery] = useState("");
  const [target, setTarget] = useState<any>(null);
  const grant = useGrantTitle();
  const revoke = useRevokeTitle();
  const { data: targetTitles } = useUserTitles(target?.user_id);
  const owned = new Set((targetTitles ?? []).map((t) => t.id));

  const { data: results } = useQuery({
    queryKey: ["title-user-search", query],
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

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" /> Titles
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Create and grant cosmetic titles to users.</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" />Add Title</Button>
      </div>

      <div className="bg-card rounded-2xl border border-border/40 p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Catalog</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {titles?.map((t) => (
            <div key={t.id} className="bg-muted/20 rounded-xl p-3 flex flex-col items-center gap-2">
              <img src={t.image_url} alt={t.name} className="h-10 object-contain" />
              <p className="text-xs font-bold text-foreground text-center">{t.name}</p>
              <button onClick={() => deleteTitle.mutate(t.id)} className="p-1 rounded-md hover:bg-destructive/10 text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {!titles?.length && <p className="col-span-full text-xs text-muted-foreground py-6 text-center">No titles yet</p>}
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/40 p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase mb-3">Assign to user</p>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or UID" className="pl-9" />
        </div>
        {query.length >= 2 && !target && (
          <div className="space-y-1 max-h-48 overflow-auto">
            {results?.map((u: any) => (
              <button key={u.user_id} onClick={() => { setTarget(u); setQuery(""); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/40 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{u.display_name ?? u.username}</span>
                <span className="text-[10px] text-muted-foreground">UID {u.user_id_number}</span>
              </button>
            ))}
            {results?.length === 0 && <p className="text-xs text-muted-foreground px-3 py-2">No matches</p>}
          </div>
        )}
        {target && (
          <div>
            <div className="flex items-center justify-between bg-muted/30 rounded-xl px-3 py-2 mb-3">
              <div>
                <p className="text-sm font-bold text-foreground">{target.display_name}</p>
                <p className="text-[10px] text-muted-foreground">UID {target.user_id_number}</p>
              </div>
              <button onClick={() => setTarget(null)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {titles?.map((t) => {
                const has = owned.has(t.id);
                return (
                  <div key={t.id} className="flex items-center gap-2 bg-muted/20 rounded-xl p-2">
                    <img src={t.image_url} alt="" className="h-7 object-contain flex-shrink-0" />
                    <span className="flex-1 text-xs font-bold text-foreground truncate">{t.name}</span>
                    {has ? (
                      <button onClick={async () => { try { await revoke.mutateAsync({ userId: target.user_id, titleId: t.id }); toast.success("Revoked"); } catch (e: any) { toast.error(e.message); } }} className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button onClick={async () => { try { await grant.mutateAsync({ userId: target.user_id, titleId: t.id }); toast.success("Granted"); } catch (e: any) { toast.error(e.message); } }} className="p-1.5 rounded-lg bg-primary/10 text-primary">
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

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Title</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} placeholder="https://..." /></div>
            <div><Label>Sort order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))} /></div>
            {form.image_url && <img src={form.image_url} alt="preview" className="h-12 object-contain mx-auto" />}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => saveTitle.mutate()} disabled={saveTitle.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerTitles;