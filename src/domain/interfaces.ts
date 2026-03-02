import { Chapter, StoryContent } from "@src/domain/entities";

export interface IStoryProvider {
    canHandle(url: string): boolean;
    getChapterList(url: string, start?: number, end?: number): Promise<{ success: boolean; chapters?: Chapter[]; error?: string }>;
    getContent(url: string): Promise<StoryContent>;
}
