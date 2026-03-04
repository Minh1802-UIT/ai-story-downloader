import { NextResponse } from "next/server";
import { createServiceClient } from "@src/config/supabase";

async function checkAdmin(request: Request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return false;
    const token = authHeader.substring(7);

    const supabaseAdmin = createServiceClient();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return false;

    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
        
    return profile?.role === "admin";
}

/**
 * GET /api/admin/stats
 * Thống kê hệ thống: Tổng users, tổng jobs, credits đã tiêu...
 */
export async function GET(request: Request) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const supabaseAdmin = createServiceClient();

    // Chạy song song cho nhanh
    const [usersRes, jobsRes, creditRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("jobs").select("id, status", { count: "exact" }),
      supabaseAdmin.from("profiles").select("credits"),
    ]);

    const totalUsers = usersRes.count || 0;
    
    const allJobs = jobsRes.data || [];
    const totalJobs = allJobs.length;
    const completedJobs = allJobs.filter((j: any) => j.status === "COMPLETED").length;
    const failedJobs = allJobs.filter((j: any) => j.status === "FAILED").length;
    const processingJobs = allJobs.filter((j: any) => j.status === "PROCESSING" || j.status === "QUEUED").length;
    
    const allCredits = creditRes.data || [];
    const totalCreditsInSystem = allCredits.reduce((sum: number, u: any) => sum + (u.credits || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        totalJobs,
        completedJobs,
        failedJobs,
        processingJobs,
        totalCreditsInSystem,
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
