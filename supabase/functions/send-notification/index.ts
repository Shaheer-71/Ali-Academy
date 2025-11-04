// supabase/functions/send-notification/index.ts
// Send notifications via Expo Push Notification Service

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
    console.log("🔔 [EDGE] Notification request received");
    console.log("🔔 [EDGE] Method:", req.method);

    if (req.method !== "POST") {
        console.log("❌ [EDGE] Invalid method:", req.method);
        return new Response("Method not allowed", { status: 405 });
    }

    try {
        const requestBody = await req.json();
        console.log("📨 [EDGE] Request body:", requestBody);

        const { token, title, body, data } = requestBody;

        // Validate required fields
        if (!token || !title || !body) {
            console.log("❌ [EDGE] Missing required fields");
            console.log("❌ [EDGE] Received:", { token: !!token, title: !!title, body: !!body });
            return new Response(
                JSON.stringify({ error: "Missing required fields: token, title, body" }),
                { status: 400 }
            );
        }

        console.log("📤 [EDGE] Sending to Expo Push Service...");
        console.log("📤 [EDGE] Token:", token.substring(0, 50) + "...");
        console.log("📤 [EDGE] Title:", title);
        console.log("📤 [EDGE] Body:", body);

        // Send to Expo Push Notification Service
        const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                to: token,
                title: title,
                body: body,
                data: data || {},
                sound: "default",
                badge: 1,
            }),
        });

        const expoResult = await expoResponse.json();
        console.log("✅ [EDGE] Expo Response:", expoResult);

        if (expoResponse.ok) {
            console.log("✅ [EDGE] Notification sent successfully");
            return new Response(
                JSON.stringify({ success: true, result: expoResult }),
                { status: 200 }
            );
        } else {
            console.log("❌ [EDGE] Expo Error:", expoResult);
            return new Response(
                JSON.stringify({ error: "Expo send failed", details: expoResult }),
                { status: expoResponse.status }
            );
        }
    } catch (error) {
        console.log("❌ [EDGE] CATCH Error:", error);
        console.log("❌ [EDGE] Error message:", error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500 }
        );
    }
});