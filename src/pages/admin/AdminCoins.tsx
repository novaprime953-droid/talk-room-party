import { useState } from "react";
import { Coins, Package, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const defaultPackages = [
  { coins: 100, price: "$0.99", popular: false },
  { coins: 500, price: "$4.99", popular: false },
  { coins: 1000, price: "$9.99", popular: true },
  { coins: 5000, price: "$44.99", popular: false },
  { coins: 10000, price: "$89.99", popular: false },
  { coins: 50000, price: "$399.99", popular: false },
];

const AdminCoins = () => {
  const [packages, setPackages] = useState(defaultPackages);
  const [showAdd, setShowAdd] = useState(false);
  const [newCoins, setNewCoins] = useState("");
  const [newPrice, setNewPrice] = useState("");

  const addPackage = () => {
    if (!newCoins || !newPrice) { toast.error("Fill all fields"); return; }
    setPackages([...packages, { coins: parseInt(newCoins), price: `$${newPrice}`, popular: false }]);
    toast.success("Package added!");
    setNewCoins(""); setNewPrice(""); setShowAdd(false);
  };

  const removePackage = (idx: number) => {
    setPackages(packages.filter((_, i) => i !== idx));
    toast.success("Package removed");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-bold text-2xl text-foreground">Coin Packages</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20">
          <Plus className="w-4 h-4" /> Add Package
        </button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-2xl p-4 shadow-card mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input type="number" placeholder="Coins amount" value={newCoins} onChange={(e) => setNewCoins(e.target.value)} />
            <Input type="number" placeholder="Price (USD)" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
          </div>
          <button onClick={addPackage} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold">Add</button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {packages.map((pkg, idx) => (
          <div key={idx} className={`bg-card rounded-2xl p-5 shadow-card text-center relative ${pkg.popular ? "ring-2 ring-primary" : ""}`}>
            {pkg.popular && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] px-3 py-0.5 rounded-full gradient-primary text-primary-foreground font-bold">POPULAR</span>
            )}
            <Coins className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">{pkg.coins.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mb-3">coins</p>
            <p className="text-lg font-bold text-primary">{pkg.price}</p>
            <button onClick={() => removePackage(idx)} className="mt-2 text-[10px] text-destructive hover:underline">Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCoins;
