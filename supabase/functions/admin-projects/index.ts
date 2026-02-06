import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create client for user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user and check admin role
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.log("Auth error:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin using service role
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      console.log("User is not admin:", user.id);
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Admin verified:", user.id);

    // Parse URL for query params
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";

    // Fetch all projects using service role
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from("projects")
      .select("id, name, slug, user_id, created_at, last_sync_at, is_public")
      .order("created_at", { ascending: false });

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
      throw projectsError;
    }

    console.log(`Found ${projects?.length || 0} projects`);

    // Get unique user IDs
    const userIds = [...new Set(projects?.map((p) => p.user_id) || [])];

    // Fetch profiles for all project owners
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, full_name, email")
      .in("user_id", userIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
    }

    // Fetch integrations for all projects
    const projectIds = projects?.map((p) => p.id) || [];
    const { data: integrations, error: integrationsError } = await supabaseAdmin
      .from("integrations")
      .select("project_id, type, is_active")
      .in("project_id", projectIds)
      .eq("is_active", true);

    if (integrationsError) {
      console.error("Error fetching integrations:", integrationsError);
    }

    // Create lookup maps
    const profileMap = new Map(
      profiles?.map((p) => [p.user_id, { full_name: p.full_name, email: p.email }]) || []
    );
    
    const integrationMap = new Map<string, string[]>();
    integrations?.forEach((i) => {
      const existing = integrationMap.get(i.project_id) || [];
      if (!existing.includes(i.type)) {
        existing.push(i.type);
      }
      integrationMap.set(i.project_id, existing);
    });

    // Build response with owner info
    const enrichedProjects = projects?.map((project) => {
      const owner = profileMap.get(project.user_id) || { full_name: null, email: null };
      const projectIntegrations = integrationMap.get(project.id) || [];

      return {
        id: project.id,
        name: project.name,
        slug: project.slug,
        user_id: project.user_id,
        created_at: project.created_at,
        last_sync_at: project.last_sync_at,
        is_public: project.is_public,
        owner: {
          user_id: project.user_id,
          full_name: owner.full_name,
          email: owner.email,
        },
        integrations: projectIntegrations,
      };
    }) || [];

    // Filter by search term if provided
    const filteredProjects = search
      ? enrichedProjects.filter((p) => {
          const searchLower = search.toLowerCase();
          return (
            p.name?.toLowerCase().includes(searchLower) ||
            p.owner.full_name?.toLowerCase().includes(searchLower) ||
            p.owner.email?.toLowerCase().includes(searchLower)
          );
        })
      : enrichedProjects;

    console.log(`Returning ${filteredProjects.length} projects after filtering`);

    return new Response(
      JSON.stringify({ projects: filteredProjects }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in admin-projects:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
