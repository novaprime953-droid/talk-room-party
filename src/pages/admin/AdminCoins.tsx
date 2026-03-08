import { Coins, Package } from "lucide-react";

const coinPackages = [
  { coins: 100, price: "$0.99", popular: false },
  { coins: 500, price: "$4.99", popular: false },
  { coins: 1000, price: "$9.99", popular: true },
  { coins: 5000, price: "$44.99", popular: false },
  { coins: 10000, price: "$89.99", popular: false },
  { coins: 50000, price: "$399.99", popular: false },
];

const AdminCoins = () => {
  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Coin Packages</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {coinPackages.map((pkg) => (
          <div
            key={pkg.coins}
            className={`bg-card rounded-2xl p-5 shadow-card text-center relative ${
              pkg.popular ? "ring-2 ring-primary" : ""
            }`}
          >
            {pkg.popular && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] px-3 py-0.5 rounded-full gradient-primary text-primary-foreground font-bold">
                POPULAR
              </span>
            )}
            <Coins className="w-8 h-8 text-accent mx-auto mb-2" />
            <p className="text-2xl font-display font-bold text-foreground">{pkg.coins.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mb-3">coins</p>
            <p className="text-lg font-bold text-primary">{pkg.price}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        Coin package pricing is configured here. Payment gateway integration required for live purchases.
      </p>
    </div>
  );
};

export default AdminCoins;
