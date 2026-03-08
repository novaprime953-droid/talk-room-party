import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Gift, Coins, ToggleLeft, ToggleRight, Plus, Edit, Trash2, Upload,
  Search, Image, X, CheckCircle, Film, Save
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

const giftEmojis: Record<string, string> = {
  Rose: "🌹", Heart: "❤️", Star: "⭐", Crown: "👑", Diamond: "💎",
  Rocket: "🚀", Castle: "🏰", "Sports Car": "🏎️", Fire: "🔥",
  Rainbow: "🌈", Unicorn: "🦄", Trophy: "🏆", Ring: "💍", Kiss: "💋",
};

const categories = ["standard", "premium", "luxury", "special", "event"];

const AdminGifts = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("standard");
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [animFile, setAnimFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [uploading, setUploading] = useState(false);
  const iconRef = useRef<HTMLInputElement>(null);
  const animRef = useRef<HTMLInputElement>(null);
  const editIconRef = useRef<HTMLInputElement>(null);
  const editAnimRef = useRef<HTMLInputElement>(null);

  const { data: gifts, refetch } = useQuery({
    queryKey: ["admin-gifts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gifts").select("*").order("coin_value", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage.from("gift-assets").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from("gift-assets").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const addGift = async () => {
    if (!name.trim() || !value) { toast.error("Name and value required"); return; }
    setUploading(true);
    try {
      let icon_url: string | null = null;
      let animation_url: string | null = null;
      const slug = name.trim().toLowerCase().replace(/\s+/g, "-");

      if (iconFile) {
        const ext = iconFile.name.split(".").pop();
        icon_url = await uploadFile(iconFile, `icons/${slug}-${Date.now()}.${ext}`);
      }
      if (animFile) {
        const ext = animFile.name.split(".").pop();
        animation_url = await uploadFile(animFile, `animations/${slug}-${Date.now()}.${ext}`);
      }

      const { error } = await supabase.from("gifts").insert({
        gift_name: name.trim(),
        coin_value: parseInt(value),
        category,
        icon_url,
        animation_url,
      });
      if (error) throw error;
      toast.success("Gift created!");
      setName(""); setValue(""); setCategory("standard"); setIconFile(null); setAnimFile(null); setShowAdd(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("gifts").update({ is_active: !isActive }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Gift ${!isActive ? "activated" : "deactivated"}`); refetch(); }
  };

  const deleteGift = async (id: string, name: string) => {
    if (!confirm(`Delete gift "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("gifts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Gift deleted"); refetch(); }
  };

  const startEdit = (gift: any) => {
    setEditId(gift.id);
    setEditName(gift.gift_name);
    setEditValue(String(gift.coin_value));
    setEditCategory(gift.category);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim() || !editValue) { toast.error("Name and value required"); return; }
    setUploading(true);
    try {
      const updates: any = {
        gift_name: editName.trim(),
        coin_value: parseInt(editValue),
        category: editCategory,
      };

      // Handle icon upload during edit
      const editIconInput = editIconRef.current;
      if (editIconInput?.files?.[0]) {
        const file = editIconInput.files[0];
        const slug = editName.trim().toLowerCase().replace(/\s+/g, "-");
        const ext = file.name.split(".").pop();
        updates.icon_url = await uploadFile(file, `icons/${slug}-${Date.now()}.${ext}`);
      }

      // Handle animation upload during edit
      const editAnimInput = editAnimRef.current;
      if (editAnimInput?.files?.[0]) {
        const file = editAnimInput.files[0];
        const slug = editName.trim().toLowerCase().replace(/\s+/g, "-");
        const ext = file.name.split(".").pop();
        updates.animation_url = await uploadFile(file, `animations/${slug}-${Date.now()}.${ext}`);
      }

      const { error } = await supabase.from("gifts").update(updates).eq("id", id);
      if (error) throw error;
      toast.success("Gift updated!");
      setEditId(null);
      refetch();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const filtered = gifts?.filter((g) => {
    if (filterCat !== "all" && g.category !== filterCat) return false;
    if (search) return g.gift_name.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  const totalGifts = gifts?.length ?? 0;
  const activeGifts = gifts?.filter((g) => g.is_active).length ?? 0;
  const categoryBreakdown = categories.map((c) => ({ cat: c, count: gifts?.filter((g) => g.category === c).length ?? 0 }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Gifts Management</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20">
          <Plus className="w-4 h-4" /> Add Gift
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><Gift className="w-4 h-4 text-primary" /><span className="text-xs text-muted-foreground">Total Gifts</span></div>
          <p className="text-2xl font-bold text-foreground">{totalGifts}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><ToggleRight className="w-4 h-4 text-online" /><span className="text-xs text-muted-foreground">Active</span></div>
          <p className="text-2xl font-bold text-online">{activeGifts}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><Image className="w-4 h-4 text-accent" /><span className="text-xs text-muted-foreground">With Icons</span></div>
          <p className="text-2xl font-bold text-foreground">{gifts?.filter((g) => g.icon_url).length ?? 0}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-1"><Film className="w-4 h-4 text-warning" /><span className="text-xs text-muted-foreground">With Animations</span></div>
          <p className="text-2xl font-bold text-foreground">{gifts?.filter((g) => g.animation_url).length ?? 0}</p>
        </div>
      </div>

      {/* Add Gift Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
              <h3 className="font-semibold text-foreground mb-3">Create New Gift</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <Input placeholder="Gift name (e.g. Rose, Crown)" value={name} onChange={(e) => setName(e.target.value)} />
                <Input type="number" placeholder="Coin value" min="1" value={value} onChange={(e) => setValue(e.target.value)} />
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm">
                  {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {/* Icon Upload */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Gift Icon (PNG, JPG, GIF, SVG)</label>
                  <div className="flex items-center gap-2">
                    <input ref={iconRef} type="file" accept="image/*" className="hidden" onChange={(e) => setIconFile(e.target.files?.[0] ?? null)} />
                    <button onClick={() => iconRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-muted/10 flex-1">
                      <Upload className="w-4 h-4" />
                      {iconFile ? iconFile.name : "Choose icon image..."}
                    </button>
                    {iconFile && <button onClick={() => setIconFile(null)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive"><X className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>

                {/* Animation Upload */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground block mb-1">Animation (GIF, WEBP, MP4, Lottie JSON)</label>
                  <div className="flex items-center gap-2">
                    <input ref={animRef} type="file" accept="image/gif,image/webp,video/mp4,application/json,.json" className="hidden" onChange={(e) => setAnimFile(e.target.files?.[0] ?? null)} />
                    <button onClick={() => animRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:bg-muted/10 flex-1">
                      <Film className="w-4 h-4" />
                      {animFile ? animFile.name : "Choose animation file..."}
                    </button>
                    {animFile && <button onClick={() => setAnimFile(null)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive"><X className="w-3.5 h-3.5" /></button>}
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 mb-4">
                {iconFile && (
                  <div className="w-16 h-16 rounded-xl bg-muted/30 flex items-center justify-center overflow-hidden border border-border/50">
                    <img src={URL.createObjectURL(iconFile)} alt="preview" className="w-full h-full object-contain" />
                  </div>
                )}
                {animFile && animFile.type.startsWith("image/") && (
                  <div className="w-16 h-16 rounded-xl bg-muted/30 flex items-center justify-center overflow-hidden border border-border/50">
                    <img src={URL.createObjectURL(animFile)} alt="anim preview" className="w-full h-full object-contain" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-foreground">{name || "Gift Name"}</p>
                  <p className="text-xs text-accent font-bold">{value ? `${parseInt(value).toLocaleString()} coins` : "0 coins"}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${category === "luxury" ? "bg-accent/10 text-accent" : category === "premium" ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground"}`}>{category}</span>
                </div>
              </div>

              <button onClick={addGift} disabled={uploading} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50">
                {uploading ? "Uploading..." : "Create Gift"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search gifts..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          <button onClick={() => setFilterCat("all")} className={`px-3 py-2 rounded-xl text-xs font-bold ${filterCat === "all" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>All</button>
          {categories.map((c) => (
            <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-2 rounded-xl text-xs font-bold ${filterCat === c ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"}`}>
              {c.charAt(0).toUpperCase() + c.slice(1)} ({categoryBreakdown.find((b) => b.cat === c)?.count ?? 0})
            </button>
          ))}
        </div>
      </div>

      {/* Gifts Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered?.map((gift) => {
          const isEditing = editId === gift.id;

          return (
            <motion.div key={gift.id} layout initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className={`bg-card rounded-2xl p-4 shadow-card relative ${!gift.is_active ? "opacity-50" : ""}`}>

              {isEditing ? (
                /* Edit Mode */
                <div className="space-y-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 text-xs" placeholder="Name" />
                  <Input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="h-8 text-xs" placeholder="Value" />
                  <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-foreground text-xs">
                    {categories.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>

                  {/* Edit Icon Upload */}
                  <div>
                    <input ref={editIconRef} type="file" accept="image/*" className="hidden" />
                    <button onClick={() => editIconRef.current?.click()} className="w-full flex items-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-border text-[10px] text-muted-foreground hover:bg-muted/10">
                      <Image className="w-3 h-3" /> Replace Icon
                    </button>
                  </div>

                  {/* Edit Animation Upload */}
                  <div>
                    <input ref={editAnimRef} type="file" accept="image/gif,image/webp,video/mp4,application/json,.json" className="hidden" />
                    <button onClick={() => editAnimRef.current?.click()} className="w-full flex items-center gap-1 px-2 py-1.5 rounded-lg border border-dashed border-border text-[10px] text-muted-foreground hover:bg-muted/10">
                      <Film className="w-3 h-3" /> Replace Animation
                    </button>
                  </div>

                  <div className="flex gap-1">
                    <button onClick={() => saveEdit(gift.id)} disabled={uploading} className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-online/10 text-online text-xs font-bold hover:bg-online/20 disabled:opacity-50">
                      <Save className="w-3 h-3" /> {uploading ? "..." : "Save"}
                    </button>
                    <button onClick={() => setEditId(null)} className="px-2 py-1.5 rounded-lg bg-muted/30 text-muted-foreground text-xs hover:bg-muted/50">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  {/* Gift Visual */}
                  <div className="w-16 h-16 mx-auto mb-2 rounded-xl flex items-center justify-center overflow-hidden">
                    {gift.icon_url ? (
                      <img src={gift.icon_url} alt={gift.gift_name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-4xl">{giftEmojis[gift.gift_name] ?? "🎁"}</span>
                    )}
                  </div>

                  <p className="font-display font-bold text-sm text-foreground text-center">{gift.gift_name}</p>

                  <div className="flex items-center justify-center gap-1 mt-1 mb-2">
                    <Coins className="w-3 h-3 text-accent" />
                    <span className="text-xs font-bold text-accent">{gift.coin_value.toLocaleString()}</span>
                  </div>

                  <div className="text-center mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      gift.category === "luxury" ? "bg-accent/10 text-accent" :
                      gift.category === "premium" ? "bg-primary/10 text-primary" :
                      gift.category === "special" ? "bg-warning/10 text-warning" :
                      gift.category === "event" ? "bg-destructive/10 text-destructive" :
                      "bg-muted/30 text-muted-foreground"
                    }`}>{gift.category}</span>
                  </div>

                  {/* Animation indicator */}
                  {gift.animation_url && (
                    <div className="flex items-center justify-center gap-1 mb-2">
                      <Film className="w-3 h-3 text-warning" />
                      <span className="text-[10px] text-warning font-bold">Animated</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleActive(gift.id, gift.is_active)}
                      className="p-1.5 rounded-lg hover:bg-muted/30" title={gift.is_active ? "Deactivate" : "Activate"}>
                      {gift.is_active ? <ToggleRight className="w-4 h-4 text-online" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => startEdit(gift)}
                      className="p-1.5 rounded-lg hover:bg-muted/30 text-muted-foreground" title="Edit">
                      <Edit className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteGift(gift.id, gift.gift_name)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive/60 hover:text-destructive" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          );
        })}
      </div>
      {(!filtered || filtered.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No gifts found</p>}
    </div>
  );
};

export default AdminGifts;
