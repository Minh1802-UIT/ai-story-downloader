import { NextResponse } from "next/server";
import { processNextChunk } from "@src/application/services/JobService";

/**
 * POST /api/process-job
 * Body: { jobId }
 * Returns: { done, progress, total }
 *
 * Mỗi call xử lý CHUNK_SIZE (5) chương — dưới 10s Vercel timeout.
 * UI gọi lại liên tục cho đến khi done = true.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "").trim() : "";
    const { jobId } = await request.json();

    if (!jobId || typeof jobId !== "string") {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }

    const result = await processNextChunk(jobId, token);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[POST /api/process-job]", msg);
    return NextResponse.json(
      { success: false, error: msg, done: false, progress: 0 },
      { status: 500 }
    );
  }
}
