import { createServiceClient, ProfileRow, JobRow } from "@src/config/supabase";

export class AdminService {
  private supabaseAdmin = createServiceClient();

  /**
   * Lấy danh sách toàn bộ người dùng 
   * Bypass RLS do dùng Service Role Key
   */
  async getAllUsers(): Promise<ProfileRow[]> {
    const { data, error } = await this.supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("AdminService.getAllUsers Error:", error);
      throw new Error("Failed to fetch users");
    }

    return data as ProfileRow[];
  }

  /**
   * Lấy danh sách toàn bộ Job đang chạy/chờ trên Server
   */
  async getAllJobs(limit = 100): Promise<JobRow[]> {
    const { data, error } = await this.supabaseAdmin
      .from("jobs")
      .select(`
        *,
        profiles:user_id (email)
      `)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("AdminService.getAllJobs Error:", error);
      throw new Error("Failed to fetch jobs");
    }

    return data as any[];
  }

  /**
   * Cộng/Trừ Credit thủ công cho một user
   */
  async updateCredits(userId: string, amount: number): Promise<ProfileRow> {
    // 1. Lấy balance hiện tại
    const { data: user, error: fetchErr } = await this.supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    if (fetchErr || !user) throw new Error("User not found");

    const newCredits = Math.max(0, user.credits + amount);

    // 2. Cập nhật balance mới
    const { data: updatedUser, error: updateErr } = await this.supabaseAdmin
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", userId)
      .select()
      .single();

    if (updateErr) throw new Error("Failed to update credits");

    return updatedUser as ProfileRow;
  }
  
  /**
   * Huỷ Job khẩn cấp
   */
  async cancelJob(jobId: string): Promise<boolean> {
     const { error } = await this.supabaseAdmin
      .from("jobs")
      .update({ 
          status: "FAILED", 
          result_data: { error: "Cancelled by Admin" } 
      })
      .eq("id", jobId);
      
     if (error) return false;
     return true;
  }
}

export const adminService = new AdminService();
