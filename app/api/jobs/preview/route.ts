import { NextResponse } from "next/server";
import { supabase } from "@src/config/supabase";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Missing jobId" }, { status: 400 });
    }

    // 1. Lấy thông tin Job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("user_id, result_data")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    // Parse Token lấy user ID bảo mật
    const authHeader = request.headers.get("Authorization");
    if (authHeader && job.user_id) {
       const token = authHeader.replace("Bearer ", "").trim();
       const { data: { user } } = await supabase.auth.getUser(token);
       if (!user || user.id !== job.user_id) {
          return NextResponse.json({ success: false, error: "Unauthorized access to this job" }, { status: 401 });
       }
    }

    const { downloadedUrls, storyUrl } = job.result_data as any;
    if (!downloadedUrls || downloadedUrls.length === 0) {
      return NextResponse.json({ success: false, error: "No downloaded content in this job yet." }, { status: 404 });
    }

    // 2. Chuyển URL thành Slug như trong ChapterCacheService
    const urlToSlug = (url: string): string => {
      try {
        const pathname = new URL(url).pathname;
        const parts = pathname.split("/").filter(Boolean);
        const slug = parts[parts.length - 2] || parts[parts.length - 1] || url;
        return slug.replace(/\.html$/, "");
      } catch {
        return encodeURIComponent(url).slice(0, 100);
      }
    };

    const extractChapterNumber = (url: string): number | null => {
      const match = url.match(/(?:chuong|chapter|page)[/-](\d+)/i);
      return match ? parseInt(match[1]) : null;
    };

    const storySlug = urlToSlug(storyUrl || downloadedUrls[0]);
    
    // Preview Limit: Chỉ lấy chương 1 đến 5 để đỡ nặng tải
    const chapterNumsRaw = downloadedUrls.map(extractChapterNumber).filter(Boolean) as number[];
    const minCh = Math.min(...chapterNumsRaw);
    const chapterNums = chapterNumsRaw.filter(c => c >= minCh && c < minCh + 5);

    // 3. Tìm DB story cache
    const { data: story } = await supabase
      .from("stories")
      .select("id, title")
      .eq("slug", storySlug)
      .single();

    if (!story) {
      return NextResponse.json({ success: false, error: "Story data not found in Database." }, { status: 404 });
    }

    // 4. Lấy tối đa 5 Chapters đầu tiên
    const { data: chapters, error: chapError } = await supabase
      .from("chapters")
      .select("chapter_number, title, raw_content, ai_rewritten_content")
      .eq("story_id", story.id)
      .in("chapter_number", chapterNums)
      .order("chapter_number", { ascending: true });

    if (chapError || !chapters || chapters.length === 0) {
      return NextResponse.json({ success: false, error: "Chapters data empty in Database." }, { status: 404 });
    }

    // 5. Build JSON string thay vì Blob file
    let previewText = `Truyện: ${story.title}\nNguồn: ${storyUrl}\n(Chỉ hiển thị đọc thử ${chapters.length} chương đầu)\n\n`;
    for (const chap of chapters) {
      const text = chap.ai_rewritten_content || chap.raw_content || "";
      previewText += `\n\n--- ${chap.title || `CHƯƠNG ${chap.chapter_number}`} ---\n\n${text}\n`;
    }

    return NextResponse.json({
        success: true,
        data: {
            title: story.title,
            previewText: previewText
        }
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
