import { NextResponse } from "next/server";
import { env } from "@src/config/env";
import { GoogleGenerativeAI } from "@google/generative-ai";
import process from "node:process";
import { supabase } from "@src/config/supabase";

export async function POST(request: Request) {
  try {
    const { prompt, content } = await request.json();

    // 1. Xác thực và kiểm tra Credit
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized. Please login." }, { status: 401 } as any);
    }
    
    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session. Please login again." }, { status: 401 } as any);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits < 1) {
      return NextResponse.json({ error: "Bạn đã hết Credit! Vui lòng nạp thêm để tiếp tục sử dụng AI." }, { status: 402 } as any);
    }

    if (!prompt || !content) {
      return NextResponse.json(
        { error: "Prompt and content are required" },
        // deno-lint-ignore no-explicit-any
        { status: 400 } as any // eslint-disable-line @typescript-eslint/no-explicit-any
      );
    }

    const MAX_CONTENT_LENGTH = 100000; // Limit to ~100k chars to avoid timeouts
    if (content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { 
            error: `Content too long (${content.length} chars). Limit is ${MAX_CONTENT_LENGTH}. Please split your content.`,
            code: "CONTENT_TOO_LONG"
        },
        // deno-lint-ignore no-explicit-any
        { status: 413 } as any // Payload Too Large
      );
    }
    
    // Strict prompt validation
    if (prompt.length > 5000) {
         return NextResponse.json(
            { error: "System prompt is too long (max 5000 chars).", code: "PROMPT_TOO_LONG" },
            // deno-lint-ignore no-explicit-any
            { status: 400 } as any
        );
    }

      // Buộc đọc từ process.env để đảm bảo lấy được biến môi trường của Next.js
    let rawKey = process.env.GENATION_API_KEY || env.GENATION_API_KEY || "";
    
    // Làm sạch: xóa khoảng trắng và dấu ngoặc bao quanh nếu có (xử lý trường hợp "KEY" hoặc 'KEY')
    rawKey = rawKey.trim();
    if ((rawKey.startsWith('"') && rawKey.endsWith('"')) || (rawKey.startsWith("'") && rawKey.endsWith("'"))) {
        rawKey = rawKey.slice(1, -1);
    }
    
    const apiKey = rawKey;
    
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE" || apiKey.includes("PLACEHOLDER") || apiKey.length < 20) {
         return NextResponse.json(
        { error: `API Key is invalid (Len: ${apiKey.length}). Check GENATION_API_KEY in .env`, code: "INVALID_API_KEY" },
        // deno-lint-ignore no-explicit-any
        { status: 500 } as any // eslint-disable-line @typescript-eslint/no-explicit-any
      );
    }

    // Sử dụng trực tiếp Google SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Các model được cấu hình để thử theo thứ tự (dựa trên danh sách model có sẵn từ API debug)
    const modelsToTry = ["gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-flash-latest"];
    
    const finalPrompt = `System Instruction: You are a helpful AI assistant.\n\nContext:\n${content.substring(0, 50000)}\n\nUser Request: ${prompt}`;

    let aiResponse = "";
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`Attempting with model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(finalPrompt);
            aiResponse = result.response.text();
            lastError = null;
            break; // Thành công
        } catch (error) {
            console.warn(`Failed with model ${modelName}:`, error);
            lastError = error;
            // Thử model tiếp theo
        }
    }

    if (lastError && !aiResponse) {
        let errorMsg = lastError instanceof Error ? lastError.message : String(lastError);

        if (errorMsg.includes("429") || errorMsg.includes("Too Many Requests")) {
             return NextResponse.json(
                { error: "⚠️ AI Overloaded (429): Google Quota Exceeded. Please wait ~30s." },
                // deno-lint-ignore no-explicit-any
                { status: 429 } as any
            );
        }
        
        try {
            // Lấy danh sách model có sẵn để hiển thị cho người dùng
            const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            if (listResp.ok) {
                 const listData = await listResp.json();
                 const modelNames = listData.models?.map((m: { name: string }) => m.name.replace('models/', '')) || [];
                 errorMsg += `\n\nAVAILABLE MODELS for this key: ${modelNames.join(', ')}`;
            } else {
                errorMsg += `\n\n(Could not list models: ${listResp.status} ${listResp.statusText})`;
            }
        } catch (listErr) {
             errorMsg += `\n\n(Failed to fetch models list: ${listErr})`;
        }

        return NextResponse.json(
            { error: errorMsg },
            // deno-lint-ignore no-explicit-any
            { status: 500 } as any // eslint-disable-line @typescript-eslint/no-explicit-any
        );
    }

    if (aiResponse) {
       // Trừ 1 credit
       await supabase.from("profiles").update({ credits: profile.credits - 1 }).eq("id", user.id);
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        response: aiResponse
      }
    });

  } catch (error) {
    console.error("AI FATAL ERROR (Google SDK):", error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process with AI" },
      // deno-lint-ignore no-explicit-any
      { status: 500 } as any // eslint-disable-line @typescript-eslint/no-explicit-any
    );
  }
}
