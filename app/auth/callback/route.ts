import { NextResponse } from "next/server";
import { supabase } from "@src/config/supabase";

/**
 * Route handler cho OAuth callback.
 * Supabase redirect về đây sau khi User đăng nhập Google thành công.
 * URL: /auth/callback?code=...
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    // Đổi authorization code lấy session
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Redirect về trang chủ sau khi đăng nhập thành công
  return NextResponse.redirect(`${origin}/`);
}
