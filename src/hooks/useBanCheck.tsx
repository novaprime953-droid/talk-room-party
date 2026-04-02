import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useBanCheck = () => {
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) return;

    const checkBan = async () => {
      const { data } = await supabase
        .from("bans")
        .select("id, reason, ban_type, expires_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (data) {
        // Check if temporary ban has expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          // Ban expired, deactivate it
          await supabase.from("bans").update({ is_active: false } as any).eq("id", data.id);
          return;
        }

        toast.error(`Your account is banned: ${data.reason}`);
        await signOut();
      }
    };

    checkBan();
  }, [user, signOut]);
};
