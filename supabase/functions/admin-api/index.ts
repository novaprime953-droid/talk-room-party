import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace("/admin-api", "");
    const body = req.method !== "GET" ? await req.json() : null;

    // Check admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const userRoles = roles?.map((r: any) => r.role) ?? [];
    const isAdmin = userRoles.some((r: string) =>
      ["admin", "super_admin", "owner", "manager"].includes(r)
    );

    // Route handling
    if (path === "/stats" && req.method === "GET") {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const [users, rooms, reports, recharges] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("voice_rooms").select("id", { count: "exact", head: true }).eq("is_live", true),
        supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("recharge_requests").select("amount").eq("status", "completed"),
      ]);

      const totalRevenue = recharges.data?.reduce((sum: number, r: any) => sum + Number(r.amount), 0) ?? 0;

      return new Response(
        JSON.stringify({
          total_users: users.count ?? 0,
          active_rooms: rooms.count ?? 0,
          pending_reports: reports.count ?? 0,
          total_revenue: totalRevenue,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (path === "/ban-user" && req.method === "POST") {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { target_user_id, reason, ban_type, expires_at } = body;
      const { error } = await supabase.from("bans").insert({
        user_id: target_user_id,
        banned_by: user.id,
        reason,
        ban_type: ban_type || "temporary",
        expires_at,
      });

      if (error) throw error;

      // Send notification
      await supabase.from("notifications").insert({
        user_id: target_user_id,
        title: "Account Suspended",
        message: `Your account has been suspended. Reason: ${reason}`,
        type: "moderation",
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "/resolve-report" && req.method === "POST") {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { report_id, status, resolution_note } = body;
      const { error } = await supabase
        .from("reports")
        .update({ status, resolution_note, resolved_by: user.id })
        .eq("id", report_id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "/create-user" && req.method === "POST") {
      const isOwner = userRoles.includes("owner");
      if (!isOwner) {
        return new Response(JSON.stringify({ error: "Only the owner can create users with roles" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { email, password, username, phone, role, display_name } = body;
      if (!email || !role) {
        return new Response(JSON.stringify({ error: "Email and role are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const normalizedEmail = String(email).trim().toLowerCase();

      // Create user via admin API when this is a brand-new email
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          username: username || normalizedEmail.split("@")[0],
          display_name: display_name || username || normalizedEmail.split("@")[0],
        },
      });

      let targetUserId = newUser.user?.id;

      // If user already exists, reuse that account and continue with role assignment
      if (createError) {
        const isDuplicateEmail = createError.message
          ?.toLowerCase()
          .includes("already been registered");

        if (!isDuplicateEmail) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id")
          .ilike("email", normalizedEmail)
          .maybeSingle();

        if (profileError) throw profileError;

        if (!existingProfile?.user_id) {
          return new Response(JSON.stringify({ error: "User already exists but profile was not found" }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        targetUserId = existingProfile.user_id;
      }

      if (!targetUserId) {
        return new Response(JSON.stringify({ error: "Failed to resolve target user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update profile with phone if provided
      if (phone) {
        await supabase.from("profiles").update({ phone }).eq("user_id", targetUserId);
      }

      // Assign requested role idempotently (the trigger already assigns 'user' for new signups)
      if (role !== "user") {
        const { error: roleError } = await supabase.from("user_roles").upsert(
          {
            user_id: targetUserId,
            role,
            granted_by: user.id,
          },
          { onConflict: "user_id,role" }
        );

        if (roleError) throw roleError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          user_id: targetUserId,
          reused_existing_user: Boolean(createError),
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (path === "/assign-role" && req.method === "POST") {
      const isOwnerOrSuperAdmin = userRoles.some((r: string) =>
        ["owner", "super_admin"].includes(r)
      );
      if (!isOwnerOrSuperAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { target_user_id, role } = body;
      const { error } = await supabase.from("user_roles").upsert(
        { user_id: target_user_id, role, granted_by: user.id },
        { onConflict: "user_id,role" }
      );

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "/approve-agency" && req.method === "POST") {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { agency_id, status: agencyStatus } = body;
      const { error } = await supabase
        .from("agencies")
        .update({ status: agencyStatus, approved_by: user.id })
        .eq("id", agency_id);

      if (error) throw error;

      if (agencyStatus === "approved") {
        const { data: agency } = await supabase
          .from("agencies")
          .select("owner_id")
          .eq("id", agency_id)
          .single();

        if (agency) {
          await supabase.from("user_roles").upsert(
            { user_id: agency.owner_id, role: "agency_owner", granted_by: user.id },
            { onConflict: "user_id,role" }
          );
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "/process-withdrawal" && req.method === "POST") {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { withdrawal_id, status: wStatus } = body;
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({ status: wStatus, processed_by: user.id })
        .eq("id", withdrawal_id);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "/broadcast" && req.method === "POST") {
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { title, message, type } = body;
      // Get all user IDs
      const { data: users } = await supabase.from("profiles").select("user_id");
      if (users && users.length > 0) {
        const notifications = users.map((u: any) => ({
          user_id: u.user_id,
          title,
          message,
          type: type || "system",
        }));
        await supabase.from("notifications").insert(notifications);
      }

      return new Response(JSON.stringify({ success: true, count: users?.length ?? 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (path === "/delete-user" && req.method === "POST") {
      const isOwner = userRoles.includes("owner");
      if (!isOwner) {
        return new Response(JSON.stringify({ error: "Only the owner can delete users" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { target_user_id } = body;
      if (!target_user_id) {
        return new Response(JSON.stringify({ error: "target_user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Prevent deleting owner
      const { data: targetRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", target_user_id);
      
      if (targetRoles?.some((r: any) => r.role === "owner")) {
        return new Response(JSON.stringify({ error: "Cannot delete the owner" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Try soft-delete approach: ban + delete
      try {
        await supabase.auth.admin.updateUserById(target_user_id, { ban_duration: "876600h" });
      } catch (_) { /* ignore */ }
      
      const { error: delError } = await supabase.auth.admin.deleteUser(target_user_id, true);
      if (delError) {
        // If still fails, try without shouldSoftDelete
        const { error: delError2 } = await supabase.auth.admin.deleteUser(target_user_id);
        if (delError2) throw delError2;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[admin-api] unhandled error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
