import { IStoryProvider } from "@src/domain/interfaces";
import { Chapter, StoryContent } from "@src/domain/entities";
import { metruyenchuService } from "@src/services/metruyenchuService";

export class MetruyenchuProvider implements IStoryProvider {
    private service = metruyenchuService();

    canHandle(url: string): boolean {
        return url.includes("metruyenchu.com") || url.includes("metruyencv.com");
    }

    async getChapterList(url: string, start?: number, end?: number): Promise<{ success: boolean; chapters?: Chapter[]; error?: string }> {
        const result = await this.service.getChapterList(url, start, end);
        if (result.success && result.chapters) {
             return { success: true, chapters: result.chapters as Chapter[] };
        }
        return { success: false, error: result.error };
    }

    async getContent(url: string): Promise<StoryContent> {
        const result = await this.service.getStoryUrl(url);
        return {
            title: result.title,
            content: result.content
        };
    }
}
