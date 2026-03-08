import { Megaphone, TrendingUp, Users, Zap } from "lucide-react";
import { motion } from "framer-motion";

const promotionIdeas = [
  { icon: Zap, title: "Flash Sale", desc: "50% bonus coins on all recharges", status: "Draft" },
  { icon: Users, title: "Refer a Friend", desc: "Earn 100 coins for each referral", status: "Draft" },
  { icon: TrendingUp, title: "Top Host Rewards", desc: "Weekly bonus for top-performing hosts", status: "Draft" },
  { icon: Megaphone, title: "New User Welcome", desc: "Free 50 coins for new signups", status: "Draft" },
];

const AdminPromotions = () => {
  return (
    <div>
      <h1 className="font-display font-bold text-2xl text-foreground mb-6">Promotions</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {promotionIdeas.map((promo, i) => (
          <motion.div
            key={promo.title}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-2xl p-5 shadow-card"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <promo.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-display font-bold text-sm text-foreground">{promo.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted/30 text-muted-foreground font-bold">
                    {promo.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{promo.desc}</p>
                <motion.button whileTap={{ scale: 0.95 }}
                  className="text-xs font-bold text-primary hover:text-primary/80">
                  Configure →
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-8">
        Promotion campaigns can be configured and scheduled here. Connect a payment system to activate live promotions.
      </p>
    </div>
  );
};

export default AdminPromotions;
