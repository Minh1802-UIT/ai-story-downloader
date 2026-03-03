import { NextResponse } from "next/server";
import { createJob, JobPayload } from "@src/application/services/JobService";
import { supabase } from "@src/config/supabase";

/**
 * POST /api/jobs
 * Body: { storyUrl, startChapter, endChapter, chapterUrls }
 * Returns: { jobId }
 */
export async function POST(request: Request) {
  try {
    // 1. Xác thực user từ token nếu có
    const authHeader = request.headers.get("Authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "").trim();
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (user && !authError) {
        userId = user.id;
      }
    }

    const body = await request.json();
    const { storyUrl, startChapter, endChapter, chapterUrls } = body;

    // Validation
    if (!storyUrl || !Array.isArray(chapterUrls) || chapterUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: storyUrl, chapterUrls" },
        { status: 400 }
      );
    }

    if (chapterUrls.length > 1000) {
      return NextResponse.json(
        { success: false, error: "Cannot queue more than 1000 chapters at once" },
        { status: 400 }
      );
    }

    const payload: JobPayload = {
      storyUrl,
      startChapter: Number(startChapter),
      endChapter: Number(endChapter),
      chapterUrls,
    };

    const jobId = await createJob(payload, userId);

    return NextResponse.json({ success: true, jobId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[POST /api/jobs]", msg);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
