import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[ADMIN-USERS] ${step}${detailsStr}`);
};

async function verifyAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("No authorization header");

  const token = authHeader.replace("Bearer ", "");

  // Validate token via GoTrue API directly (compatible with ES256 tokens)
  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
    },
  });

  if (!userResponse.ok) {
    const errBody = await userResponse.text();
    logStep("Token validation failed", { status: userResponse.status, body: errBody });
    throw new Error("Unauthorized");
  }

  const user = await userResponse.json();
  if (!user?.id) throw new Error("Unauthorized");

  logStep("User validated", { userId: user.id });

  // Service role client for admin operations
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  logStep("Checking admin role", { userId: user.id });

  const { data: roleData, error: roleError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .single();

  if (roleError || !roleData) {
    logStep("Admin check failed", { error: roleError?.message });
    throw new Error("Forbidden");
  }

  logStep("Admin verified");
  return { supabaseAdmin, adminUser: user };
}

async function handleGet(supabaseAdmin: ReturnType<typeof createClient>) {
  logStep("Fetching all users");

  const [profilesRes, projectsRes, overridesRes, rolesRes] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false }),
    supabaseAdmin.from("projects").select("user_id"),
    supabaseAdmin.from("user_overrides").select("*"),
    supabaseAdmin.from("user_roles").select("user_id, role").eq("role", "admin"),
  ]);

  if (profilesRes.error) throw new Error(`Failed to fetch profiles: ${profilesRes.error.message}`);
  if (projectsRes.error) throw new Error(`Failed to fetch projects: ${projectsRes.error.message}`);
  if (overridesRes.error) throw new Error(`Failed to fetch overrides: ${overridesRes.error.message}`);

  const projectCountMap: Record<string, number> = {};
  projectsRes.data?.forEach((p) => {
    projectCountMap[p.user_id] = (projectCountMap[p.user_id] || 0) + 1;
  });

  const overrideMap: Record<string, { extra_projects: number; notes: string | null }> = {};
  overridesRes.data?.forEach((o) => {
    overrideMap[o.user_id] = { extra_projects: o.extra_projects, notes: o.notes };
  });

  const adminSet = new Set<string>();
  rolesRes.data?.forEach((r) => adminSet.add(r.user_id));

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  let stripe: Stripe | null = null;
  if (stripeKey) {
    stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  }

  const usersWithData = await Promise.all(
    (profilesRes.data || []).map(async (profile) => {
      let subscriptionData = {
        subscribed: false,
        plan: null as string | null,
        product_id: null as string | null,
        status: null as string | null,
        subscription_end: null as string | null,
      };

      if (stripe && profile.email) {
        try {
          const customers = await stripe.customers.list({ email: profile.email, limit: 1 });
          if (customers.data.length > 0) {
            const subscriptions = await stripe.subscriptions.list({
              customer: customers.data[0].id,
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
        is_admin: adminSet.has(profile.user_id),
        subscription: subscriptionData,
      };
    })
  );

  logStep("Returning users", { count: usersWithData.length });
  return usersWithData;
}

async function handlePut(
  body: Record<string, unknown>,
  supabaseAdmin: ReturnType<typeof createClient>,
  adminUserId: string
) {
  const { user_id, email, password, is_admin, extra_projects, notes } = body as {
    user_id: string;
    email?: string;
    password?: string;
    is_admin?: boolean;
    extra_projects?: number;
    notes?: string;
  };

  if (!user_id) throw new Error("user_id is required");

  logStep("Updating user", { user_id, email, hasPassword: !!password, is_admin });

  // Update email and/or password via auth admin
  if (email !== undefined || password) {
    const updatePayload: Record<string, string> = {};
    if (email !== undefined) updatePayload.email = email;
    if (password) {
      if (password.length < 6) throw new Error("Password must be at least 6 characters");
      updatePayload.password = password;
    }

    // Sync email in Stripe before updating auth
    if (email !== undefined) {
      try {
        // Get current email from profiles
        const { data: currentProfile } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("user_id", user_id)
          .single();

        const oldEmail = currentProfile?.email;
        if (oldEmail && oldEmail !== email) {
          const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
          if (stripeKey) {
            const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
            const customers = await stripe.customers.list({ email: oldEmail, limit: 1 });
            if (customers.data.length > 0) {
              await stripe.customers.update(customers.data[0].id, { email });
              logStep("Stripe customer email updated", { oldEmail, newEmail: email, customerId: customers.data[0].id });
            } else {
              logStep("No Stripe customer found for old email", { oldEmail });
            }
          }
        }
      } catch (stripeError) {
        logStep("Stripe email sync error (non-fatal)", { error: String(stripeError) });
      }
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user_id, updatePayload);
    if (authError) throw new Error(`Failed to update auth user: ${authError.message}`);

    if (email !== undefined) {
      const { error: profileUpdateError } = await supabaseAdmin
        .from("profiles")
        .update({ email })
        .eq("user_id", user_id);
      if (profileUpdateError) throw new Error(`Failed to update profile email: ${profileUpdateError.message}`);

      // Remove OAuth identities (Google, etc.) to prevent login with old provider
      try {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(user_id);
        if (!userError && userData?.user?.identities) {
          const oauthIdentities = userData.user.identities.filter((id: any) => id.provider !== "email");
          for (const identity of oauthIdentities) {
            const { error: delError } = await supabaseAdmin.auth.admin.deleteIdentity(identity.id);
            if (delError) {
              logStep("Failed to delete identity", { provider: identity.provider, error: delError.message });
            } else {
              logStep("OAuth identity removed", { provider: identity.provider, providerEmail: identity.identity_data?.email });
            }
          }
          if (oauthIdentities.length === 0) {
            logStep("No OAuth identities to remove", { user_id });
          }
        }
      } catch (identityError) {
        logStep("Identity cleanup error (non-fatal)", { error: String(identityError) });
      }
    }

    logStep("Auth user updated", { user_id });
  }

  // Toggle admin role
  if (is_admin !== undefined) {
    if (!is_admin && user_id === adminUserId) {
      throw new Error("Cannot remove your own admin role");
    }

    if (is_admin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(`Failed to add admin role: ${error.message}`);
      logStep("Admin role added", { user_id });
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", user_id)
        .eq("role", "admin");
      if (error) throw new Error(`Failed to remove admin role: ${error.message}`);
      logStep("Admin role removed", { user_id });
    }
  }

  // Update overrides
  if (extra_projects !== undefined) {
    const { data: existingOverride } = await supabaseAdmin
      .from("user_overrides")
      .select("id")
      .eq("user_id", user_id)
      .single();

    if (existingOverride) {
      const { error } = await supabaseAdmin
        .from("user_overrides")
        .update({ extra_projects, notes: notes ?? null })
        .eq("user_id", user_id);
      if (error) throw new Error(`Failed to update override: ${error.message}`);
    } else {
      const { error } = await supabaseAdmin
        .from("user_overrides")
        .insert({ user_id, extra_projects, notes: notes ?? null });
      if (error) throw new Error(`Failed to create override: ${error.message}`);
    }
    logStep("Override updated", { user_id, extra_projects });
  }

  return { success: true };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { supabaseAdmin, adminUser } = await verifyAdmin(req);

    // GET or POST without body = list users
    if (req.method === "GET" || req.method === "POST") {
      // Check if it's a PUT-like operation (has body with user_id)
      let body = null;
      if (req.method === "POST") {
        try {
          const text = await req.clone().text();
          if (text) {
            body = JSON.parse(text);
          }
        } catch {
          // No body or invalid JSON, treat as list request
        }
      }

      // If POST has user_id in body, treat as update operation
      if (body?.user_id) {
        const result = await handlePut(body, supabaseAdmin, adminUser.id);
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Otherwise list users
      const users = await handleGet(supabaseAdmin);
      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "PUT") {
      const body = await req.json();
      const result = await handlePut(body, supabaseAdmin, adminUser.id);
      return new Response(JSON.stringify(result), {
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
    const status = errorMessage === "Forbidden" ? 403 : errorMessage === "Unauthorized" ? 401 : 500;
    return new Response(JSON.stringify({ error: errorMessage }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
