import * as cheerio from "cheerio";
import { genation } from "@src/repositories/genation";
import { env } from "@src/config/env";

const SPAM_KEYWORDS = [
  "mời quý độc giả",
  "shopee",
  "đăng tải duy nhất",
  "truyện được đăng tại",
  "đọc truyện tại",
];

const SPAM_REGEX = new RegExp(SPAM_KEYWORDS.join("|"), "i");

export const monkeyService = () => {

  // 1. HELPER: Giải mã CSS Content an toàn (Tối ưu từ JSON.parse sang Regex Unescape)
  const cleanCssContent = (text: string): string => {
    if (!text) return "";
    let result = text.replace(/^['"]|['"]$/g, "");
    
    // Unescape unicode dạng \uXXXX
    result = result.replace(/\\u([\dA-F]{4})/gi, (match, grp) => {
        return String.fromCharCode(parseInt(grp, 16));
    });
    
    // Unescape các kí tự đặc biệt thông thường
    return result.replace(/\\(["'\\nrtbfv])/g, (match, char) => {
        switch (char) {
            case "n": return "\n";
            case "r": return "\r";
            case "t": return "\t";
            case "b": return "\b";
            case "f": return "\f";
            case "v": return "\v";
            default: return char;
        }
    });
  };

  // 2. WORKER: Lấy nội dung chi tiết chương
  const getMonkeyUrl = async (url: string): Promise<{ title: string; content: string }> => {
    try {
      const htmlResponse = await fetch(url, {
          headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
          }
      });
      const htmlText = await htmlResponse.text();
      const $ = cheerio.load(htmlText);
      const title = $("title").text().replace(/[-|]\s*(MonkeyD|TruyenFull|Truyện Full|Wattpad).*/i, "").trim() || "story-content";

      // --- Xử lý CSS Obfuscation ---
      const classMap: Record<string, string> = {};
      let allCssText = "";
      $("style").each((_, el) => { allCssText += $(el).html() + "\n"; });

      const regex = /\.([\w\-]+):{1,2}(?:before|after)\s*\{\s*content\s*:\s*(['"])((?:[^\\]|\\.)*?)\2/gi;
      let match;
      while ((match = regex.exec(allCssText)) !== null) {
        const className = match[1];
        const rawContent = match[3];
        if (rawContent && !rawContent.startsWith("\\e") && !rawContent.startsWith("\\f")) {
             const decodedText = cleanCssContent(`"${rawContent}"`);
             if (decodedText) classMap[className] = decodedText;
        }
      }

      // --- Trích xuất nội dung ---
      let fullContent = "";
      const contentContainer = $(".content-container, #content, .reading-content, .chapter-c, #chapter-c");
      
      if (contentContainer.length) {
         contentContainer.find("script, style, .ads, div[class*='ads'], .chapter-nav, .nav-chapter").remove();

         let contentNodes = contentContainer.find("p");
         if (contentNodes.length === 0) {
             // Fallback: Nếu không có thẻ P, duyệt trực tiếp các node con (Text + Br)
             // Wrap trong mảng ảo để tái sử dụng logic
             contentNodes = contentContainer.contents() as any;
         }

         contentNodes.each((_, block) => {
             // Nếu là fallback (direct text/br), `block` chính là node. 
             // Nếu là thẻ P, `block` là Element.
             // Ta xử lý thống nhất:
             
             let nodesToProcess: any[] = [];
             if (block.name === "p" || block.name === "div") {
                 nodesToProcess = $(block).contents().toArray();
             } else {
                 // Case fallback: block chính là node (text, br, span...)
                 nodesToProcess = [block];
             }

             let paragraphText = "";
             
             nodesToProcess.forEach((node) => {
                 if (node.type === "text") {
                     paragraphText += $(node).text();
                 } else if (node.type === "tag" && node.name === "span") {
                     const el = $(node);
                     const classes = el.attr("class")?.split(/\s+/) || [];
                     let injected = false;
                     for (const cls of classes) {
                         if (classMap[cls]) {
                             paragraphText += classMap[cls];
                             injected = true;
                             break;
                         }
                     }
                     if (!injected) paragraphText += el.text();
                 } else if (node.type === "tag" && node.name === "br") {
                     paragraphText += "\n";
                 } else if (node.type === "tag") {
                     paragraphText += $(node).text();
                 }
             });

             const cleanedLine = paragraphText.trim().replace(/\s+/g, " ");
             const lowerLine = cleanedLine.toLowerCase();
             
             // Spam Check
             const isSpam = SPAM_REGEX.test(lowerLine) || 
                            /^(chương|chapter)\s*(trước|sau|tiếp)$/.test(lowerLine);

             if (cleanedLine && !isSpam) {
                 fullContent += cleanedLine + "\n\n";
             }
         });
      }

      if (!fullContent.trim()) {
        return { title, content: "Lỗi: Không tìm thấy nội dung (Selector sai hoặc bị chặn)." };
      }

      // --- AI Rewrite ---
      const contentRewrite = await rewriteContent(fullContent);
      return { 
        title, 
        content: contentRewrite || fullContent 
      };

    } catch (error) {
      console.error(`Error processing ${url}:`, error);
      return { title: "Error", content: "" };
    }
  };

  // 3. AI REWRITE HELPER
  const rewriteContent = async (content: string) => {
    try {
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
        return null;
    }
  };

  // 4. MAIN LOGIC: Lấy danh sách chương (Đã tối ưu)
  const getChapterList = async (url: string, start?: number, end?: number): Promise<{ success: boolean; chapters?: any[]; error?: string }> => {
    try {
      const urlObj = new URL(url);
      const origin = urlObj.origin; // Dynamic origin (https://monkeydtruyen.com or mirrors)

      const fetchAndParse = async (pageUrl: string) => {
        const res = await fetch(pageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
          }
        });
        const html = await res.text();
        return { $: cheerio.load(html) };
      };

      // Helper Parse "Vét Cạn" (Cải tiến Regex)
      const parseChaptersFromDom = ($: cheerio.CheerioAPI) => {
        const items: any[] = [];
        // Ưu tiên class chuẩn
        let listItems = $(".list-chapter li a, .chapter-list a, .row-chapter a, ul.list-chapter a, #list-chapter a, .list-chapters a");
        
        let isTrustedContainer = true;
        // Fallback: Quét rộng nếu không thấy
        if (listItems.length === 0) {
            listItems = $(".content-main a, .story-detail a, #content a, body a");
            isTrustedContainer = false;
        }

        listItems.each((_, el) => {
          const $el = $(el);
          const href = $el.attr("href");
          const title = $el.text().trim();
          
          if (href && title) {
            // Regex match số chương
            // Case 1: Chuẩn "Chương 10", "Chapter 10", "Hồi 10"
            // Case 2: Chỉ có số "10" hoặc "10. Tiêu đề" (nếu trong trusted container)
            // Case 3: URL chứa "chuong-10"
            const numMatch = title.match(/(?:chương|chapter|c|hồi|quyển)\s*([0-9]+)/i) || 
                             title.match(/^([0-9]+)(?:[:.]|\s|$)/) || 
                             href.match(/(?:chuong|chapter|page)-([0-9]+)/i);

            if (numMatch) {
                const chapNum = parseInt(numMatch[1]);
                
                // Logic lọc rác (Footer links, random links)
                let isValid = false;
                if (isTrustedContainer) {
                    // Trong container chuẩn thì nới lỏng: chỉ cần có số là đc
                    isValid = true;
                } else {
                    // Nếu quét body, phải check kỹ hơn
                    const hasKeyword = /chương|chapter|hồi|quyển/i.test(title) || /chuong|chapter/i.test(href);
                    isValid = hasKeyword;
                }

                if (isValid && !isNaN(chapNum)) {
                   // Build Full URL correctly
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

      // --- STEP 1: Fetch Page 1 ---
      const { $ } = await fetchAndParse(url);
      let chapters = parseChaptersFromDom($);

      if (chapters.length === 0) {
          return { success: true, chapters: [] }; 
      }

      // --- STEP 2: Meta Analysis (Total Pages & Sorting) ---
      let totalPages = 1;
      let paginationPattern: string | null = null; // Detect pattern like /trang-{{p}}/ or ?page={{p}}

      const paginationLinks = $(".pagination a, .page-nav a, .pages a");
      paginationLinks.each((_, el) => {
          const href = $(el).attr("href") || "";
          const text = $(el).text().trim();
          
          // Detect logic
          const matchPage = href.match(/page=(\d+)/);
          const matchPath = href.match(/\/trang-(\d+)/);
          
          let p = 1;
          if (matchPage) {
              p = parseInt(matchPage[1]);
              if (!paginationPattern) paginationPattern = "?page={{p}}";
          } else if (matchPath) {
              p = parseInt(matchPath[1]);
              if (!paginationPattern) paginationPattern = "/trang-{{p}}/"; // Simple placeholder
          } else if (text.match(/^\d+$/)) {
              // Just text number, try to infer from href?
              // Sometimes href is javascript:void(0) or similar, skip
              if (href.includes(text)) { 
                 const num = parseInt(text);
                 p = num;
              }
          }

          if (p > totalPages) totalPages = p;
      });

      // Default pattern if not found
      if (!paginationPattern) {
          if (url.includes("?")) paginationPattern = "&page={{p}}";
          else paginationPattern = "?page={{p}}";
      }

      const firstChapOnPage1 = chapters[0].number;
      const lastChapOnPage1 = chapters[chapters.length - 1].number;
      const isDescending = firstChapOnPage1 > lastChapOnPage1; 
      const chaptersPerPage = chapters.length;

      // --- STEP 3: Smart Interpolation (Buffer Fetching) ---
      if (start !== undefined && end !== undefined && totalPages > 1) {
          const minOnPage1 = Math.min(...chapters.map(c => c.number));
          const maxOnPage1 = Math.max(...chapters.map(c => c.number));
          const isOutsidePage1 = isDescending ? end < minOnPage1 : end > maxOnPage1;

          if (isOutsidePage1) {
              let targetPage = 1;
              if (isDescending) {
                  // Descending: newest chapters on page 1
                  // Approx: (MaxGlobal - Target) / PerPage
                  // Assuming MaxGlobal is close to MaxOnPage1
                  const maxGlobal = maxOnPage1; 
                  const diff = maxGlobal - start; 
                  targetPage = 1 + Math.floor(diff / chaptersPerPage);
              } else {
                  // Ascending: Page = Target / PerPage
                  targetPage = Math.ceil(start / chaptersPerPage);
              }

              targetPage = Math.max(1, Math.min(targetPage, totalPages));
              
              // Lấy vùng đệm +/- 1 trang
              const pagesToFetch = [targetPage - 1, targetPage, targetPage + 1]
                  .filter(p => p > 1 && p <= totalPages);
              const uniquePages = [...new Set(pagesToFetch)];

              // Generator URL helper
              const generatePageUrl = (pageWithPattern: string, pageNum: number) => {
                  if (pageWithPattern.includes("{{p}}")) {
                     // Pattern based
                     if (pageWithPattern.includes("?page={{p}}") || pageWithPattern.includes("&page={{p}}")) {
                         const sep = url.includes("?") ? "&" : "?";
                         return `${url}${sep}page=${pageNum}`;
                     }
                     if (pageWithPattern.includes("/trang-{{p}}")) {
                         // Case: https://domain/story/trang-1 -> https://domain/story/trang-2
                         // Or: https://domain/story -> https://domain/story/trang-2
                         // Need to be careful with existing path
                         return url.endsWith("/") 
                            ? `${url}trang-${pageNum}/` 
                            : `${url}/trang-${pageNum}`;
                     }
                  }
                  // Fallback: Standard Query param
                  const sep = url.includes("?") ? "&" : "?";
                  return `${url}${sep}page=${pageNum}`;
              };

              // Use detected pattern to generate URLs
              const pagePromises = uniquePages.map(async (p) => {
                  let pUrl = "";
                  
                  // Helper to construct URL based on detected pattern in DOM
                  // If we saw real links like /trang-2/, we try to mimic that
                  // Check if current URL already has pagination info??
                  
                  // Reset: Clean url from existing page params if we are building fresh
                  // But 'url' arg is likely the main story page or page 1.
                  
                  if (paginationLinks.length > 0) {
                      // Try to find a link that matches our pattern to clone structure
                      // Simplify: Just use the `generatePageUrl` with best effort logic or use the pattern we found
                      if (paginationPattern?.includes("trang-")) {
                           // Construct path style
                           // Remove .html if present? No, usually folder style
                           // e.g. /truyen-abc/trang-2
                           const baseUrl = url.replace(/\/trang-\d+\/?$/, "").replace(/\/$/, ""); 
                           pUrl = `${baseUrl}/trang-${p}`;
                      } else {
                           // Query style
                           const sep = url.includes("?") ? "&" : "?";
                           // Remove existing page param
                           const baseUrl = url.replace(/[?&]page=\d+/, "");
                           pUrl = `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}page=${p}`;
                      }
                  } else {
                       // Fallback
                       const sep = url.includes("?") ? "&" : "?";
                       pUrl = `${url}${sep}page=${p}`;
                  }

                  const { $ : $p } = await fetchAndParse(pUrl);
                  return parseChaptersFromDom($p);
              });

              const extraChaptersList = await Promise.all(pagePromises);
              extraChaptersList.forEach(list => chapters.push(...list));
          }
      }

      // --- STEP 4: Clean & Return ---
      const uniqueChaps = Array.from(new Map(chapters.map(item => [item.number, item])).values());
      uniqueChaps.sort((a, b) => a.number - b.number);

      let result = uniqueChaps;
      if (start !== undefined) result = result.filter(c => c.number >= start);
      if (end !== undefined) result = result.filter(c => c.number <= end);

      return { success: true, chapters: result };

    } catch (error) {
      console.error("Error fetching chapter list:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  };

  return { getMonkeyUrl, getChapterList };
};