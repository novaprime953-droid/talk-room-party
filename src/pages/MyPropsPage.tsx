import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Check, X, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyProps, useToggleEquip } from "@/hooks/useProps";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "frame", label: "Frames" },
  { value: "vehicle", label: "Vehicles" },
  { value: "chat_bubble", label: "Bubbles" },
  { value: "decoration", label: "Decor" },
];

const MyPropsPage = () => {
  const navigate = useNavigate();
  const [cat, setCat] = useState("all");
  const { data: myProps, isLoading } = useMyProps();
  const toggle = useToggleEquip();

  const filtered = myProps?.filter(p => {
    if (cat === "all") return true;
    return (p as any).props?.category === cat;
  }) ?? [];

  const isExpired = (p: any) => p.expires_at && new Date(p.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <Sparkles className="w-5 h-5 text-primary" />
        <h1 className="font-display font-bold text-lg text-foreground">My Props</h1>
      </div>

      <div className="px-4 pt-3">
        <Tabs value={cat} onValueChange={setCat}>
          <TabsList className="w-full bg-muted/30">
            {CATEGORIES.map(c => (
              <TabsTrigger key={c.value} value={c.value} className="text-xs flex-1">{c.label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={cat} className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !filtered.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No props yet</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/store")}>
                  Visit Store
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((up) => {
                  const prop = (up as any).props;
                  const expired = isExpired(up);
                  return (
                    <motion.div
                      key={up.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center gap-3 p-3 rounded-2xl bg-card shadow-card border ${
                        up.is_equipped ? "border-primary/50" : "border-border/30"
                      } ${expired ? "opacity-50" : ""}`}
                    >
                      <div className="w-14 h-14 rounded-xl bg-muted/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {prop?.image_url ? (
                          <img src={prop.image_url} alt="" className="w-full h-full object-contain" />
                        ) : <Sparkles className="w-6 h-6 text-primary/40" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-foreground truncate">{prop?.name}</p>
                          {up.is_equipped && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Equipped</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground capitalize">{prop?.category?.replace('_', ' ')}</p>
                        {up.expires_at && (
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {expired ? "Expired" : `Expires ${formatDistanceToNow(new Date(up.expires_at), { addSuffix: true })}`}
                          </p>
                        )}
                      </div>
                      {!expired && (
                        <Button
                          size="sm"
                          variant={up.is_equipped ? "outline" : "default"}
                          className="h-8 text-xs rounded-full"
                          disabled={toggle.isPending}
                          onClick={() => toggle.mutate({
                            userPropId: up.id,
                            equip: !up.is_equipped,
                            category: prop?.category ?? '',
                          })}
                        >
                          {up.is_equipped ? <><X className="w-3 h-3 mr-1" />Remove</> : <><Check className="w-3 h-3 mr-1" />Equip</>}
                        </Button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyPropsPage;
