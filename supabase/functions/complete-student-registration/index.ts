// Edge Function: complete-student-registration
// Uses Supabase Admin REST API (no supabase-js import) to create auth user
// with the EXACT same UUID already in students.id and profiles.id.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: "email and password are required" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Look up student by email using REST API
    const studentRes = await fetch(
      `${SUPABASE_URL}/rest/v1/students?email=eq.${encodeURIComponent(normalizedEmail)}&is_deleted=eq.false&select=id,full_name,roll_number,has_registered&limit=1`,
      {
        headers: {
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    );

    const students = await studentRes.json();
    console.log("[REG] Student lookup:", JSON.stringify(students));

    if (!Array.isArray(students) || students.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Student not found. Contact your teacher." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const student = students[0];

    if (student.has_registered) {
      return new Response(
        JSON.stringify({ success: false, error: "Already registered. Please sign in instead." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[REG] Creating auth user with id:", student.id);

    // Create auth user via Admin API with the exact same UUID
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: student.id,
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: student.full_name,
          role: "student",
          roll_number: student.roll_number,
        },
      }),
    });

    const createResult = await createRes.json();
    console.log("[REG] Admin createUser response:", JSON.stringify(createResult));

    if (createResult.error || !createResult.id) {
      const errMsg = createResult.error?.message || createResult.msg || "Failed to create auth user";
      return new Response(
        JSON.stringify({ success: false, error: errMsg }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark student as registered
    await fetch(
      `${SUPABASE_URL}/rest/v1/students?id=eq.${student.id}`,
      {
        method: "PATCH",
        headers: {
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ has_registered: true }),
      }
    );

    console.log("[REG] Done — student registered with id:", student.id);

    return new Response(
      JSON.stringify({ success: true, userId: createResult.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[REG] Unhandled error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
