import { NextResponse } from "next/server";
import { createServiceClient } from "@src/config/supabase";
import { adminService } from "@src/application/services/AdminService";

/**
 * Middleware: Kiểm tra quyền Admin
 * Chỉ dùng ở Server Route (Bypass RLS check thủ công qua JWT hoặc Supabase Session)
 */
async function checkAdmin(request: Request) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return false;
    const token = authHeader.substring(7);

    // 1. Phục hồi user từ token (Sử dụng service role key để dò profile)
    const supabaseAdmin = createServiceClient();
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) return false;

    // 2. Kiểm tra role
    const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
        
    return profile?.role === "admin";
}

/**
 * GET /api/admin/users
 * Lấy danh sách thành viên toàn trang
 */
export async function GET(request: Request) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Forbidden: Admin access only" }, { status: 403 });
    }

    const users = await adminService.getAllUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
