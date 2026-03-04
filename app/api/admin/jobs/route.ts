import { NextResponse } from "next/server";
import { createServiceClient } from "@src/config/supabase";
import { adminService } from "@src/application/services/AdminService";

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
 * GET /api/admin/jobs?limit=50
 * Lịch sử tất cả tiến trình
 */
export async function GET(request: Request) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const limitParams = searchParams.get("limit");
    const limit = limitParams ? parseInt(limitParams, 10) : 50;

    const jobs = await adminService.getAllJobs(limit);
    return NextResponse.json({ success: true, data: jobs });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/jobs
 * Huỷ một job từ Panel Dashboard
 */
export async function DELETE(request: Request) {
    try {
        const isAdmin = await checkAdmin(request);
        if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    
        const body = await request.json();
        const { jobId } = body;

        if (!jobId) return NextResponse.json({ success: false, error: "Missing jobId" }, { status: 400 });

        const isCancelled = await adminService.cancelJob(jobId);
        if (isCancelled) {
             return NextResponse.json({ success: true, message: "Job cancelled successfully" });
        } else {
             return NextResponse.json({ success: false, error: "Failed to cancel job" }, { status: 400 });
        }
    
      } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
}
