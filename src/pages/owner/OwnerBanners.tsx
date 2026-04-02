import { useState } from "react";
import { Image, Plus, Trash2, Eye, EyeOff, ExternalLink, Calendar } from "lucide-react";
import { useAllBanners, useCreateBanner, useDeleteBanner, useToggleBanner } from "@/hooks/useBanners";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/EmptyState";

const OwnerBanners = () => {
  const { data: banners, isLoading } = useAllBanners();
  const createBanner = useCreateBanner();
  const deleteBanner = useDeleteBanner();
  const toggleBanner = useToggleBanner();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [redirectType, setRedirectType] = useState("url");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Only images allowed"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `banners/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setImageUrl(urlData.publicUrl);
    setUploading(false);
    toast.success("Image uploaded");
  };

  const handleCreate = async () => {
    if (!title || !imageUrl) { toast.error("Title and image are required"); return; }
    try {
      await createBanner.mutateAsync({
        title,
        image_url: imageUrl,
        link_url: linkUrl || undefined,
        sort_order: parseInt(sortOrder) || 0,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      toast.success("Banner created");
      setShowForm(false);
      setTitle(""); setImageUrl(""); setLinkUrl(""); setStartDate(""); setEndDate(""); setSortOrder("0");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const activeCount = banners?.filter((b: any) => b.is_active).length ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">Banner Management</h1>
          <p className="text-xs text-muted-foreground">{banners?.length ?? 0} banners • {activeCount} active</p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(!showForm)}
          className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Banner
        </motion.button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-card rounded-2xl p-5 shadow-card mb-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Banner title" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Banner Image *</Label>
                {imageUrl ? (
                  <div className="relative">
                    <img src={imageUrl} alt="" className="w-full h-32 object-cover rounded-xl" />
                    <button onClick={() => setImageUrl("")} className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border/50 rounded-xl cursor-pointer hover:bg-muted/10">
                    <Image className="w-8 h-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Click to upload"}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Redirect Type</Label>
                  <div className="flex gap-1">
                    {["url", "event", "room"].map((t) => (
                      <button key={t} onClick={() => setRedirectType(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${redirectType === t ? "gradient-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Link / ID</Label>
                  <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder={redirectType === "url" ? "https://..." : "Enter ID"} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                  <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-muted/30 rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">End Date</Label>
                  <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-muted/30 rounded-xl px-3 py-2 text-sm text-foreground outline-none" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Sort Order</Label>
                  <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate} disabled={createBanner.isPending}
                className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-bold w-full">
                {createBanner.isPending ? "Creating..." : "Create Banner"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {banners?.map((b: any) => (
          <div key={b.id} className="bg-card rounded-2xl overflow-hidden shadow-card">
            <div className="flex">
              <img src={b.image_url} alt={b.title} className="w-28 h-20 object-cover" />
              <div className="flex-1 p-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">{b.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${b.is_active ? "bg-online/10 text-online" : "bg-muted/30 text-muted-foreground"}`}>
                    {b.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
                {b.link_url && (
                  <div className="flex items-center gap-1 text-[10px] text-primary mt-0.5">
                    <ExternalLink className="w-2.5 h-2.5" /> {b.link_url.slice(0, 40)}...
                  </div>
                )}
                {(b.start_date || b.end_date) && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                    <Calendar className="w-2.5 h-2.5" />
                    {b.start_date ? new Date(b.start_date).toLocaleDateString() : "—"} → {b.end_date ? new Date(b.end_date).toLocaleDateString() : "—"}
                  </div>
                )}
                <div className="flex gap-1 mt-2">
                  <button onClick={() => toggleBanner.mutate({ id: b.id, is_active: !b.is_active })}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground font-bold flex items-center gap-0.5">
                    {b.is_active ? <><EyeOff className="w-2.5 h-2.5" /> Disable</> : <><Eye className="w-2.5 h-2.5" /> Enable</>}
                  </button>
                  <button onClick={() => { if (confirm("Delete this banner?")) deleteBanner.mutate(b.id); }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold flex items-center gap-0.5">
                    <Trash2 className="w-2.5 h-2.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {(!banners || banners.length === 0) && !isLoading && (
          <EmptyState title="No Banners" subtitle="Add your first banner to display on the home page" />
        )}
      </div>
    </div>
  );
};

export default OwnerBanners;
