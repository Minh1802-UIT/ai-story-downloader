import { IStoryProvider } from "@src/domain/interfaces";
import { Chapter, StoryContent } from "@src/domain/entities";

export class GenericProvider implements IStoryProvider {
    canHandle(_url: string): boolean {
        return true; // Fallback
    }

    getChapterList(_url: string, _start?: number, _end?: number): Promise<{ success: boolean; chapters?: Chapter[]; error?: string }> {
        return Promise.resolve({ success: false, error: "Trang web này chưa được hỗ trợ. Hiện chỉ hỗ trợ: monkeydtruyen.com, truyenfull (.vn/.com/.vision)" });
    }

    getContent(_url: string): Promise<StoryContent> {
        throw new Error("Trang web này chưa được hỗ trợ. Hiện chỉ hỗ trợ: monkeydtruyen.com, truyenfull (.vn/.com/.vision)");
    }
}
