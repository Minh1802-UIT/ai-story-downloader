/**
 * Shared helpers for Job Export/Download routes.
 * Mirrors logic in ChapterCacheService to maintain consistent slug/chapter-number extraction.
 */

/**
 * Tạo story slug từ URL chapter.
 * MonkeyDTruyen: /story-slug/1.html  → 'story-slug'
 * TruyenFull:    /story-slug/chuong-1 → 'story-slug'
 */
export const urlToSlug = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split("/").filter(Boolean);

    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const isChapterPart =
        /^\d+(\.html)?$/.test(lastPart) ||
        /(?:chuong|chapter|page)[/-](\d+)/i.test(lastPart);
      if (isChapterPart) {
        return parts[parts.length - 2].replace(/\.html$/, "");
      }
    }
    return parts[parts.length - 1].replace(/\.html$/, "") || encodeURIComponent(url).slice(0, 100);
  } catch {
    return encodeURIComponent(url).slice(0, 100);
  }
};

/**
 * Trích xuất số chương từ URL.
 * Pattern 1 (TruyenFull):    /chuong-10, /chapter-10, /page-10
 * Pattern 2 (MonkeyDTruyen): /123.html hoặc /123
 */
export const extractChapterNumber = (url: string): number | null => {
  const stdMatch = url.match(/(?:chuong|chapter|page)[/-](\d+)/i);
  if (stdMatch) return parseInt(stdMatch[1]);

  try {
    const pathname = new URL(url).pathname;
    const lastSegment = pathname.split("/").filter(Boolean).pop() || "";
    const numMatch = lastSegment.match(/^(\d+)(\.html)?$/);
    if (numMatch) return parseInt(numMatch[1]);
  } catch { /* ignore */ }

  return null;
};
