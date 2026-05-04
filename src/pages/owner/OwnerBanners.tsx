import { useState, useRef } from "react";
import { Image, Plus, Trash2, Eye, EyeOff, ExternalLink, Calendar, Upload, GripVertical, Sparkles } from "lucide-react";
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
  const [previewTab, setPreviewTab] = useState<"list" | "preview">("list");

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
          <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center">
              <Image className="w-5 h-5 text-white" />
            </div>
            Banner Management
          </h1>
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowForm(!showForm)}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg ${
            showForm
              ? "bg-muted/60 text-muted-foreground shadow-none"
              : "bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-purple-500/25"
          }`}>
          {showForm ? <><Eye className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Banner</>}
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-900/10 rounded-2xl p-4 border border-purple-500/20 backdrop-blur-sm">
          <p className="text-[10px] text-purple-300 uppercase font-bold tracking-wider">Total</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">{banners?.length ?? 0}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-900/10 rounded-2xl p-4 border border-emerald-500/20 backdrop-blur-sm">
          <p className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">Active</p>
          <p className="text-2xl font-display font-bold text-emerald-400 mt-1">{activeCount}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-900/10 rounded-2xl p-4 border border-amber-500/20 backdrop-blur-sm">
          <p className="text-[10px] text-amber-400 uppercase font-bold tracking-wider">Paused</p>
          <p className="text-2xl font-display font-bold text-amber-400 mt-1">{inactiveCount}</p>
        </div>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-card/80 backdrop-blur-xl rounded-2xl p-5 mb-6 space-y-4 border border-purple-500/20" style={{ boxShadow: "0 8px 32px rgba(108,0,255,0.15)" }}>
              <h3 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Create New Banner
              </h3>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-bold">Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Summer Event 2026" className="bg-muted/20" />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground font-bold">Banner Image * <span className="text-[10px] font-normal">(1200×400 recommended)</span></Label>
                {imageUrl ? (
                  <div className="relative">
                    <img src={imageUrl} alt="" className="w-full h-40 object-cover rounded-xl border border-purple-500/20" />
                    <button onClick={() => setImageUrl("")} className="absolute top-2 right-2 p-1.5 bg-red-500/90 backdrop-blur-sm rounded-full text-white hover:bg-red-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-purple-500/25 rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-purple-400" />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{uploading ? "Uploading..." : "Drop or click to upload"}</span>
                    <span className="text-[10px] text-muted-foreground/60 mt-1">JPG, PNG, WEBP · Max 5MB</span>
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
                className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-6 py-3 rounded-xl text-sm font-bold w-full shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow disabled:opacity-50">
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
            className={`bg-card/60 backdrop-blur-sm rounded-2xl overflow-hidden border transition-all ${
              b.is_active
                ? "border-purple-500/20 shadow-[0_4px_20px_rgba(108,0,255,0.1)]"
                : "border-border/20 opacity-60"
            }`}>
            <div className="flex">
              <div className="relative w-36 h-24 flex-shrink-0">
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" loading="lazy" />
                {b.is_active && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-[8px] font-bold text-white uppercase">Live</span>
                  </div>
                )}
              </div>
              <div className="flex-1 p-3 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-foreground truncate">{b.title}</h3>
                </div>
                {b.link_url && (
                  <div className="flex items-center gap-1 text-[10px] text-purple-400 mt-0.5 truncate">
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
                    className={`text-[10px] px-2.5 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                      b.is_active
                        ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                    }`}>
                    {b.is_active ? <><EyeOff className="w-3 h-3" /> Pause</> : <><Eye className="w-3 h-3" /> Activate</>}
                  </button>
                  <button onClick={() => { if (confirm("Delete this banner?")) deleteBanner.mutate(b.id); }}
                    className="text-[10px] px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 font-bold flex items-center gap-1 hover:bg-red-500/20 transition-all">
                    <Trash2 className="w-3 h-3" /> Delete
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
