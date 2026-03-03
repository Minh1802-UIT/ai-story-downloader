import * as cheerio from "cheerio";

async function testFetch() {
    const url = "https://monkeydtruyen.com/ba-co-cuc-pham-khong-di-tranh-nan-vao-rung-sau-san-manh-thu/chapter-1.html";
    const htmlResponse = await fetch(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
    });
    const htmlText = await htmlResponse.text();
    const $ = cheerio.load(htmlText);
    
    // Thuật toán quét P tag
    const pTags = $("p");
    console.log("Found " + pTags.length + " p tags in total.");
    
    // Nhóm thẻ P theo Parent Node
    const parentMap = new Map();
    pTags.each((_, p) => {
        const parentId = $(p).parent().attr('id');
        const parentClass = $(p).parent().attr('class');
        const key = `ID: ${parentId || 'none'} | Class: ${parentClass || 'none'}`;
        
        if (!parentMap.has(key)) parentMap.set(key, 0);
        parentMap.set(key, parentMap.get(key) + 1);
    });

    console.log("\nP tags grouped by parent:");
    for (const [key, count] of parentMap.entries()) {
        console.log(`- ${key}: ${count} <p> tags`);
    }

    // In thử text của thẻ cha chứa nhiều P nhất (VD: Class "chapter-c" ở một site khác)
    let bestParent = null;
    let max = 0;
    parentMap.forEach((count, key) => {
        if(count > max) { max = count; bestParent = key; }
    });
    
    console.log("\nBest Candidate Container: " + bestParent);
}
testFetch();
