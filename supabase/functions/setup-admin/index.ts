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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, password } = await req.json();

    // Validate admin credentials
    const ADMIN_EMAIL = "CSCNOVUS@gmail.com";
    const ADMIN_PASSWORD = "CYBERSPACE";

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return new Response(
        JSON.stringify({ error: "Invalid admin credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if admin user exists (case-insensitive comparison)
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAdmin = existingUsers?.users?.find(
      u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
    );

    let userId: string;

    if (existingAdmin) {
      userId = existingAdmin.id;
      console.log("Admin user already exists:", userId);
    } else {
      // Create admin user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        email_confirm: true,
      });

      if (createError) {
        // If user already exists error, try to find them again
        if (createError.message.includes("already been registered")) {
          const { data: retryUsers } = await supabase.auth.admin.listUsers();
          const retryAdmin = retryUsers?.users?.find(
            u => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
          );
          if (retryAdmin) {
            userId = retryAdmin.id;
            console.log("Found admin on retry:", userId);
          } else {
            return new Response(
              JSON.stringify({ error: "Admin user exists but could not be found" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        } else {
          return new Response(
            JSON.stringify({ error: createError.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        userId = newUser.user!.id;
        console.log("Created new admin user:", userId);
      }
    }

    // Check if already in admin_users
    const { data: existingAdminRole } = await supabase
      .from("admin_users")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!existingAdminRole) {
      // Add to admin_users table
      const { error: insertError } = await supabase
        .from("admin_users")
        .insert({ user_id: userId });

      if (insertError) {
        return new Response(
          JSON.stringify({ error: insertError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, userId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
