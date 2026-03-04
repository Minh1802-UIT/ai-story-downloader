import * as cheerio from "cheerio";
import { genation } from "@src/repositories/genation";
import { env } from "@src/config/env";

const SPAM_KEYWORDS = [
  "metruyenchu",
  "mời quý độc giả",
  "đăng tải duy nhất",
  "truyện được đăng tại",
  "đọc truyện tại",
  "bạn đang đọc",
  "nguồn truyện",
];

const SPAM_REGEX = new RegExp(SPAM_KEYWORDS.join("|"), "i");

export const metruyenchuService = () => {

  const getStoryUrl = async (url: string): Promise<{ title: string; content: string }> => {
    try {
      const htmlResponse = await fetch(url, {
          headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          }
      });
      const htmlText = await htmlResponse.text();
      const $ = cheerio.load(htmlText);
      
      const title = $(".chapter-title").text().trim() 
                 || $("h2").first().text().trim()
                 || $("title").text().split("-")[0].trim() 
                 || "Chapter Content";

      let fullContent = "";
      // Metruyenchu thường dùng #chapter-detail, #js-read__content, hoặc .nh-read__content
      const contentContainer = $("#chapter-detail, #js-read__content, .nh-read__content, .content-container");
      
      if (contentContainer.length) {
         contentContainer.find("script, style, .ads, .alert").remove();

         contentContainer.find("p, div").each((_, block) => {
             const textSpan = $(block).text() || "";
             const cleanedLine = textSpan.trim().replace(/\s+/g, " ");
             const lowerLine = cleanedLine.toLowerCase();
             
             const isSpam = SPAM_REGEX.test(lowerLine) || /^(chương|chapter)\s*\d+/.test(lowerLine);

             if (cleanedLine && !isSpam) {
                 fullContent += cleanedLine + "\n\n";
             }
         });
      }

      if (!fullContent.trim()) {
        return { title, content: "Lỗi: Không tìm thấy nội dung truyện, cấu trúc Metruyenchu có thể đã thay đổi." };
      }

      const contentRewrite = await rewriteContent(fullContent);
      return { 
        title, 
        content: contentRewrite || fullContent 
      };

    } catch (error) {
      console.error(`Error processing Metruyenchu ${url}:`, error);
      return { title: "Error", content: "" };
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
    } catch (e) {
        return null;
    }
  };

  const getChapterList = async (url: string, start?: number, end?: number): Promise<{ success: boolean; chapters?: any[]; error?: string }> => {
    try {
      const urlObj = new URL(url);
      const origin = urlObj.origin; 
      
      // Metruyenchu thường dùng API ẩn hoặc data trong script để tải danh sách chương thực tế.
      // Dưới đây là phương pháp cào truyền thống nếu họ in ra html
      const fetchAndParse = async (pageUrl: string) => {
        const res = await fetch(pageUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
        const html = await res.text();
        return { $: cheerio.load(html) };
      };

      const parseChaptersFromDom = ($: cheerio.CheerioAPI) => {
        const items: any[] = [];
        let listItems = $("#chapter-list a, .list-chapter a, ul[data-id='chapter-list'] a");

        listItems.each((_, el) => {
          const $el = $(el);
          const href = $el.attr("href");
          const title = $el.text().trim();
          
          if (href && title) {
            const numMatch = title.match(/(?:chương|chapter|c)\s*([0-9]+)/i) || href.match(/(?:chuong)-([0-9]+)/i);

            if (numMatch) {
                const chapNum = parseInt(numMatch[1]);
                if (!isNaN(chapNum)) {
                   let fullUrl = href;
                   if (!href.startsWith("http")) {
                        fullUrl = `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
                   }
                   if (!items.some(i => i.number === chapNum)) {
                       items.push({ number: chapNum, title, url: fullUrl });
                   }
                }
            }
          }
        });
        return items;
      };

      const { $ } = await fetchAndParse(url);
      let chapters = parseChaptersFromDom($);

      // --- Meta-pagination ---
      let totalPages = 1;
      const paginationLinks = $(".pagination a");
      paginationLinks.each((_, el) => {
          const href = $(el).attr("href") || "";
          const matchPage = href.match(/page=(\d+)/) || href.match(/trang-(\d+)/);
          if (matchPage) {
              const p = parseInt(matchPage[1]);
              if (p > totalPages) totalPages = p;
          }
      });

      if (start !== undefined && end !== undefined && totalPages > 1) {
          const chaptersPerPage = chapters.length || 50; 
          let targetStartPage = Math.max(1, Math.floor((start - 1) / chaptersPerPage) + 1);
          let targetEndPage = Math.max(1, Math.floor((end - 1) / chaptersPerPage) + 1);
          targetEndPage = Math.min(targetEndPage, totalPages);

          const pagesToFetch = [];
          for (let p = targetStartPage; p <= targetEndPage + 1; p++) {
             if (p <= totalPages && p !== 1) pagesToFetch.push(p);
          }

          const uniquePages = [...new Set(pagesToFetch)];
          const pagePromises = uniquePages.map(async (p) => {
              const sep = url.includes("?") ? "&" : "?";
              // Metruyenchu URL usually /truyen-abc?page=2
              const baseUrl = url.replace(/[?&]page=\d+/, "");
              const pUrl = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}page=${p}`;
              const { $ : $p } = await fetchAndParse(pUrl);
              return parseChaptersFromDom($p);
          });

          const extraChaptersList = await Promise.all(pagePromises);
          extraChaptersList.forEach(list => chapters.push(...list));
      }

      const uniqueChaps = Array.from(new Map(chapters.map(item => [item.number, item])).values());
      uniqueChaps.sort((a, b) => a.number - b.number);

      let result = uniqueChaps;
      if (start !== undefined) result = result.filter(c => c.number >= start);
      if (end !== undefined) result = result.filter(c => c.number <= end);

      return { success: true, chapters: result };

    } catch (error) {
      console.error("Error fetching Metruyenchu list:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  return { getStoryUrl, getChapterList };
};
