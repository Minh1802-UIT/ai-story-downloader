import { NextResponse } from "next/server";
import { supabase, createAuthClient } from "@src/config/supabase";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

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

    // Build Word Document
    const docChildren: any[] = [];
    
    // Add Title Page
    docChildren.push(
        new Paragraph({
            text: story.title || "Truyện Tải Xuống",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );
    docChildren.push(
        new Paragraph({
            text: `Nguồn: ${storyUrl}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 }
        })
    );

    chapters.forEach((chap) => {
        const title = chap.title || `Chương ${chap.chapter_number}`;
        const text = chap.ai_rewritten_content || chap.raw_content || "";
        
        docChildren.push(
            new Paragraph({
                text: title,
                heading: HeadingLevel.HEADING_2,
                alignment: AlignmentType.CENTER,
                spacing: { before: 800, after: 400 },
                pageBreakBefore: true
            })
        );

        const lines = text.split("\n").filter((l: string) => l.trim().length > 0);
        lines.forEach((line: string) => {
            docChildren.push(
                new Paragraph({
                    children: [new TextRun({ text: line.trim(), size: 24 })], // size 24 = 12pt
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 200, line: 360 }, // line 360 = 1.5 spacing
                    indent: { firstLine: 720 } // 0.5 inch indent
                })
            );
        });
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: docChildren
        }]
    });

    const buffer = await Packer.toBuffer(doc);

    const minCh = Math.min(...chapterNums);
    const maxCh = Math.max(...chapterNums);
    const fileName = `Story_${storySlug}_Ch_${minCh}-${maxCh}.docx`;

    const uint8Array = new Uint8Array(buffer);

    return new NextResponse(uint8Array, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`
      }
    });

  } catch (error: any) {
    console.error("DOCX Output Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Lỗi tạo DOCX" }, { status: 500 });
  }
}
