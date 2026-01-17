import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ADMIN-USERS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create regular client for auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    logStep("Checking admin role", { userId: user.id });

    // Check if user has admin role using service role client
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (roleError || !roleData) {
      logStep("Admin check failed", { error: roleError?.message });
      return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Admin verified");

    const method = req.method;
    const url = new URL(req.url);

    if (method === "GET") {
      // List all users with their data
      logStep("Fetching all users");

      // Get all profiles
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      // Get project counts per user
      const { data: projectCounts, error: projectsError } = await supabaseAdmin
        .from("projects")
        .select("user_id");

      if (projectsError) {
        throw new Error(`Failed to fetch projects: ${projectsError.message}`);
      }

      // Count projects per user
      const projectCountMap: Record<string, number> = {};
      projectCounts?.forEach((p) => {
        projectCountMap[p.user_id] = (projectCountMap[p.user_id] || 0) + 1;
      });

      // Get all overrides
      const { data: overrides, error: overridesError } = await supabaseAdmin
        .from("user_overrides")
        .select("*");

      if (overridesError) {
        throw new Error(`Failed to fetch overrides: ${overridesError.message}`);
      }

      const overrideMap: Record<string, { extra_projects: number; notes: string | null }> = {};
      overrides?.forEach((o) => {
        overrideMap[o.user_id] = { extra_projects: o.extra_projects, notes: o.notes };
      });

      // Get Stripe subscription data for each user
      let stripe: Stripe | null = null;
      if (stripeKey) {
        stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
      }

      const usersWithData = await Promise.all(
        (profiles || []).map(async (profile) => {
          let subscriptionData = {
            subscribed: false,
            plan: null as string | null,
            product_id: null as string | null,
            status: null as string | null,
            subscription_end: null as string | null,
          };

          if (stripe && profile.email) {
            try {
              const customers = await stripe.customers.list({
                email: profile.email,
                limit: 1,
              });

              if (customers.data.length > 0) {
                const customer = customers.data[0];
                const subscriptions = await stripe.subscriptions.list({
                  customer: customer.id,
                  status: "all",
                  limit: 1,
                });

                if (subscriptions.data.length > 0) {
                  const sub = subscriptions.data[0];
                  const productId = sub.items.data[0]?.price?.product as string;
                  
                  subscriptionData = {
                    subscribed: sub.status === "active" || sub.status === "trialing",
                    plan: productId,
                    product_id: productId,
                    status: sub.status,
                    subscription_end: new Date(sub.current_period_end * 1000).toISOString(),
                  };
                }
              }
            } catch (stripeError) {
              logStep("Stripe error for user", { email: profile.email, error: String(stripeError) });
            }
          }

          return {
            ...profile,
            project_count: projectCountMap[profile.user_id] || 0,
            override: overrideMap[profile.user_id] || null,
            subscription: subscriptionData,
          };
        })
      );

      logStep("Returning users", { count: usersWithData.length });

      return new Response(JSON.stringify({ users: usersWithData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "PUT") {
      // Update user email or override
      const body = await req.json();
      const { user_id, email, extra_projects, notes } = body;

      if (!user_id) {
        throw new Error("user_id is required");
      }

      logStep("Updating user", { user_id, email, extra_projects });

      // Update email if provided
      if (email !== undefined) {
        // Get the auth user id from profiles
        const { data: profile, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("user_id")
          .eq("user_id", user_id)
          .single();

        if (profileError || !profile) {
          throw new Error("Profile not found");
        }

        // Update auth user email
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          profile.user_id,
          { email }
        );

        if (authError) {
          throw new Error(`Failed to update email: ${authError.message}`);
        }

        // Update profile email
        const { error: profileUpdateError } = await supabaseAdmin
          .from("profiles")
          .update({ email })
          .eq("user_id", user_id);

        if (profileUpdateError) {
          throw new Error(`Failed to update profile email: ${profileUpdateError.message}`);
        }

        logStep("Email updated", { user_id, email });
      }

      // Update or create override if extra_projects provided
      if (extra_projects !== undefined) {
        const { data: existingOverride } = await supabaseAdmin
          .from("user_overrides")
          .select("id")
          .eq("user_id", user_id)
          .single();

        if (existingOverride) {
          const { error: updateError } = await supabaseAdmin
            .from("user_overrides")
            .update({ extra_projects, notes: notes ?? null })
            .eq("user_id", user_id);

          if (updateError) {
            throw new Error(`Failed to update override: ${updateError.message}`);
          }
        } else {
          const { error: insertError } = await supabaseAdmin
            .from("user_overrides")
            .insert({ user_id, extra_projects, notes: notes ?? null });

          if (insertError) {
            throw new Error(`Failed to create override: ${insertError.message}`);
          }
        }

        logStep("Override updated", { user_id, extra_projects });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("Error", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
