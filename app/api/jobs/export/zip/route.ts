import { NextResponse } from "next/server";
import { supabase, createAuthClient } from "@src/config/supabase";
import JSZip from "jszip";

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

    const { data: job, error: jobError } = await client
      .from("jobs")
      .select("user_id, result_data")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ success: false, error: "Job not found" }, { status: 404 });
    }

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

    const { data: story } = await client
      .from("stories")
      .select("id, title")
      .eq("slug", storySlug)
      .single();

    if (!story) {
      return NextResponse.json({ success: false, error: "Story data not found in Database." }, { status: 404 });
    }

    const { data: chapters, error: chapError } = await client
      .from("chapters")
      .select("chapter_number, title, raw_content, ai_rewritten_content")
      .eq("story_id", story.id)
      .in("chapter_number", chapterNums)
      .order("chapter_number", { ascending: true });

    if (chapError || !chapters || chapters.length === 0) {
      return NextResponse.json({ success: false, error: "Chapters data empty in Database." }, { status: 404 });
    }

    const zip = new JSZip();

    // 1. Thêm file style.css
    const cssContent = `
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; color: #333; background: #fdfdfd; }
        h1, h2 { text-align: center; color: #222; margin-bottom: 24px; padding-bottom: 10px; border-bottom: 1px solid #eaeaea; }
        p { text-indent: 1.5em; margin-bottom: 1em; text-align: justify; font-size: 1.1em; }
        .nav { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; }
        .nav a { color: #0066cc; text-decoration: none; font-weight: bold; padding: 8px 16px; background: #f0f7ff; border-radius: 4px; }
        .nav a:hover { background: #e0f0ff; }
        @media (prefers-color-scheme: dark) {
            body { background: #121212; color: #e0e0e0; }
            h1, h2 { color: #fff; border-color: #333; }
            .nav { border-color: #333; }
            .nav a { background: #1a2b3c; color: #66b3ff; }
            .nav a:hover { background: #2a3b4c; }
        }
    `;
    zip.file("style.css", cssContent);

    // 2. Thêm file index.html (Mục lục)
    let indexHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${story.title || "Truyện"}</title><link rel="stylesheet" href="style.css"></head><body>`;
    indexHtml += `<h1>${story.title || "Truyện Tải Xuống"}</h1>`;
    indexHtml += `<ul>`;

    chapters.forEach((chap, index) => {
        const title = chap.title || `Chương ${chap.chapter_number}`;
        const fileName = `chuong-${chap.chapter_number}.html`;
        
        indexHtml += `<li><a href="${fileName}">${title}</a></li>`;

        // Tạo nội dung từng chương
        const text = chap.ai_rewritten_content || chap.raw_content || "";
        const paragraphs = text.split("\n").filter((l: string) => l.trim().length > 0).map((l: string) => `<p>${l.trim()}</p>`).join("\n");
        
        const prevFile = index > 0 ? `chuong-${chapters[index - 1].chapter_number}.html` : 'index.html';
        const nextFile = index < chapters.length - 1 ? `chuong-${chapters[index + 1].chapter_number}.html` : 'index.html';

        const chapHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><link rel="stylesheet" href="style.css"></head><body>
            <h2>${title}</h2>
            ${paragraphs}
            <div class="nav">
                <a href="${prevFile}">Quay lại</a>
                <a href="index.html">Mục lục</a>
                <a href="${nextFile}">Tiếp theo</a>
            </div>
        </body></html>`;

        zip.file(fileName, chapHtml);
    });

    indexHtml += `</ul></body></html>`;
    zip.file("index.html", indexHtml);

    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    const minCh = Math.min(...chapterNums);
    const maxCh = Math.max(...chapterNums);
    const fileName = `Story_${storySlug}_Ch_${minCh}-${maxCh}.zip`;

    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    });

  } catch (error: any) {
    console.error("ZIP Output Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Lỗi tạo ZIP" }, { status: 500 });
  }
}
