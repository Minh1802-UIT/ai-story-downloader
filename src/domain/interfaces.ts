import { Chapter, StoryContent } from "@src/domain/entities";

export interface IStoryProvider {
    canHandle(url: string): boolean;
    getChapterList(url: string, start?: number, end?: number): Promise<{ success: boolean; chapters?: Chapter[]; error?: string }>;
    getContent(url: string): Promise<StoryContent>;
}

// API Response Types
export type ApiErrorResponse = {
    success: false;
    error: string;
    code: string;
    details?: string;
};

export type ApiSuccessResponse<T> = {
    success: true;
    data: T;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
