// supabase/functions/link-student-auth/index.ts
// After a student sets their password (signUp), their auth UUID differs from
// the profile/student UUID created by the teacher. This function uses the
// service role key to update profiles.id and students.id to match auth.users.id,
// so all three tables share the same UUID.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { auth_user_id, email } = await req.json();

    if (!auth_user_id || !email) {
      return new Response(
        JSON.stringify({ error: "auth_user_id and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service role bypasses RLS — can update any row
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const normalizedEmail = email.toLowerCase().trim();

    // Update profiles.id to match the auth user id
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ id: auth_user_id })
      .eq("email", normalizedEmail);

    if (profileError) {
      console.error("Profile update error:", profileError);
      return new Response(
        JSON.stringify({ error: "Failed to update profile: " + profileError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update students.id to match the auth user id
    // Safe for new students who have no FK references yet (no attendance/quiz records)
    const { error: studentError } = await supabaseAdmin
      .from("students")
      .update({ id: auth_user_id })
      .eq("email", normalizedEmail)
      .eq("is_deleted", false);

    if (studentError) {
      console.warn("Student id update failed (may have FK references):", studentError.message);
      // Non-fatal: profile id is already synced, email lookups still work
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("link-student-auth error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
