import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Coins, ShoppingBag, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStoreProps, usePurchaseProp, useMyProps } from "@/hooks/useProps";
import { useProfile } from "@/hooks/useProfile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "frame", label: "🖼 Frames" },
  { value: "vehicle", label: "🚗 Vehicles" },
  { value: "chat_bubble", label: "💬 Bubbles" },
  { value: "decoration", label: "✨ Decorations" },
];

const StorePage = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState("all");
  const [confirmProp, setConfirmProp] = useState<any>(null);
  const { data: props, isLoading } = useStoreProps(category);
  const { data: profile } = useProfile();
  const { data: myProps } = useMyProps();
  const purchase = usePurchaseProp();

  const ownedPropIds = new Set(myProps?.map(p => p.prop_id) ?? []);

  const handleBuy = () => {
    if (!confirmProp) return;
    purchase.mutate(confirmProp.id, { onSuccess: () => setConfirmProp(null) });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <ShoppingBag className="w-5 h-5 text-primary" />
        <h1 className="font-display font-bold text-lg text-foreground">Store</h1>
        <div className="ml-auto flex items-center gap-1 bg-muted/40 px-3 py-1 rounded-full">
          <Coins className="w-4 h-4 text-accent" />
          <span className="text-sm font-bold text-foreground">{profile?.coins_balance?.toLocaleString() ?? 0}</span>
        </div>
      </div>

      <div className="px-4 pt-3">
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="w-full bg-muted/30 overflow-x-auto">
            {CATEGORIES.map(c => (
              <TabsTrigger key={c.value} value={c.value} className="text-xs flex-1">{c.label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={category} className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !props?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No props available yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {props.map((prop, i) => {
                  const owned = ownedPropIds.has(prop.id);
                  return (
                    <motion.div
                      key={prop.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-card rounded-2xl p-3 shadow-card border border-border/30"
                    >
                      <div className="aspect-square bg-muted/20 rounded-xl flex items-center justify-center mb-2 overflow-hidden">
                        {prop.image_url ? (
                          <img src={prop.image_url} alt={prop.name} className="w-full h-full object-contain" />
                        ) : (
                          <Sparkles className="w-8 h-8 text-primary/40" />
                        )}
                      </div>
                      <p className="text-sm font-bold text-foreground truncate">{prop.name}</p>
                      <p className="text-[10px] text-muted-foreground capitalize mb-2">
                        {prop.category.replace('_', ' ')}
                        {prop.duration_days ? ` · ${prop.duration_days}d` : ' · Permanent'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-xs font-bold text-accent">
                          <Coins className="w-3 h-3" />{prop.price}
                        </span>
                        <Button
                          size="sm"
                          disabled={owned || purchase.isPending}
                          onClick={() => setConfirmProp(prop)}
                          className="h-7 text-xs px-3 rounded-full"
                          variant={owned ? "outline" : "default"}
                        >
                          {owned ? "Owned" : "Buy"}
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Purchase confirmation */}
      <Dialog open={!!confirmProp} onOpenChange={() => setConfirmProp(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Purchase</DialogTitle>
          </DialogHeader>
          {confirmProp && (
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto bg-muted/20 rounded-xl flex items-center justify-center">
                {confirmProp.image_url ? (
                  <img src={confirmProp.image_url} alt="" className="w-full h-full object-contain rounded-xl" />
                ) : <Sparkles className="w-8 h-8 text-primary/40" />}
              </div>
              <p className="font-bold text-foreground">{confirmProp.name}</p>
              <p className="text-sm text-muted-foreground">
                {confirmProp.duration_days ? `${confirmProp.duration_days} days` : 'Permanent'}
              </p>
              <div className="flex items-center justify-center gap-1 text-lg font-bold text-accent">
                <Coins className="w-5 h-5" />{confirmProp.price} coins
              </div>
              {(profile?.coins_balance ?? 0) < confirmProp.price && (
                <p className="text-xs text-destructive">Insufficient coins</p>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmProp(null)} className="flex-1">Cancel</Button>
            <Button
              onClick={handleBuy}
              disabled={purchase.isPending || (profile?.coins_balance ?? 0) < (confirmProp?.price ?? 0)}
              className="flex-1"
            >
              {purchase.isPending ? "Buying..." : "Buy Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StorePage;
