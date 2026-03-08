import { Package, Coins, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const packages = [
  { id: "PKG-001", coins: 100, price: 1.00, bonus: 0 },
  { id: "PKG-002", coins: 500, price: 4.50, bonus: 25 },
  { id: "PKG-003", coins: 1000, price: 8.00, bonus: 80 },
  { id: "PKG-004", coins: 5000, price: 35.00, bonus: 500 },
  { id: "PKG-005", coins: 10000, price: 60.00, bonus: 1500 },
  { id: "PKG-006", coins: 50000, price: 250.00, bonus: 10000 },
];

const SellerPackages = () => {
  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-2 flex items-center gap-2">
        <Package className="w-6 h-6 text-accent" /> Recharge Packages
      </h1>
      <p className="text-xs text-muted-foreground mb-6">Available coin packages for users</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg, i) => (
          <motion.div
            key={pkg.id}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl shadow-card overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-accent" />
                </div>
                {pkg.bonus > 0 && (
                  <span className="flex items-center gap-1 bg-online/10 text-online text-[10px] font-bold px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" /> +{pkg.bonus.toLocaleString()} Bonus
                  </span>
                )}
              </div>

              <h3 className="font-display font-bold text-2xl text-foreground mb-1">
                {pkg.coins.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground ml-1">coins</span>
              </h3>

              {pkg.bonus > 0 && (
                <p className="text-xs text-online font-semibold mb-2">
                  Total: {(pkg.coins + pkg.bonus).toLocaleString()} coins
                </p>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                <div>
                  <p className="text-[10px] text-muted-foreground">Price</p>
                  <p className="text-lg font-bold text-primary">${pkg.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Package ID</p>
                  <p className="text-xs font-mono text-muted-foreground">{pkg.id}</p>
                </div>
              </div>

              <div className="mt-3 text-right">
                <p className="text-[10px] text-muted-foreground">
                  Rate: ${(pkg.price / pkg.coins * 100).toFixed(1)}¢ / coin
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SellerPackages;
