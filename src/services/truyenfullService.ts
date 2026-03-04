import * as cheerio from "cheerio";
import { genation } from "@src/repositories/genation";
import { env } from "@src/config/env";

const SPAM_KEYWORDS = [
  "mời quý độc giả",
  "đăng tải duy nhất",
  "truyện được đăng tại",
  "đọc truyện tại",
  "bạn đang đọc",
  "nguồn truyện",
  "nguồn:",
  "nguồn :",
];

const SPAM_REGEX = new RegExp(SPAM_KEYWORDS.join("|"), "i");
// Các dòng chứa URL text thuần tuý hoặc domain lạ cũng coi là rác
const URL_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:truyenfull\.vn|truyenfull\.com|wattpad\.com)[^\s]*/i;

export const truyenfullService = () => {

  const getStoryUrl = async (url: string): Promise<{ title: string; content: string }> => {
    try {
      const htmlResponse = await fetch(url, {
          headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9,vi;q=0.8"
          }
      });
      const htmlText = await htmlResponse.text();
      const $ = cheerio.load(htmlText);
      
      const title = $("a.chapter-title").text().trim() 
                 || $(".chapter-title").text().trim() 
                 || $("title").text().split("-")[0].trim() 
                 || "Chapter Content";

      // --- Trích xuất nội dung ---
      let fullContent = "";
      const contentContainer = $(".chapter-c");
      
      if (contentContainer.length) {
         // Xoá quảng cáo
         contentContainer.find("script, style, .ads, div[class*='ads'], iframe").remove();

         contentContainer.find("p, div, br").each((_, block) => {
             // Lấy text trực tiếp, thay các thẻ <br> thành dấu xuống dòng
             let textSpan = $(block).text() || "";
             
             // Nếu là text Node thuần không bọc thẻ
             if (block.type === 'tag' && block.name === 'br') {
                fullContent += "\n";
                return;
             }

             const cleanedLine = textSpan.trim().replace(/\s+/g, " ");
             const lowerLine = cleanedLine.toLowerCase();
             
             // Spam Check
             const isSpam = SPAM_REGEX.test(lowerLine) || 
                            URL_REGEX.test(lowerLine) ||
                            /^(chương|chapter)\s*\d+/.test(lowerLine);

             if (cleanedLine && !isSpam) {
                 fullContent += cleanedLine + "\n\n";
             }
         });
         
         // Trường hợp web không dùng thẻ p/div mà dùng br cắt dòng nát bét
         if (!fullContent.trim()) {
            let directText = contentContainer.html() || "";
            directText = directText
                .replace(/<br\s*[\/]?>/gi, "\n")
                .replace(/<[^>]+>/g, ""); // Dọn sạch HTML tag dư
            
            directText.split("\n").forEach(line => {
                const cleanedLine = line.trim().replace(/\s+/g, " ");
                const lowerLine = cleanedLine.toLowerCase();
                 
                // Spam Check
                const isSpam = SPAM_REGEX.test(lowerLine) || 
                               URL_REGEX.test(lowerLine) ||
                               /^(chương|chapter)\s*\d+/.test(lowerLine);

                if (cleanedLine && !isSpam) {
                    fullContent += cleanedLine + "\n\n";
                }
            });
         }
      }

      if (!fullContent.trim()) {
        return { title, content: "Lỗi: Không tìm thấy nội dung truyện, có thể TruyenFull đã đổi cấu trúc hoặc chặn bot." };
      }

      // --- AI Rewrite ---
      const contentRewrite = await rewriteContent(fullContent);
      return { 
        title, 
        content: contentRewrite || fullContent 
      };

    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      return { title: "Error Fetching Content", content: "" };
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

      const fetchAndParse = async (pageUrl: string) => {
        const res = await fetch(pageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8"
          }
        });
        const html = await res.text();
        return { $: cheerio.load(html) };
      };

      const parseChaptersFromDom = ($: cheerio.CheerioAPI) => {
        const items: any[] = [];
        
        let listItems = $("ul.list-chapter li a");

        listItems.each((_, el) => {
          const $el = $(el);
          const href = $el.attr("href");
          const title = $el.attr("title") || $el.text().trim();
          
          if (href && title) {
            const numMatch = title.match(/(?:chương|chapter|c)\s*([0-9]+)/i) || 
                             href.match(/(?:chuong)-([0-9]+)/i);

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

      if (chapters.length === 0) {
          return { success: true, chapters: [] }; 
      }

      let totalPages = 1;

      // TruyenFull Pagination: <ul class="pagination"><li class="active"><span>1</span></li><li><a href=".../trang-2/">2</a></li>
      const paginationInputs = $("#total-page"); 
      if (paginationInputs.length > 0) {
          totalPages = parseInt(paginationInputs.val() as string) || 1;
      } else {
         const paginationLinks = $("ul.pagination li a");
         paginationLinks.each((_, el) => {
             const href = $(el).attr("href") || "";
             const matchPath = href.match(/\/trang-(\d+)/);
             if (matchPath) {
                 const p = parseInt(matchPath[1]);
                 if (p > totalPages) totalPages = p;
             }
         });
      }

      const chaptersPerPage = chapters.length || 50;

      if (start !== undefined && end !== undefined && totalPages > 1) {
          
          // Logic TruyenFull trang 1 luôn chứa chương mới nhất hoặc cũ nhất tuỳ truyện
          // Hầu hết Truyenfull xếp từ Chương 1 -> N
          let targetStartPage = Math.max(1, Math.floor((start - 1) / chaptersPerPage) + 1);
          let targetEndPage = Math.max(1, Math.floor((end - 1) / chaptersPerPage) + 1);
          targetEndPage = Math.min(targetEndPage, totalPages);

          const pagesToFetch = [];
          for (let p = targetStartPage; p <= targetEndPage + 1; p++) {
             if (p <= totalPages && p !== 1) pagesToFetch.push(p);
          }

          const uniquePages = [...new Set(pagesToFetch)];

          const pagePromises = uniquePages.map(async (p) => {
              // Xây dựng URL trang `https://truyenfull.vn/ten-truyen/trang-2/`
              const baseUrl = url.replace(/\/trang-\d+\/?$/, "").replace(/\/$/, ""); 
              const pUrl = `${baseUrl}/trang-${p}/`;

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
      console.error("Error fetching TruyenFull list:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  return { getStoryUrl, getChapterList };
};
