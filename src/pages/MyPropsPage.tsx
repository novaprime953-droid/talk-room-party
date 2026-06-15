import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Check, X, Clock, ShoppingBag } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMyProps, useToggleEquip } from "@/hooks/useProps";
import { useUserBadges, useBadges } from "@/hooks/useBadges";
import { useUserTitles, useEquipTitle, useEquipBadge, useEquipFrame } from "@/hooks/useTitles";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "frame", label: "Frames" },
  { value: "vehicle", label: "Vehicles" },
  { value: "chat_bubble", label: "Bubbles" },
  { value: "badge", label: "Badges" },
  { value: "title", label: "Titles" },
];

const MyPropsPage = () => {
  const navigate = useNavigate();
  const [cat, setCat] = useState("frame");
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: myProps, isLoading } = useMyProps();
  const { data: myBadges } = useUserBadges(user?.id);
  const { data: allBadges } = useBadges();
  const { data: myTitles } = useUserTitles(user?.id);
  const toggleProp = useToggleEquip();
  const equipFrame = useEquipFrame();
  const equipBadge = useEquipBadge();
  const equipTitle = useEquipTitle();

  const propsByCat = (c: string) => (myProps ?? []).filter((p) => (p as any).props?.category === c);

  const isExpired = (p: any) => p.expires_at && new Date(p.expires_at) < new Date();

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </motion.button>
        <ShoppingBag className="w-5 h-5 text-primary" />
        <h1 className="font-display font-bold text-lg text-foreground">My Bag</h1>
      </div>

      <div className="px-4 pt-3">
        <Tabs value={cat} onValueChange={setCat}>
          <TabsList className="w-full bg-muted/30 grid grid-cols-5">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.value} value={c.value} className="text-[11px]">{c.label}</TabsTrigger>
            ))}
          </TabsList>

          {/* PROPS sections (frame/vehicle/chat_bubble) */}
          {(["frame", "vehicle", "chat_bubble"] as const).map((c) => (
            <TabsContent key={c} value={c} className="mt-4">
              {isLoading ? <Spinner /> : (() => {
                const list = propsByCat(c);
                if (!list.length) return <Empty onShop={() => navigate("/store")} />;
                return (
                  <div className="space-y-3">
                    {list.map((up) => {
                      const prop = (up as any).props;
                      const expired = isExpired(up);
                      const onToggle = () => {
                        if (c === "frame") {
                          equipFrame.mutate(up.is_equipped ? null : up.id, {
                            onSuccess: () => toast.success(up.is_equipped ? "Frame removed" : "Frame equipped"),
                            onError: (e: any) => toast.error(e.message),
                          });
                        } else {
                          toggleProp.mutate({ userPropId: up.id, equip: !up.is_equipped, category: c });
                        }
                      };
                      return (
                        <Row key={up.id} equipped={up.is_equipped} expired={expired} title={prop?.name} subtitle={prop?.category?.replace("_", " ")}
                          image={prop?.image_url} expiresAt={up.expires_at} onToggle={onToggle} />
                      );
                    })}
                  </div>
                );
              })()}
            </TabsContent>
          ))}

          {/* BADGES */}
          <TabsContent value="badge" className="mt-4">
            {!myBadges?.length ? <Empty msg="No badges yet" /> : (
              <div className="space-y-3">
                {myBadges.map((b) => {
                  const equipped = profile?.equipped_badge_key === b.key;
                  return (
                    <Row key={b.key} equipped={equipped} title={b.name} subtitle="Badge" image={b.image_url}
                      onToggle={() => equipBadge.mutate(equipped ? null : b.key, {
                        onSuccess: () => toast.success(equipped ? "Removed" : "Equipped"),
                        onError: (e: any) => toast.error(e.message),
                      })}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TITLES */}
          <TabsContent value="title" className="mt-4">
            {!myTitles?.length ? <Empty msg="No titles yet" /> : (
              <div className="space-y-3">
                {myTitles.map((t) => {
                  const equipped = profile?.equipped_title_id === t.id;
                  return (
                    <Row key={t.id} equipped={equipped} title={t.name} subtitle="Title" image={t.image_url}
                      onToggle={() => equipTitle.mutate(equipped ? null : t.id, {
                        onSuccess: () => toast.success(equipped ? "Removed" : "Equipped"),
                        onError: (e: any) => toast.error(e.message),
                      })}
                    />
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

const Spinner = () => (
  <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
);

const Empty = ({ onShop, msg }: { onShop?: () => void; msg?: string }) => (
  <div className="text-center py-12 text-muted-foreground">
    <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-40" />
    <p className="text-sm">{msg ?? "Nothing here yet"}</p>
    {onShop && (
      <Button variant="outline" size="sm" className="mt-3" onClick={onShop}>Visit Store</Button>
    )}
  </div>
);

interface RowProps { equipped?: boolean; expired?: boolean; title?: string; subtitle?: string; image?: string | null; expiresAt?: string | null; onToggle: () => void; }
const Row = ({ equipped, expired, title, subtitle, image, expiresAt, onToggle }: RowProps) => (
  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
    className={`flex items-center gap-3 p-3 rounded-2xl bg-card shadow-card border ${equipped ? "border-primary/50" : "border-border/30"} ${expired ? "opacity-50" : ""}`}>
    <div className="w-14 h-14 rounded-xl bg-muted/20 flex items-center justify-center overflow-hidden flex-shrink-0">
      {image ? <img src={image} alt="" className="w-full h-full object-contain" /> : <Sparkles className="w-6 h-6 text-primary/40" />}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p className="text-sm font-bold text-foreground truncate">{title}</p>
        {equipped && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">Equipped</span>}
      </div>
      <p className="text-[10px] text-muted-foreground capitalize">{subtitle}</p>
      {expiresAt && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
          <Clock className="w-3 h-3" />
          {expired ? "Expired" : `Expires ${formatDistanceToNow(new Date(expiresAt), { addSuffix: true })}`}
        </p>
      )}
    </div>
    {!expired && (
      <Button size="sm" variant={equipped ? "outline" : "default"} className="h-8 text-xs rounded-full" onClick={onToggle}>
        {equipped ? <><X className="w-3 h-3 mr-1" />Remove</> : <><Check className="w-3 h-3 mr-1" />Equip</>}
      </Button>
    )}
  </motion.div>
);

export default MyPropsPage;
