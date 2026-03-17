// supabase/functions/send-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { token, title, body, data } = await req.json();

    if (!token || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: token, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[EDGE] Sending to token:", token.substring(0, 40));

    const payload = {
      to: token,
      title,
      body,
      data: data || {},
      sound: "default",
      badge: 1,
      channelId: "default",
    };

    const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const expoResult = await expoResponse.json();
    console.log("[EDGE] Expo HTTP status:", expoResponse.status);
    console.log("[EDGE] Expo response:", JSON.stringify(expoResult));

    // Expo always returns 200 — check inner status
    const inner = expoResult?.data;
    if (inner?.status === "error") {
      console.log("[EDGE] Expo inner error:", inner.message, inner.details);
      // Still return 200 so the client doesn't treat it as a hard failure
      return new Response(
        JSON.stringify({ success: false, expoError: inner }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, result: expoResult }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.log("[EDGE] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
