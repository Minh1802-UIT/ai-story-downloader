import { NextResponse } from "next/server";
import { supabase, createAuthClient } from "@src/config/supabase";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const tokenParams = searchParams.get("token");
    const token = tokenParams || request.headers.get("Authorization")?.replace("Bearer ", "").trim() || "";
    const client = token ? createAuthClient(token) : supabase;

    if (!jobId) {
      return NextResponse.json({ success: false, error: "Missing jobId" }, { status: 400 });
    }

    // 1. Lấy thông Job
    const { data: job, error: jobError } = await client
      .from("jobs")
      .select("user_id, result_data")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    // Parse Token lấy user ID bảo mật
    if (token && job.user_id) {
       const { data: { user } } = await client.auth.getUser();
       if (!user || user.id !== job.user_id) {
          return NextResponse.json({ success: false, error: "Unauthorized access to this job" }, { status: 401 });
       }
    }

    const { downloadedUrls, storyUrl } = job.result_data as any;
    if (!downloadedUrls || downloadedUrls.length === 0) {
      return NextResponse.json({ success: false, error: "No downloaded content in this job yet." }, { status: 404 });
    }

    // 2. Chuyển URL thành Slug như trong ChapterCacheService
    // MonkeyDTruyen: /story-slug/1.html → lấy phần dir 'story-slug'
    // TruyenFull:    /story-slug/chuong-1 → lấy phần dir 'story-slug'
    const urlToSlug = (url: string): string => {
      try {
        const pathname = new URL(url).pathname;
        const parts = pathname.split("/").filter(Boolean);

        if (parts.length >= 2) {
          const lastPart = parts[parts.length - 1];
          const isChapterPart =
            /^\d+(\.html)?$/.test(lastPart) ||
            /(?:chuong|chapter|page)[/-](\d+)/i.test(lastPart);
          if (isChapterPart) {
            return parts[parts.length - 2].replace(/\.html$/, "");
          }
        }
        return parts[parts.length - 1].replace(/\.html$/, "") || encodeURIComponent(url).slice(0, 100);
      } catch {
        return encodeURIComponent(url).slice(0, 100);
      }
    };

    const extractChapterNumber = (url: string): number | null => {
      // Pattern chuẩn (TruyenFull)
      const stdMatch = url.match(/(?:chuong|chapter|page)[/-](\d+)/i);
      if (stdMatch) return parseInt(stdMatch[1]);
      // Fallback: lấy số từ cuối path (MonkeyDTruyen: /123.html)
      try {
        const pathname = new URL(url).pathname;
        const lastSegment = pathname.split("/").filter(Boolean).pop() || "";
        const numMatch = lastSegment.match(/^(\d+)(\.html)?$/);
        if (numMatch) return parseInt(numMatch[1]);
      } catch { /* ignore */ }
      return null;
    };

    // Slug trong DB được tính từ URL chapter (do ChapterCacheService lưu từ URL chương)
    // → Dùng downloadedUrls[0] để tính slug đúng, không dùng storyUrl (trang index)
    const storySlug = urlToSlug(downloadedUrls[0] || storyUrl);
    
    // Preview Limit: Chỉ lấy chương 1 đến 5 để đỡ nặng tải
    const chapterNumsRaw = downloadedUrls.map(extractChapterNumber).filter(Boolean) as number[];
    const minCh = Math.min(...chapterNumsRaw);
    const chapterNums = chapterNumsRaw.filter(c => c >= minCh && c < minCh + 5);

    // 3. Tìm DB story cache
    const { data: story } = await client
      .from("stories")
      .select("id, title")
      .eq("slug", storySlug)
      .single();

    if (!story) {
      return NextResponse.json({ success: false, error: "Story data not found in Database." }, { status: 404 });
    }

    // 4. Lấy tối đa 5 Chapters đầu tiên
    const { data: chapters, error: chapError } = await client
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
