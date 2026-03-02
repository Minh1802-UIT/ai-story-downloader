import { NextResponse } from "next/server";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;

/**
 * POST /api/parse-pdf
 * Body: FormData với field "file" chứa PDF
 * Returns: { success, text, pageCount, filename }
 *
 * Trích xuất text từ file PDF để dùng làm input context cho AI Studio.
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Kiểm tra MIME type
    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    // Giới hạn 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size must be under 10MB" },
        { status: 400 }
      );
    }

    // Đọc buffer từ file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const data = await pdfParse(buffer);

    // Làm sạch text: xóa khoảng trắng thừa
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
