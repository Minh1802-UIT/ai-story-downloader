import { IStoryProvider } from "@src/domain/interfaces";
import { Chapter, StoryContent } from "@src/domain/entities";

export class GenericProvider implements IStoryProvider {
    canHandle(_url: string): boolean {
        return true; // Fallback
    }

    getChapterList(_url: string, _start?: number, _end?: number): Promise<{ success: boolean; chapters?: Chapter[]; error?: string }> {
        return Promise.resolve({ success: false, error: "Generic provider not implemented for chapter list" });
    }

    getContent(_url: string): Promise<StoryContent> {
        return Promise.resolve({ title: "Error", content: "Generic provider not implemented for content" });
    }
}
