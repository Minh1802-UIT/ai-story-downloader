import { createServiceClient } from "@src/config/supabase";

type CacheEntry = { raw_content: string; ai_rewritten_content: string | null };

// Tạo slug từ URL để làm key lưu story
const urlToSlug = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    // Lấy phần cuối cuả path, bỏ đuôi .html
    const parts = pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 2] || parts[parts.length - 1] || url;
    return slug.replace(/\.html$/, "");
  } catch {
    return encodeURIComponent(url).slice(0, 100);
  }
};

// Trích xuất số chương từ URL (pattern: /chuong-10, /chapter-10, /page-10)
const extractChapterNumber = (url: string): number | null => {
  const match = url.match(/(?:chuong|chapter|page)[/-](\d+)/i);
  return match ? parseInt(match[1]) : null;
};

export const chapterCache = {
  /**
   * Đọc từ cache Supabase. Trả về null nếu chưa có.
   */
  async get(chapterUrl: string): Promise<CacheEntry | null> {
    try {
      const chapterNum = extractChapterNumber(chapterUrl);
      if (!chapterNum) return null;

      // Lấy story slug từ URL
      const storySlug = urlToSlug(chapterUrl);

      const serviceClient = createServiceClient();
      
      // 1. Tìm story trong DB
      const { data: story } = await serviceClient
        .from("stories")
        .select("id")
        .eq("slug", storySlug)
        .single();

      if (!story) return null;

      // 2. Tìm chapter trong DB
      const { data: chapter, error } = await serviceClient
        .from("chapters")
        .select("raw_content, ai_rewritten_content")
        .eq("story_id", story.id)
        .eq("chapter_number", chapterNum)
        .single();

      if (error || !chapter?.raw_content) return null;

      console.log(`[Cache HIT] Chapter ${chapterNum} from DB.`);
      return {
        raw_content: chapter.raw_content,
        ai_rewritten_content: chapter.ai_rewritten_content,
      };
    } catch (e) {
      console.error("[Cache] GET error:", e);
      return null;
    }
  },

  /**
   * Lưu dữ liệu vào Supabase cache. Fire-and-forget (không block response).
   */
  async set(
    chapterUrl: string,
    title: string,
    rawContent: string,
    aiContent: string | null
  ): Promise<void> {
    try {
      const chapterNum = extractChapterNumber(chapterUrl);
      if (!chapterNum) return;

      const storySlug = urlToSlug(chapterUrl);

      const serviceClient = createServiceClient();
      
      // 1. Upsert story (tạo nếu chưa có, không làm gì nếu đã có)
      const { data: story, error: storyErr } = await serviceClient
        .from("stories")
        .upsert(
          { slug: storySlug, source_url: chapterUrl, title },
          { onConflict: "slug", ignoreDuplicates: false }
        )
        .select("id")
        .single();

      if (storyErr || !story) {
        console.error("[Cache] Failed to upsert story:", storyErr);
        return;
      }

      // 2. Upsert chapter
      const { error: chapErr } = await serviceClient.from("chapters").upsert(
        {
          story_id: story.id,
          chapter_number: chapterNum,
          title,
          raw_content: rawContent,
          ai_rewritten_content: aiContent,
        },
        { onConflict: "story_id,chapter_number" }
      );

      if (chapErr) {
        console.error("[Cache] Failed to upsert chapter:", chapErr);
      } else {
        console.log(`[Cache SET] Chapter ${chapterNum} saved to DB.`);
      }
    } catch (e) {
      console.error("[Cache] SET error:", e);
    }
  },
};
