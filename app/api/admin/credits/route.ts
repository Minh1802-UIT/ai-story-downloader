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
 * POST /api/admin/credits
 * Điều chỉnh số Credit của người dùng (Cộng hoặc Trừ)
 * { "userId": "uuid", "amount": 100 }
 */
export async function POST(request: Request) {
    try {
        const isAdmin = await checkAdmin(request);
        if (!isAdmin) return NextResponse.json({ success: false, error: "Forbidden: Admin access only" }, { status: 403 });

        const body = await request.json();
        const { userId, amount } = body;

        if (!userId || typeof amount !== "number") {
             return NextResponse.json({ success: false, error: "Missing or invalid payload" }, { status: 400 });
        }

        const updatedProfile = await adminService.updateCredits(userId, amount);
        
        return NextResponse.json({ success: true, data: updatedProfile });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
