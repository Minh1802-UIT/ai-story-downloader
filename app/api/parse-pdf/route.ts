import { NextResponse } from "next/server";

// Force Node.js runtime — pdf-parse dùng fs module, không tương thích Edge runtime
export const runtime = "nodejs";

export async function POST(request: Request) {
  // pdf-parse/lib/pdf-parse bypasses root index.js which tries to read a test file from disk.
  // This is the standard serverless fix for pdf-parse v1.x (Next.js, Vercel, Lambda, etc.)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse") as (
    buffer: Buffer,
    options?: object
  ) => Promise<{ text: string; numpages: number }>;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size must be under 10MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const data = await pdfParse(buffer);

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
    return NextResponse.json(
      { success: false, error: `Failed to parse PDF: ${msg}` },
      { status: 500 }
    );
  }
}
