import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const CATEGORIES = ["frame", "vehicle", "chat_bubble", "decoration"];

const OwnerProps = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [showGift, setShowGift] = useState(false);
  const [editProp, setEditProp] = useState<any>(null);
  const [form, setForm] = useState({ name: "", category: "frame", image_url: "", animation_url: "", price: 100, duration_days: "" as string | number, is_active: true });
  const [giftForm, setGiftForm] = useState({ username: "", prop_id: "", duration_days: 30, note: "" });

  const { data: props, isLoading } = useQuery({
    queryKey: ["admin-props"],
    queryFn: async () => {
      const { data, error } = await supabase.from("props").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveProp = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        name: values.name,
        category: values.category,
        image_url: values.image_url || null,
        animation_url: values.animation_url || null,
        price: Number(values.price),
        duration_days: values.duration_days ? Number(values.duration_days) : null,
        is_active: values.is_active,
      };
      if (editProp) {
        const { error } = await supabase.from("props").update(payload).eq("id", editProp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("props").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-props"] });
      toast.success(editProp ? "Prop updated" : "Prop created");
      setShowAdd(false);
      setEditProp(null);
      resetForm();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteProp = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("props").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-props"] });
      toast.success("Prop deleted");
    },
  });

  const giftProp = useMutation({
    mutationFn: async () => {
      const { data: profile } = await supabase.from("profiles").select("user_id").eq("username", giftForm.username).single();
      if (!profile) throw new Error("User not found");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + giftForm.duration_days);
      const { error } = await supabase.from("user_props").insert({
        user_id: profile.user_id,
        prop_id: giftForm.prop_id,
        expires_at: expiresAt.toISOString(),
        gifted_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Prop gifted successfully");
      setShowGift(false);
      setGiftForm({ username: "", prop_id: "", duration_days: 30, note: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetForm = () => setForm({ name: "", category: "frame", image_url: "", animation_url: "", price: 100, duration_days: "", is_active: true });

  const openEdit = (p: any) => {
    setEditProp(p);
    setForm({ name: p.name, category: p.category, image_url: p.image_url || "", animation_url: p.animation_url || "", price: p.price, duration_days: p.duration_days ?? "", is_active: p.is_active });
    setShowAdd(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Props Management</h1>
          <p className="text-sm text-muted-foreground">{props?.length ?? 0} props</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowGift(true)}>
            <Gift className="w-4 h-4 mr-1" />Gift Prop
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setEditProp(null); setShowAdd(true); }}>
            <Plus className="w-4 h-4 mr-1" />Add Prop
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {props?.map(p => (
            <div key={p.id} className="bg-card rounded-2xl p-4 shadow-card border border-border/30">
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-muted/20 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                  {p.image_url ? <img src={p.image_url} className="w-full h-full object-contain" /> : <Sparkles className="w-6 h-6 text-primary/40" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-foreground truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground capitalize">{p.category.replace('_', ' ')}</p>
                  <p className="text-xs text-accent font-bold">{p.price} coins · {p.duration_days ? `${p.duration_days}d` : '∞'}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-muted/30 rounded-lg"><Edit className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => deleteProp.mutate(p.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
              </div>
              {!p.is_active && <span className="text-[10px] text-destructive font-bold mt-1 block">Inactive</span>}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd} onOpenChange={v => { if (!v) { setShowAdd(false); setEditProp(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editProp ? "Edit Prop" : "Add New Prop"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div>
              <Label>Category</Label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} /></div>
            <div><Label>Animation URL (optional)</Label><Input value={form.animation_url} onChange={e => setForm(f => ({ ...f, animation_url: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price (coins)</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} /></div>
              <div><Label>Duration (days, empty=permanent)</Label><Input type="number" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} /></div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditProp(null); }}>Cancel</Button>
            <Button disabled={!form.name || saveProp.isPending} onClick={() => saveProp.mutate(form)}>
              {saveProp.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gift Dialog */}
      <Dialog open={showGift} onOpenChange={setShowGift}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Gift Prop to User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Username</Label><Input value={giftForm.username} onChange={e => setGiftForm(f => ({ ...f, username: e.target.value }))} /></div>
            <div>
              <Label>Prop</Label>
              <select value={giftForm.prop_id} onChange={e => setGiftForm(f => ({ ...f, prop_id: e.target.value }))}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select prop</option>
                {props?.filter(p => p.is_active).map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>
            <div><Label>Duration (days)</Label><Input type="number" value={giftForm.duration_days} onChange={e => setGiftForm(f => ({ ...f, duration_days: Number(e.target.value) }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGift(false)}>Cancel</Button>
            <Button disabled={!giftForm.username || !giftForm.prop_id || giftProp.isPending} onClick={() => giftProp.mutate()}>
              {giftProp.isPending ? "Sending..." : "Send Prop"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerProps;
