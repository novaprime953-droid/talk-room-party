import { useState, useRef } from "react";
import { FileText, Plus, Pencil, Trash2, Upload, ImageOff, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  usePolicies,
  useUpsertPolicy,
  useDeletePolicy,
  POLICY_CATEGORIES,
  PolicyCategory,
  Policy,
} from "@/hooks/usePolicies";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import EmptyState from "@/components/EmptyState";

interface FormState {
  id?: string;
  category: PolicyCategory;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
  file: File | null;
  existingImagePath: string | null;
  existingImageUrl: string | null;
}

const blank = (): FormState => ({
  category: "agency",
  title: "",
  description: "",
  sort_order: 0,
  is_active: true,
  file: null,
  existingImagePath: null,
  existingImageUrl: null,
});

const OwnerPolicies = () => {
  const { data: policies, isLoading } = usePolicies({ includeInactive: true });
  const upsert = useUpsertPolicy();
  const del = useDeletePolicy();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blank());
  const [filter, setFilter] = useState<PolicyCategory | "all">("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const openCreate = () => {
    setForm(blank());
    setOpen(true);
  };

  const openEdit = (p: Policy) => {
    setForm({
      id: p.id,
      category: p.category,
      title: p.title,
      description: p.description ?? "",
      sort_order: p.sort_order,
      is_active: p.is_active,
      file: null,
      existingImagePath: p.image_path,
      existingImageUrl: p.image_url ?? null,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      await upsert.mutateAsync({
        id: form.id,
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim() || null,
        sort_order: form.sort_order,
        is_active: form.is_active,
        file: form.file,
        existingImagePath: form.existingImagePath,
      });
      toast.success(form.id ? "Policy updated" : "Policy created");
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this policy?")) return;
    try {
      await del.mutateAsync(id);
      toast.success("Policy deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const list = (policies ?? []).filter((p) => filter === "all" || p.category === filter);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <div>
            <h1 className="font-display font-bold text-xl text-foreground">Policy Management</h1>
            <p className="text-xs text-muted-foreground">Upload, edit, and organize policy images shown to users.</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Policy
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-2">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
            filter === "all" ? "gradient-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border/50"
          }`}
        >
          All
        </button>
        {POLICY_CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => setFilter(c.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
              filter === c.value ? "gradient-primary text-primary-foreground" : "bg-card text-muted-foreground border border-border/50"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <EmptyState title="No Policies" subtitle="Click Add Policy to upload your first one." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-card rounded-2xl overflow-hidden shadow-card border border-border/40 flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-muted/20 overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageOff className="w-7 h-7" />
                  </div>
                )}
                {!p.is_active && (
                  <span className="absolute top-2 left-2 bg-destructive/90 text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <EyeOff className="w-3 h-3" /> Hidden
                  </span>
                )}
                <span className="absolute top-2 right-2 bg-background/80 backdrop-blur text-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {POLICY_CATEGORIES.find((c) => c.value === p.category)?.label}
                </span>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-bold text-foreground text-sm">{p.title}</h3>
                {p.description && (
                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{p.description}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex-1 bg-muted/40 hover:bg-muted/60 text-foreground text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold px-3 py-1.5 rounded-lg flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <FileText className="w-5 h-5 text-primary" />
              {form.id ? "Edit Policy" : "Add Policy"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as PolicyCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {POLICY_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Host Policy" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional short summary shown beneath the image"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Policy Image</Label>
              <div className="border border-dashed border-border rounded-xl p-3 flex items-center gap-3">
                <div className="w-20 h-20 rounded-lg bg-muted/30 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {form.file ? (
                    <img src={URL.createObjectURL(form.file)} alt="" className="w-full h-full object-cover" />
                  ) : form.existingImageUrl ? (
                    <img src={form.existingImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="bg-muted/40 hover:bg-muted/60 text-foreground text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" /> {form.existingImageUrl || form.file ? "Replace Image" : "Upload Image"}
                  </button>
                  <p className="text-[10px] text-muted-foreground mt-1.5">JPG/PNG/WEBP. Recommended max 2 MB.</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      if (f.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }
                      setForm({ ...form, file: f });
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Sort Order</Label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value || "0", 10) })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Visible to Users</Label>
                <div className="h-10 flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {form.is_active ? <><Eye className="w-3 h-3" /> Active</> : <><EyeOff className="w-3 h-3" /> Hidden</>}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={upsert.isPending}
              className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold w-full disabled:opacity-50"
            >
              {upsert.isPending ? "Saving..." : form.id ? "Save Changes" : "Create Policy"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OwnerPolicies;