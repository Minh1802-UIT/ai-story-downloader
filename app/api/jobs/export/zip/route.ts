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
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.8; max-width: 900px; margin: 0 auto; padding: 20px; color: #333; background: #fdfdfd; }
        .story-header { text-align: center; margin-bottom: 40px; }
        h1 { color: #222; margin-bottom: 24px; padding-bottom: 10px; border-bottom: 2px solid #eaeaea; font-size: 2.2em; }
        h2 { color: #444; margin-top: 40px; margin-bottom: 20px; padding-bottom: 8px; border-bottom: 1px solid #eee; text-align: center; font-size: 1.8em; }
        .toc { background: #f9f9f9; padding: 20px 30px; border-radius: 8px; margin-bottom: 40px; border: 1px solid #eaeaea; }
        .toc ul { list-style-type: none; padding-left: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; }
        .toc a { color: #0066cc; text-decoration: none; padding: 5px; display: block; border-radius: 4px; transition: background 0.2s; }
        .toc a:hover { background: #e0f0ff; }
        p { text-indent: 1.5em; margin-bottom: 1.2em; text-align: justify; font-size: 1.15em; word-wrap: break-word; }
        hr { border: 0; height: 1px; background-image: linear-gradient(to right, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0)); margin: 40px 0; }
        @media (prefers-color-scheme: dark) {
            body { background: #121212; color: #e0e0e0; }
            h1 { color: #fff; border-color: #333; }
            h2 { color: #ddd; border-color: #222; }
            .toc { background: #1e1e1e; border-color: #333; }
            .toc a { color: #66b3ff; }
            .toc a:hover { background: #2a3b4c; }
            hr { background-image: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0)); }
        }
    `;
    zip.file("style.css", cssContent);

    // 2. Tạo nội dung HTML gộp
    const minChHtml = Math.min(...chapterNums);
    const maxChHtml = Math.max(...chapterNums);

    let combinedHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${story.title || "Truyện"}</title><link rel="stylesheet" href="style.css"></head><body>`;
    combinedHtml += `<div class="story-header"><h1>${story.title || "Truyện Tải Xuống"}</h1></div>`;
    
    // Mục lục
    combinedHtml += `<div class="toc"><h2>Mục Lục</h2><ul>`;
    chapters.forEach((chap) => {
        const title = chap.title || `Chương ${chap.chapter_number}`;
        combinedHtml += `<li><a href="#chuong-${chap.chapter_number}">${title}</a></li>`;
    });
    combinedHtml += `</ul></div><hr/>`;

    // Nội dung
    chapters.forEach((chap) => {
        const title = chap.title || `Chương ${chap.chapter_number}`;
        const text = chap.ai_rewritten_content || chap.raw_content || "";
        const lines = text.split("\\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0);
        
        if (lines.length > 0) {
            const firstLineLower = lines[0].toLowerCase();
            const titleLower = title.toLowerCase();
            if (firstLineLower === titleLower || firstLineLower.includes(titleLower) || titleLower.includes(firstLineLower) || /^(chương|chapter)\\s*\\d+/i.test(firstLineLower)) {
                lines.shift();
            }
        }

        const paragraphs = lines.map((l: string) => `<p>${l}</p>`).join("\\n");
        
        combinedHtml += `<div id="chuong-${chap.chapter_number}" class="chapter-container">
            <h2>${title}</h2>
            ${paragraphs}
        </div><hr/>`;
    });

    combinedHtml += `</body></html>`;
    
    const htmlFileName = `Story_${storySlug}_Ch_${minChHtml}-${maxChHtml}.html`;
    zip.file(htmlFileName, combinedHtml);

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
