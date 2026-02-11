import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    let userId: string;
    if (claimsError || !claimsData?.claims) {
      const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
      if (userError || !userData.user) throw new Error("Authentication failed");
      userId = userData.user.id;
    } else {
      userId = claimsData.claims.sub as string;
    }

    // Parse request body
    const { project_id } = await req.json();
    if (!project_id) throw new Error("project_id is required");

    // Validate ownership or admin
    const { data: project, error: projectError } = await supabaseClient
      .from("projects")
      .select("id, user_id")
      .eq("id", project_id)
      .single();

    if (projectError || !project) throw new Error("Project not found");

    // Check if user owns the project or is admin
    if (project.user_id !== userId) {
      const { data: roleData } = await supabaseClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .single();

      if (!roleData) throw new Error("Not authorized to delete this project");
    }

    // Cascading delete in order
    const tables = [
      { table: "metrics_cache", field: "project_id" },
      { table: "daily_reports", field: "project_id" },
      { table: "integrations", field: "project_id" },
      { table: "ad_spend", field: "project_id" },
      { table: "sales", field: "project_id" },
    ] as const;

    for (const { table, field } of tables) {
      const { error } = await supabaseClient
        .from(table)
        .delete()
        .eq(field, project_id);
      if (error) {
        console.error(`Failed to delete from ${table}:`, error);
        throw new Error(`Failed to delete ${table}: ${error.message}`);
      }
    }

    // Finally delete the project itself
    const { error: deleteError } = await supabaseClient
      .from("projects")
      .delete()
      .eq("id", project_id);
    if (deleteError) throw new Error(`Failed to delete project: ${deleteError.message}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[DELETE-PROJECT] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
