import { IStoryProvider } from "@src/domain/interfaces";
import { Chapter, StoryContent } from "@src/domain/entities";
import { monkeyService } from "@src/services/monkeyService";

export class MonkeyProvider implements IStoryProvider {
    private service = monkeyService();

    canHandle(url: string): boolean {
        return url.includes("monkeydtruyen.com") || url.includes("truyenfull.vn");
    }

    async getChapterList(url: string, start?: number, end?: number): Promise<{ success: boolean; chapters?: Chapter[]; error?: string }> {
        // monkeyService returns { number, title, url } which matches Chapter interface
        const result = await this.service.getChapterList(url, start, end);
        if (result.success && result.chapters) {
             return { success: true, chapters: result.chapters as Chapter[] };
        }
        return { success: false, error: result.error };
    }

    async getContent(url: string): Promise<StoryContent> {
        const result = await this.service.getMonkeyUrl(url);
        return {
            title: result.title,
            content: result.content
        };
    }
}
