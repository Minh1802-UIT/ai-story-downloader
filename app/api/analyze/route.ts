import { NextResponse } from "next/server";
import { storyService } from "@src/application/services/StoryService";
import { ApiErrorResponse, ApiSuccessResponse, ApiResponse } from "@src/domain/interfaces";
import { Chapter, StoryContent } from "@src/domain/entities";

// List of domains known to work well with the current extraction logic
const SUPPORTED_DOMAINS = ["monkeydtruyen.com", "truyenfull.vn"];

export async function POST(request: Request) {
  try {
    const { url, type, start, end } = await request.json();

    // 1. Basic Existence Check
    if (!url || typeof url !== "string") {
      return NextResponse.json<ApiErrorResponse>(
        { 
          success: false,
          error: "URL is required and must be a string",
          code: "MISSING_URL"
        },
        { status: 400 }
      );
    }

    // ... (Validation 2, 3, 4 remain same) ...

    // 5. Service Execution (via Application Layer)
    // Check if request is for chapter list
    if (type === "list") {
        const listResult = await storyService.getChapterList(url, start, end);
        if (!listResult.success) {
            return NextResponse.json<ApiErrorResponse>(
                {
                    success: false,
                    error: listResult.error || "Failed to fetch chapters",
                    code: "CHAPTER_LIST_ERROR"
                },
                { status: 400 }
            );
        }
        return NextResponse.json<ApiSuccessResponse<Chapter[]>>({
            success: true,
            data: listResult.chapters || []
        });
    }

    // Fetch single content
    const result = await storyService.getContent(url);

    // 6. Content Validation
    if (!result.content || result.content.includes("Không tìm thấy nội dung")) {
       return NextResponse.json<ApiErrorResponse>(
        { 
            success: false,
            error: "Content extraction failed. The chapter content could not be found via selectors.",
            code: "CONTENT_NOT_FOUND",
            details: result.content // specific error from service
        },
        { status: 422 }
       );
    }

    return NextResponse.json<ApiSuccessResponse<StoryContent & { url: string }>>({ 
      success: true, 
      data: {
        title: result.title,
        content: result.content,
        url
      }
    });

  } catch (error) {
    console.error("Analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze URL";
    
    return NextResponse.json<ApiErrorResponse>(
      { 
          success: false,
          error: errorMessage,
          code: "INTERNAL_SERVER_ERROR"
      },
      { status: 500 }
    );
  }
}
