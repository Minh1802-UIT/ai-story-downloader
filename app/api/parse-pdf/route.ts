import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Workaround Vercel DOMMatrix / canvas / worker issues.
// Nếu Vercel vẫn lỗi, nên chuyển đổi xử lý sang Client Side 
// (Tức là trên UI dùng pdf.js duyệt text trực tiếp trong trình duyệt).
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    // Dynamic require để tránh Vercel static analyzer làm lỗi build
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse/lib/pdf-parse") as (
      buffer: Buffer,
      options?: object
    ) => Promise<{ text: string; numpages: number }>;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Disable worker để fix lỗi môi trường Serverless của Vercel
    const options = {
      pagerender: function (pageData: any) {
        return pageData.getTextContent({ normalizeWhitespace: true }).then(function (textContent: any) {
          let lastY, text = "";
          for (const item of textContent.items) {
            if (lastY == item.transform[5] || !lastY) {
              text += item.str;
            } else {
              text += "\n" + item.str;
            }
            lastY = item.transform[5];
          }
          return text;
        });
      },
    };

    const data = await pdfParse(buffer, options);

    const cleanedText = data.text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return NextResponse.json({
      success: true,
      text: cleanedText,
      pageCount: data.numpages,
      wordCount: cleanedText.split(/\s+/).length,
      filename: file.name,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[POST /api/parse-pdf]", msg);
    return NextResponse.json({ success: false, error: `Failed to parse PDF: ${msg}` }, { status: 500 });
  }
}
