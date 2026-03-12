import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Find expired user props that are still active
    const { data: expired, error: fetchErr } = await supabase
      .from("user_props")
      .select("id, user_id, prop_id, props(name)")
      .eq("status", "active")
      .not("expires_at", "is", null)
      .lt("expires_at", new Date().toISOString());

    if (fetchErr) throw fetchErr;

    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({ expired: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Mark as expired
    const ids = expired.map((e: any) => e.id);
    const { error: updateErr } = await supabase
      .from("user_props")
      .update({ status: "expired", is_equipped: false })
      .in("id", ids);

    if (updateErr) throw updateErr;

    // Send notifications
    const notifications = expired.map((e: any) => ({
      user_id: e.user_id,
      title: "Prop Expired",
      message: `Your "${(e as any).props?.name || "prop"}" has expired.`,
      type: "prop_expired",
    }));

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({ expired: ids.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
