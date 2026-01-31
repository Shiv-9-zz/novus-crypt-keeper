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

    const { challengeId, teamId, submittedFlag } = await req.json();

    if (!challengeId || !teamId || !submittedFlag) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the challenge and its flag
    const { data: challenge, error: challengeError } = await supabase
      .from("challenges")
      .select("id, flag, points, solve_count, is_visible, is_locked")
      .eq("id", challengeId)
      .single();

    if (challengeError || !challenge) {
      return new Response(
        JSON.stringify({ error: "Challenge not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if challenge is accessible
    if (!challenge.is_visible || challenge.is_locked) {
      return new Response(
        JSON.stringify({ error: "Challenge is not accessible" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if team already solved this challenge
    const { data: existingSolve } = await supabase
      .from("submissions")
      .select("id")
      .eq("team_id", teamId)
      .eq("challenge_id", challengeId)
      .eq("is_correct", true)
      .maybeSingle();

    if (existingSolve) {
      return new Response(
        JSON.stringify({ 
          correct: true, 
          alreadySolved: true,
          message: "Challenge already solved" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the flag (case-sensitive comparison)
    const isCorrect = submittedFlag.trim() === challenge.flag;

    // Record the submission
    await supabase.from("submissions").insert({
      team_id: teamId,
      challenge_id: challengeId,
      submitted_flag: submittedFlag.trim(),
      is_correct: isCorrect,
    });

    if (isCorrect) {
      // Update team score
      const { data: teamData } = await supabase
        .from("teams")
        .select("score")
        .eq("id", teamId)
        .single();

      if (teamData) {
        await supabase
          .from("teams")
          .update({ score: teamData.score + challenge.points })
          .eq("id", teamId);
      }

      // Increment solve count
      await supabase
        .from("challenges")
        .update({ solve_count: challenge.solve_count + 1 })
        .eq("id", challengeId);

      return new Response(
        JSON.stringify({ 
          correct: true, 
          points: challenge.points,
          message: "Flag verified successfully!" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ 
          correct: false, 
          message: "Incorrect flag. Try again!" 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: unknown) {
    console.error("Flag verification error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
