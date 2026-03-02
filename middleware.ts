import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---- In-memory Rate Limit Store ----
// NOTE: Trên Vercel Serverless, mỗi instance có store riêng — phù hợp để giảm burst,
// không đảm bảo tuyệt đối (cần Redis/Vercel KV cho production scale lớn).
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_RULES: Record<string, { max: number; windowMs: number }> = {
  "/api/analyze":     { max: 30,  windowMs: 60_000 },   // 30 req/phút
  "/api/process-job": { max: 120, windowMs: 60_000 },   // 120 req/phút (polling)
  "/api/jobs":        { max: 20,  windowMs: 60_000 },   // 20 job tạo/phút
};

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "anonymous"
  );
}

function checkRateLimit(
  ip: string,
  pathname: string
): { allowed: boolean; remaining: number; resetAt: number } {
  // Tìm rule khớp với path
  const ruleKey = Object.keys(RATE_LIMIT_RULES).find((k) =>
    pathname.startsWith(k)
  );
  if (!ruleKey) return { allowed: true, remaining: 999, resetAt: 0 };

  const rule = RATE_LIMIT_RULES[ruleKey];
  const key = `${ip}:${ruleKey}`;
  const now = Date.now();

  const entry = rateLimitStore.get(key);

  // Reset nếu window đã hết
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { allowed: true, remaining: rule.max - 1, resetAt: now + rule.windowMs };
  }

  // Tăng count
  entry.count++;
  const remaining = Math.max(0, rule.max - entry.count);
  const allowed = entry.count <= rule.max;

  return { allowed, remaining, resetAt: entry.resetAt };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Chỉ áp dụng rate limit cho API routes cụ thể
  if (!pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const ip = getClientIp(request);
  const { allowed, remaining, resetAt } = checkRateLimit(ip, pathname);

  if (!allowed) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded. Please slow down.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "Retry-After": String(retryAfter),
        },
      }
    );
  }

  // Thêm headers thông tin rate limit vào response
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  return response;
}

export const config = {
  matcher: ["/api/analyze", "/api/process-job", "/api/jobs"],
};
