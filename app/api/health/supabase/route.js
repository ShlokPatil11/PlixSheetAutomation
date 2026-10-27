import { NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { connected: false, error: "Supabase environment variables are not configured" },
      { status: 503 }
    );
  }

  const supabase = getSupabaseAdmin();
  const stateId = process.env.SUPABASE_STATE_ID || "plix-ops-main";
  const { data, error } = await supabase
    .from("plix_app_state")
    .select("id, revision, updated_at")
    .eq("id", stateId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ connected: false, error: error.message }, { status: 503 });
  }

  return NextResponse.json({
    connected: true,
    initialized: Boolean(data),
    stateId,
    revision: data?.revision || null,
    updatedAt: data?.updated_at || null,
  });
}

