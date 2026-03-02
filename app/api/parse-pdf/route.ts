import { NextResponse } from "next/server";

// Force Node.js runtime
export const runtime = "nodejs";

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

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "Only PDF files are supported" },
        { status: 400 }
      );
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size must be under 10MB" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // unpdf: thư viện PDF serverless-compatible, không cần DOM APIs
    const { getDocumentProxy, extractText } = await import("unpdf");

    const pdf = await getDocumentProxy(uint8Array);
    const { text, totalPages } = await extractText(pdf, { mergePages: true });

    const cleanedText = text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return NextResponse.json({
      success: true,
      text: cleanedText,
      pageCount: totalPages,
      wordCount: cleanedText.split(/\s+/).filter(Boolean).length,
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
