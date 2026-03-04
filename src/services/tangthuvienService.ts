import * as cheerio from "cheerio";
import { genation } from "@src/repositories/genation";
import { env } from "@src/config/env";

const SPAM_KEYWORDS = [
  "tangthuvien",
  "mời quý độc giả",
  "đăng tải duy nhất",
  "truyện được đăng tại",
  "đọc truyện tại",
  "bạn đang đọc",
  "nguồn truyện",
  "truyen.tangthuvien",
];

const SPAM_REGEX = new RegExp(SPAM_KEYWORDS.join("|"), "i");

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  "Referer": "https://truyen.tangthuvien.vn/",
};

export const tangthuvienService = () => {

  const safeFetch = async (url: string) => {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
    return res.text();
  };

  const getStoryUrl = async (url: string): Promise<{ title: string; content: string }> => {
    try {
      const html = await safeFetch(url);
      const $ = cheerio.load(html);

      // Tangthuvien: tiêu đề chương
      const title = $("h2").first().text().trim()
                 || $(".truyen-title").text().trim()
                 || $("title").text().split("-")[0].trim()
                 || "Chapter Content";

      let fullContent = "";

      // Tangthuvien: nội dung chương thường nằm trong .box-chap hoặc #book-content
      const contentContainer = $(".box-chap, #book-content, .chapter-content, .content-chapter");

      if (contentContainer.length) {
        contentContainer.find("script, style, .ads, .alert, .adsbygoogle").remove();

        contentContainer.find("p, div, br").each((_, block) => {
          const text = $(block).text().trim().replace(/\s+/g, " ");
          const isSpam = SPAM_REGEX.test(text.toLowerCase()) || /^(chương|chapter)\s*\d+/i.test(text);
          if (text && !isSpam) {
            fullContent += text + "\n\n";
          }
        });
      }

      // Fallback: lấy toàn bộ text nếu selector không match
      if (!fullContent.trim()) {
        const bodyText = $("body").text().trim();
        if (bodyText.length > 200) {
          fullContent = bodyText;
        } else {
          return { title, content: "Lỗi: Không tìm thấy nội dung. Cấu trúc Tangthuvien có thể đã thay đổi." };
        }
      }

      const contentRewrite = await rewriteContent(fullContent);
      return { title, content: contentRewrite || fullContent };

    } catch (error) {
      console.error(`Error processing Tangthuvien ${url}:`, error);
      return { title: "Error", content: `Lỗi khi tải nội dung: ${error instanceof Error ? error.message : "Unknown"}` };
    }
  };

  const rewriteContent = async (content: string) => {
    try {
      const client = genation(env.GENATION_API_KEY);
      const response = await client.chat.completions.create({
        model: "gemini-2.0-flash",
        messages: [
          { role: "system", content: "Bạn là một người viết truyện tiếng Việt, mục đích của bạn là viết lại truyện theo góc nhìn thứ nhất cho độc giả nghe audio truyện, chỉ trả lời đúng mục chính không chào hỏi dẫn dắt" },
          { role: "user", content: content },
        ],
      });
      return response.choices[0].message.content;
    } catch { return null; }
  };

  const getChapterList = async (url: string, start?: number, end?: number): Promise<{ success: boolean; chapters?: any[]; error?: string }> => {
    try {
      const urlObj = new URL(url);
      const origin = urlObj.origin;

      const html = await safeFetch(url);
      const $ = cheerio.load(html);

      let chapters: any[] = [];

      // Tangthuvien: danh sách chương thường trong ul.cf > li > a, hoặc #chapter-list a
      const chapterLinks = $("ul.cf li a, #chapter-list a, .list-chapter a, .volume-list a");

      chapterLinks.each((_, el) => {
        const $el = $(el);
        const href = $el.attr("href");
        const text = $el.text().trim();

        if (href && text) {
          const numMatch = text.match(/(?:chương|chapter|c)\s*([0-9]+)/i) || href.match(/chuong-([0-9]+)/i);
          if (numMatch) {
            const chapNum = parseInt(numMatch[1]);
            if (!isNaN(chapNum)) {
              let fullUrl = href;
              if (!href.startsWith("http")) {
                fullUrl = `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
              }
              if (!chapters.some(c => c.number === chapNum)) {
                chapters.push({ number: chapNum, title: text, url: fullUrl });
              }
            }
          }
        }
      });

      // Pagination: kiểm tra nếu có nhiều trang mục lục
      let totalPages = 1;
      $(".pagination a, .page-nav a").each((_, el) => {
        const href = $(el).attr("href") || "";
        const match = href.match(/page[=/-](\d+)/i);
        if (match) {
          const p = parseInt(match[1]);
          if (p > totalPages) totalPages = p;
        }
      });

      if (totalPages > 1 && start !== undefined && end !== undefined) {
        const chapPerPage = chapters.length || 50;
        const startPage = Math.max(1, Math.floor((start - 1) / chapPerPage) + 1);
        const endPage = Math.min(totalPages, Math.floor((end - 1) / chapPerPage) + 1);

        for (let p = startPage; p <= endPage + 1 && p <= totalPages; p++) {
          if (p === 1) continue;
          const sep = url.includes("?") ? "&" : "?";
          const pageUrl = `${url.replace(/[?&]page=\d+/, "")}${sep}page=${p}`;
          try {
            const pageHtml = await safeFetch(pageUrl);
            const $p = cheerio.load(pageHtml);
            $p("ul.cf li a, #chapter-list a, .list-chapter a, .volume-list a").each((_, el) => {
              const href = $p(el).attr("href");
              const text = $p(el).text().trim();
              if (href && text) {
                const numMatch = text.match(/(?:chương|chapter|c)\s*([0-9]+)/i) || href.match(/chuong-([0-9]+)/i);
                if (numMatch) {
                  const chapNum = parseInt(numMatch[1]);
                  let fullUrl = href;
                  if (!href.startsWith("http")) fullUrl = `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
                  if (!chapters.some(c => c.number === chapNum)) {
                    chapters.push({ number: chapNum, title: text, url: fullUrl });
                  }
                }
              }
            });
          } catch { /* skip failed pages */ }
        }
      }

      // Sắp xếp và lọc
      chapters.sort((a, b) => a.number - b.number);
      if (start !== undefined) chapters = chapters.filter(c => c.number >= start);
      if (end !== undefined) chapters = chapters.filter(c => c.number <= end);

      return { success: true, chapters };

    } catch (error) {
      console.error("Error fetching Tangthuvien chapter list:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  return { getStoryUrl, getChapterList };
};
