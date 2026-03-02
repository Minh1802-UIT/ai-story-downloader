
import { genation } from "@src/repositories/genation";
import { env } from "@src/config/env";
import { IStoryProvider } from "@src/domain/interfaces";
import { MonkeyProvider } from "@src/infrastructure/providers/MonkeyProvider";
import { GenericProvider } from "@src/infrastructure/providers/GenericProvider";
import { Chapter, StoryContent } from "@src/domain/entities";

export class StoryService {
    private providers: IStoryProvider[];

    constructor() {
        this.providers = [
            new MonkeyProvider(),
            // TruyenFullProvider removed
            new GenericProvider() 
        ];
    }

    private getProvider(url: string): IStoryProvider {
        const provider = this.providers.find(p => p.canHandle(url));
        return provider || this.providers[this.providers.length - 1]; // Fallback to Generic
    }

    async getChapterList(url: string, start?: number, end?: number): Promise<{ success: boolean; chapters?: Chapter[]; error?: string }> {
        const provider = this.getProvider(url);
        return await provider.getChapterList(url, start, end);
    }

    async getContent(url: string): Promise<StoryContent> {
        const provider = this.getProvider(url);
        const rawData = await provider.getContent(url);

        // --- AI Rewrite Logic ---
        const rewritten = await this.rewriteContent(rawData.content);
        return {
            title: rawData.title,
            content: rewritten || rawData.content
        };
    }

    private async rewriteContent(content: string): Promise<string | null> {
        try {
            if (!content || content.startsWith("Lỗi")) return null;
            
            const client = genation(env.GENATION_API_KEY);
            const response = await client.chat.completions.create({
                model: "gemini-2.0-flash",
                messages: [
                    { role: "system", content: "Bạn là một người viết truyện tiếng Việt, mục đích của bạn là viết lại truyện theo góc nhìn thức nhất cho đọc giả nghe audio truyện, chỉ trả lời đúng mục chính không chào hỏi dẫn dắt" },
                    { role: "user", content: content },
                ],
            });
            return response.choices[0].message.content;
        } catch (e) {
            console.error("AI Rewrite Error:", e);
            return null;
        }
    }
}

export const storyService = new StoryService();
