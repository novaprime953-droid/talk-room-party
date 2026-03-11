import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

export interface GameConfig {
  enabled: boolean;
  min_coins: number;
}

export interface GameSettings {
  audio_casino: GameConfig;
  ferry_wheel: GameConfig;
  teen_patti: GameConfig;
}

const DEFAULT_SETTINGS: GameSettings = {
  audio_casino: { enabled: true, min_coins: 100 },
  ferry_wheel: { enabled: true, min_coins: 50 },
  teen_patti: { enabled: true, min_coins: 200 },
};

export const GAMES = [
  {
    key: "audio_casino" as const,
    name: "Audio Casino",
    icon: "🎰",
    url: "https://rayziaudiocasino.codderlab.com/",
    color: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
  },
  {
    key: "ferry_wheel" as const,
    name: "Ferry Wheel",
    icon: "🎡",
    url: "https://rayziaudioferrywheel.codderlab.com/",
    color: "from-emerald-500/20 to-teal-500/20",
    border: "border-emerald-500/30",
  },
  {
    key: "teen_patti" as const,
    name: "Teen Patti",
    icon: "🃏",
    url: "https://rayziaudioteenpatti.codderlab.com/",
    color: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/30",
  },
];

export const useGameSettings = () => {
  return useQuery({
    queryKey: ["game-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "game_settings")
        .single();
      if (data?.value) return data.value as unknown as GameSettings;
      return DEFAULT_SETTINGS;
    },
    staleTime: 60_000,
  });
};

export const useStartGame = () => {
  const startGame = async (userId: string, gameName: string, coinsRequired: number) => {
    const { data, error } = await supabase.rpc("start_game", {
      p_user_id: userId,
      p_game_name: gameName,
      p_coins_required: coinsRequired,
    });
    if (error) throw error;
    return data as { success: boolean; transaction_id: string; new_balance: number };
  };
  return { startGame };
};
