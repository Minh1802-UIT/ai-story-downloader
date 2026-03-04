import { NextResponse } from "next/server";
import { supabase, createAuthClient } from "@src/config/supabase";
import epub from "epub-gen-memory";

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

    // 1. Lấy thông tin Job
    const { data: job, error: jobError } = await client
      .from("jobs")
      .select("user_id, result_data")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

    // Parse Token xác thực bảo mật
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

    // Chuyển URL thành Slug như trong ChapterCacheService
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
    const chapterNums = downloadedUrls.map(extractChapterNumber).filter(Boolean) as number[];

    // Tìm DB story cache
    const { data: story } = await client
      .from("stories")
      .select("id, title")
      .eq("slug", storySlug)
      .single();

    if (!story) {
      return NextResponse.json({ success: false, error: "Story data not found in Database." }, { status: 404 });
    }

    // Lấy tất cả Chapters
    const { data: chapters, error: chapError } = await client
      .from("chapters")
      .select("chapter_number, title, raw_content, ai_rewritten_content")
      .eq("story_id", story.id)
      .in("chapter_number", chapterNums)
      .order("chapter_number", { ascending: true });

    if (chapError || !chapters || chapters.length === 0) {
      return NextResponse.json({ success: false, error: "Chapters data empty in Database." }, { status: 404 });
    }

    // Format content for EPUB
    const epubChapters = chapters.map((chap) => {
        const title = chap.title || `Chương ${chap.chapter_number}`;
        const text = chap.ai_rewritten_content || chap.raw_content || "";
        
        // Wrap văn bản thuần túy trong thẻ HTML <p>
        const htmlContent = text.split("\n")
            .filter((line: string) => line.trim().length > 0)
            .map((line: string) => `<p>${line.trim()}</p>`)
            .join("\n");

        return {
            title: title,
            content: `<h2>${title}</h2>\n${htmlContent}` // epub-gen-memory render content
        };
    });

    const epubOptions = {
        title: story.title || "Truyện Tải Xuống từ AI Story Downloader",
        author: "AI Story Downloader (Story Commander)",
        publisher: "VanMinh1802",
        source: storyUrl || "",
        tocTitle: "Mục Lục",
        description: `Truyện được crawler tự động từ ${storyUrl}`
    };

    // Tạo file nén EPUB thành Buffer Output ở thư mục TMP nội bộ
    const epubBuffer = await epub(epubOptions, epubChapters);

    const minCh = Math.min(...chapterNums);
    const maxCh = Math.max(...chapterNums);
    const fileName = `Story_${storySlug}_Ch_${minCh}-${maxCh}.epub`;

    const uint8Array = new Uint8Array(epubBuffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/epub+zip",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    });

  } catch (error: any) {
    console.error("EPUB Output Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Lỗi tạo EPUB" }, { status: 500 });
  }
}
