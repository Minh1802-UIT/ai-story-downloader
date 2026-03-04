import { NextResponse } from "next/server";
import { supabase, createAuthClient } from "@src/config/supabase";
import PDFDocument from "pdfkit";

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

    const minCh = Math.min(...chapterNums);
    const maxCh = Math.max(...chapterNums);
    const fileName = `Story_${storySlug}_Ch_${minCh}-${maxCh}.pdf`;

    return new Promise<NextResponse>((resolve) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];
        
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          const uint8Array = new Uint8Array(pdfData);
          
          resolve(new NextResponse(uint8Array, {
            status: 200,
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="${fileName}"`
            }
          }));
        });

        // Xử lý tạo nội dung PDF bất đồng bộ để tải Font trước
        (async () => {
           try {
               // Dùng CDNJS để lấy Font Roboto hỗ trợ Tiếng Việt
               const fontRes = await fetch("https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf");
               const fontBoldRes = await fetch("https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Medium.ttf");
               
               if (fontRes.ok && fontBoldRes.ok) {
                  const fontBuffer = await fontRes.arrayBuffer();
                  const fontBoldBuffer = await fontBoldRes.arrayBuffer();
                  doc.registerFont('Roboto', Buffer.from(fontBuffer));
                  doc.registerFont('Roboto-Bold', Buffer.from(fontBoldBuffer));
                  doc.font('Roboto');
               }
           } catch (e) {
               console.error("Font fetch error:", e);
               // Rơi vào fallback mặc định nếu mất kết nối CDN
           }
           
           doc.font('Roboto-Bold').fontSize(24).text(story.title || "Truyện", { align: 'center' });
           doc.fontSize(12).text(`Nguồn: ${storyUrl}`, { align: 'center' });
           doc.moveDown(2);

           chapters.forEach((chap, idx) => {
               const title = chap.title || `Chương ${chap.chapter_number}`;
               const text = chap.ai_rewritten_content || chap.raw_content || "";
               
               if (idx > 0) doc.addPage();
               
               doc.font('Roboto-Bold').fontSize(18).text(title, { align: 'center' });
               doc.moveDown(1.5);
               doc.font('Roboto').fontSize(12);
               
               const paragraphs = text.split("\n").filter((l: string) => l.trim().length > 0);
               paragraphs.forEach((p: string) => {
                   doc.text(p.trim(), { align: 'justify', indent: 20 });
                   doc.moveDown(0.5);
               });
           });
           
           doc.end();
        })();

      } catch (err: any) {
        resolve(NextResponse.json({ success: false, error: err.message || "Lỗi tạo PDF" }, { status: 500 }));
      }
    });

  } catch (error: any) {
    console.error("PDF Output Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Lỗi đọc dữ liệu PDF" }, { status: 500 });
  }
}
