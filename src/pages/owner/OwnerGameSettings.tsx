import { useState, useEffect } from "react";
import { Gamepad2, Coins, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import EmptyState from "@/components/EmptyState";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface GameConfig {
  enabled: boolean;
  min_coins: number;
}

interface GameSettings {
  audio_casino: GameConfig;
  ferry_wheel: GameConfig;
  teen_patti: GameConfig;
}

const GAME_LABELS: Record<string, { name: string; icon: string }> = {
  audio_casino: { name: "Audio Casino", icon: "🎰" },
  ferry_wheel: { name: "Ferry Wheel", icon: "🎡" },
  teen_patti: { name: "Teen Patti", icon: "🃏" },
};

const DEFAULT: GameSettings = {
  audio_casino: { enabled: true, min_coins: 100 },
  ferry_wheel: { enabled: true, min_coins: 50 },
  teen_patti: { enabled: true, min_coins: 200 },
};

const OwnerGameSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<GameSettings>(DEFAULT);
  const [saving, setSaving] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["game-settings-owner"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "game_settings")
        .single();
      return (data?.value as unknown as GameSettings) ?? DEFAULT;
    },
  });

  useEffect(() => {
    if (data) setSettings(data);
  }, [data]);

  const { data: transactions } = useQuery({
    queryKey: ["game-transactions-stats"],
    queryFn: async () => {
      const { data } = await supabase
        .from("game_transactions")
        .select("coins_used, game_name")
        .order("created_at", { ascending: false })
        .limit(500);
      return data ?? [];
    },
  });

  const totalRevenue = transactions?.reduce((sum, t) => sum + (t.coins_used ?? 0), 0) ?? 0;
  const revenueByGame = transactions?.reduce((acc, t) => {
    acc[t.game_name] = (acc[t.game_name] ?? 0) + (t.coins_used ?? 0);
    return acc;
  }, {} as Record<string, number>) ?? {};

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .update({ value: settings as any, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq("key", "game_settings");
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["game-settings"] });
      toast.success("Game settings saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" /> Game Settings
          </h2>
          <p className="text-sm text-muted-foreground">Configure games, minimum coins, and view revenue</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>

      {/* Revenue summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Game Revenue</p>
          <p className="text-2xl font-bold text-foreground mt-1 flex items-center gap-1">
            <Coins className="w-5 h-5 text-accent" /> {totalRevenue.toLocaleString()}
          </p>
        </div>
        {Object.entries(GAME_LABELS).map(([key, { name, icon }]) => (
          <div key={key} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{icon} {name}</p>
            <p className="text-xl font-bold text-foreground mt-1">{(revenueByGame[name] ?? 0).toLocaleString()} coins</p>
          </div>
        ))}
      </div>

      {/* Game configs */}
      <div className="space-y-4">
        {(Object.keys(GAME_LABELS) as Array<keyof GameSettings>).map((key) => {
          const { name, icon } = GAME_LABELS[key];
          const config = settings[key];
          return (
            <div key={key} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{icon}</span>
                  <div>
                    <h3 className="font-bold text-foreground">{name}</h3>
                    <p className="text-xs text-muted-foreground">Configure game settings</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabled}
                    onChange={(e) => setSettings({ ...settings, [key]: { ...config, enabled: e.target.checked } })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full" />
                </label>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground whitespace-nowrap">Min Coins:</label>
                <input
                  type="number"
                  min={1}
                  value={config.min_coins}
                  onChange={(e) => setSettings({ ...settings, [key]: { ...config, min_coins: Math.max(1, parseInt(e.target.value) || 1) } })}
                  className="w-28 bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OwnerGameSettings;
