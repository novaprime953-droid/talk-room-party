import { useState } from "react";
import { Image, Plus, Trash2, Eye, EyeOff, ExternalLink, Calendar, Upload } from "lucide-react";
import { useAllBanners, useCreateBanner, useDeleteBanner, useToggleBanner } from "@/hooks/useBanners";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EmptyState from "@/components/EmptyState";

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
  const [redirectId, setRedirectId] = useState("");
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
        link_url: redirectType === "url" ? (linkUrl || undefined) : undefined,
        sort_order: parseInt(sortOrder) || 0,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      toast.success("Banner created successfully!");
      setShowForm(false);
      setTitle(""); setImageUrl(""); setLinkUrl(""); setRedirectId(""); setStartDate(""); setEndDate(""); setSortOrder("0"); setRedirectType("url");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const activeCount = banners?.filter((b: any) => b.is_active).length ?? 0;
  const inactiveCount = (banners?.length ?? 0) - activeCount;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground flex items-center gap-2">
            <Image className="w-6 h-6 text-primary" /> Banner Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {banners?.length ?? 0} total • <span className="text-online">{activeCount} active</span> • {inactiveCount} inactive
          </p>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(!showForm)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${showForm ? "bg-muted text-muted-foreground" : "gradient-primary text-primary-foreground"}`}>
          {showForm ? <><Eye className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Banner</>}
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 border border-border/30">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Total</p>
          <p className="text-2xl font-display font-bold text-foreground">{banners?.length ?? 0}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-online/20">
          <p className="text-[10px] text-online uppercase font-bold">Active</p>
          <p className="text-2xl font-display font-bold text-online">{activeCount}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 border border-border/30">
          <p className="text-[10px] text-muted-foreground uppercase font-bold">Inactive</p>
          <p className="text-2xl font-display font-bold text-muted-foreground">{inactiveCount}</p>
        </div>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-card rounded-2xl p-5 shadow-card mb-6 space-y-4 border border-primary/20">
              <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Create New Banner
              </h3>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-bold">Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Summer Event 2026" className="bg-muted/20" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-bold">Banner Image *</Label>
                {imageUrl ? (
                  <div className="relative">
                    <img src={imageUrl} alt="" className="w-full h-36 object-cover rounded-xl border border-border/30" />
                    <button onClick={() => setImageUrl("")} className="absolute top-2 right-2 p-1.5 bg-destructive/90 rounded-full text-white">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-primary/30 rounded-xl cursor-pointer hover:bg-primary/5 transition-colors">
                    <Upload className="w-8 h-8 text-primary/50 mb-2" />
                    <span className="text-xs text-muted-foreground font-medium">{uploading ? "Uploading..." : "Click to upload banner image"}</span>
                    <span className="text-[10px] text-muted-foreground/60 mt-1">Recommended: 1200×400px, max 5MB</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-bold">Redirect Type</Label>
                  <div className="flex gap-1.5">
                    {["url", "event", "room"].map((t) => (
                      <button key={t} onClick={() => setRedirectType(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors ${redirectType === t ? "gradient-primary text-primary-foreground shadow-sm" : "bg-muted/40 text-muted-foreground hover:bg-muted/60"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-bold">{redirectType === "url" ? "Link URL" : "Redirect ID"}</Label>
                  <Input
                    value={redirectType === "url" ? linkUrl : redirectId}
                    onChange={(e) => redirectType === "url" ? setLinkUrl(e.target.value) : setRedirectId(e.target.value)}
                    placeholder={redirectType === "url" ? "https://..." : "Enter room/event ID"}
                    className="bg-muted/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-bold">Start Date</Label>
                  <input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-muted/20 rounded-xl px-3 py-2 text-sm text-foreground outline-none border border-border/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-bold">End Date</Label>
                  <input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-muted/20 rounded-xl px-3 py-2 text-sm text-foreground outline-none border border-border/30" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-bold">Priority</Label>
                  <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="bg-muted/20" />
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleCreate} disabled={createBanner.isPending}
                className="gradient-primary text-primary-foreground px-6 py-3 rounded-xl text-sm font-bold w-full shadow-lg shadow-primary/20">
                {createBanner.isPending ? "Creating..." : "Create Banner"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Banner List */}
      <div className="space-y-3">
        {banners?.map((b: any, idx: number) => (
          <motion.div key={b.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`bg-card rounded-2xl overflow-hidden shadow-card border ${b.is_active ? "border-online/20" : "border-border/30 opacity-70"}`}>
            <div className="flex gap-0">
              <div className="relative w-32 h-24 flex-shrink-0">
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                {b.is_active && <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-online animate-pulse" />}
              </div>
              <div className="flex-1 p-3 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-foreground truncate">{b.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${b.is_active ? "bg-online/10 text-online" : "bg-muted/30 text-muted-foreground"}`}>
                    {b.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
                {b.link_url && (
                  <div className="flex items-center gap-1 text-[10px] text-primary mt-0.5 truncate">
                    <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" /> <span className="truncate">{b.link_url}</span>
                  </div>
                )}
                {(b.start_date || b.end_date) && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                    <Calendar className="w-2.5 h-2.5" />
                    {b.start_date ? new Date(b.start_date).toLocaleDateString() : "—"} → {b.end_date ? new Date(b.end_date).toLocaleDateString() : "—"}
                  </div>
                )}
                <div className="flex gap-1.5 mt-2">
                  <button onClick={() => toggleBanner.mutate({ id: b.id, is_active: !b.is_active })}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-0.5 transition-colors ${b.is_active ? "bg-warning/10 text-warning" : "bg-online/10 text-online"}`}>
                    {b.is_active ? <><EyeOff className="w-2.5 h-2.5" /> Disable</> : <><Eye className="w-2.5 h-2.5" /> Enable</>}
                  </button>
                  <button onClick={() => { if (confirm("Delete this banner?")) deleteBanner.mutate(b.id); }}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-destructive/10 text-destructive font-bold flex items-center gap-0.5 hover:bg-destructive/20 transition-colors">
                    <Trash2 className="w-2.5 h-2.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {(!banners || banners.length === 0) && !isLoading && (
          <EmptyState title="No Banners Yet" subtitle="Create your first banner to engage users on the home page" />
        )}
      </div>
    </div>
  );
};

export default OwnerBanners;
