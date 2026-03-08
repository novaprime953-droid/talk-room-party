import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Gift, Coins, ToggleLeft, ToggleRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

const giftEmojis: Record<string, string> = {
  Rose: "🌹", Heart: "❤️", Star: "⭐", Crown: "👑", Diamond: "💎", Rocket: "🚀", Castle: "🏰", "Sports Car": "🏎️",
};

const AdminGifts = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [value, setValue] = useState("");
  const [category, setCategory] = useState("standard");

  const { data: gifts, refetch } = useQuery({
    queryKey: ["admin-gifts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gifts").select("*").order("coin_value", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("gifts").update({ is_active: !isActive }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Gift ${!isActive ? "activated" : "deactivated"}`); refetch(); }
  };

  const addGift = async () => {
    if (!name.trim() || !value) { toast.error("Name and value required"); return; }
    const { error } = await supabase.from("gifts").insert({
      gift_name: name.trim(),
      coin_value: parseInt(value),
      category,
    });
    if (error) toast.error(error.message);
    else { toast.success("Gift added!"); setName(""); setValue(""); setShowAdd(false); refetch(); }
  };

  const deleteGift = async (id: string) => {
    const { error } = await supabase.from("gifts").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Gift deleted"); refetch(); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Gifts Management</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20">
          <Plus className="w-4 h-4" /> Add Gift
        </button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <Input placeholder="Gift name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input type="number" placeholder="Coin value" value={value} onChange={(e) => setValue(e.target.value)} />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-sm">
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="luxury">Luxury</option>
            </select>
          </div>
          <button onClick={addGift} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold">Create Gift</button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {gifts?.map((gift) => (
          <motion.div key={gift.id} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className={`bg-card rounded-2xl p-4 shadow-card text-center relative ${!gift.is_active ? "opacity-50" : ""}`}>
            <span className="text-4xl block mb-2">{giftEmojis[gift.gift_name] ?? "🎁"}</span>
            <p className="font-display font-bold text-sm text-foreground">{gift.gift_name}</p>
            <div className="flex items-center justify-center gap-1 mt-1 mb-3">
              <Coins className="w-3 h-3 text-accent" />
              <span className="text-xs font-bold text-accent">{gift.coin_value}</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${gift.category === "luxury" ? "bg-accent/10 text-accent" : gift.category === "premium" ? "bg-primary/10 text-primary" : "bg-muted/30 text-muted-foreground"}`}>{gift.category}</span>
            <div className="absolute top-2 right-2 flex gap-1">
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleActive(gift.id, gift.is_active)} className="p-1 text-muted-foreground hover:text-foreground">
                {gift.is_active ? <ToggleRight className="w-5 h-5 text-online" /> : <ToggleLeft className="w-5 h-5" />}
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
      {(!gifts || gifts.length === 0) && <p className="text-center text-muted-foreground text-sm py-8">No gifts configured</p>}
    </div>
  );
};

export default AdminGifts;
