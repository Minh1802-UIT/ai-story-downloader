import { genation } from "@src/repositories/genation";
import { env } from "@src/config/env";
import { IStoryProvider } from "@src/domain/interfaces";
import { MonkeyProvider } from "@src/infrastructure/providers/MonkeyProvider";
import { TruyenFullProvider } from "@src/infrastructure/providers/TruyenFullProvider";
import { GenericProvider } from "@src/infrastructure/providers/GenericProvider";
import { Chapter, StoryContent } from "@src/domain/entities";
import { chapterCache } from "@src/application/services/ChapterCacheService";

export class StoryService {
    private providers: IStoryProvider[];

    constructor() {
        this.providers = [
            new MonkeyProvider(),
            new TruyenFullProvider(),
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

    async getContent(url: string, skipAi: boolean = false): Promise<StoryContent> {
        // ---- [CACHE LAYER] Check Supabase trước ----
        const cached = await chapterCache.get(url);
        if (cached) {
            // Cache HIT: Trả về kết quả đã lưu, không tốn 1 đồng API
            return {
                title: "Cached Chapter",
                content: skipAi ? cached.raw_content : (cached.ai_rewritten_content || cached.raw_content),
            };
        }

        // Cache MISS: Đi crawl web và gọi AI như bình thường
        const provider = this.getProvider(url);
        const rawData = await provider.getContent(url);

        let rewritten = null;
        if (!skipAi) {
            rewritten = await this.rewriteContent(rawData.content);
        }
        const finalContent = rewritten || rawData.content;

        // ---- [CACHE LAYER] Lưu kết quả vào Supabase (Fire & Forget) ----
        // Không cần await - lưu nền, không làm chậm response trả về cho user
        chapterCache
            .set(url, rawData.title, rawData.content, rewritten)
            .catch(err => console.error("[StoryService] Failed to save cache:", err));

        return {
            title: rawData.title,
            content: finalContent,
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

