import { NextResponse } from "next/server";
import { supabase } from "@src/config/supabase";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, type, status, progress, result_data, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[GET /api/user/jobs]", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
