import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { UserService } from "../../../lib/services/user";
import config from "../../../lib/config";
import { generateViaOpenRouter } from "../../../lib/services/openrouter";

function extractTextFromHtml(html) {
  if (!html) return "";
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ");
  clean = clean.replace(/<!--[\s\S]*?-->/g, " ");
  clean = clean.replace(/<[^>]+>/g, " ");
  clean = clean.replace(/\s+/g, " ").trim();
  return clean;
}

function cleanJsonString(str) {
  if (!str) return "";
  let cleaned = str.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z0-9]*\n/, ""); // Remove opening ```json
    cleaned = cleaned.replace(/\n```$/, ""); // Remove closing ```
    cleaned = cleaned.trim();
  }
  return cleaned;
}


export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { url, keyword, engines = ["chatgpt", "perplexity", "google"] } = body;

    if (!url || !keyword) {
      return new NextResponse("URL and Keyword are required", { status: 400 });
    }

    // 1. Deduct credits (18 credits)
    const cost = config.ai.generationCost || 18;
    try {
      await UserService.deductCredits(session.user.id, cost);
    } catch (err) {
      return new NextResponse("Insufficient credits", { status: 402 });
    }

    // 2. Perform Scrape
    let scrapedText = "";
    let scrapingBlocked = false;

    try {
      let absoluteUrl = url;
      if (!/^https?:\/\//i.test(url)) {
        absoluteUrl = `https://${url}`;
      }

      const scrapeRes = await fetch(absoluteUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        next: { revalidate: 60 }
      });

      if (scrapeRes.ok) {
        const html = await scrapeRes.text();
        const text = extractTextFromHtml(html);
        scrapedText = text.substring(0, 8500); // limit to keep total prompt below 10k character API limit
      } else {
        scrapingBlocked = true;
      }
    } catch (scrapeErr) {
      console.warn("Internal scraper failed, falling back to simulated check:", scrapeErr.message);
      scrapingBlocked = true;
    }

    // 3. Prepare Prompts
    const systemPrompt = `You are an expert Generative Engine Optimization (GEO) auditor and AI Search Visibility specialist.
Your task is to analyze the scraped website text and evaluate how well it is optimized to be cited, referenced, and surfaced in AI-driven search answers (ChatGPT, Perplexity, Google AI Overviews, [...]

You MUST respond with a single, valid JSON object matching this schema exactly:
{
  "visibility_score": 85, 
  "eeat_score": 75, 
  "citation_likelihood": 65, 
  "readability_score": 90, 
  "summary": "Short overview summarizing the website's AI search readiness...",
  "strengths": [
    "Strength item 1",
    "Strength item 2"
  ],
  "weaknesses": [
    "Weakness item 1",
    "Weakness item 2"
  ],
  "technical_audit": {
    "robots_txt": "Status profile here",
    "schema_markup": "Status profile here",
    "sitemap": "Status profile here"
  },
  "recommendations": [
    {
      "area": "Category area",
      "priority": "High/Medium/Low",
      "tips": "Detailed recommendation text..."
    }
  ]
}

DO NOT return any text outside of the JSON object. Do not wrap the JSON object in markdown blocks like ```json ... ```; Just return the raw JSON object string.`;

    let prompt = `Target URL: ${url}\nTarget Search Query / Keyword: ${keyword}\n\n`;
    if (scrapingBlocked || !scrapedText) {
      prompt += `[Notice: Scraper was blocked by target server. Perform a simulated GEO audit based on target URL domain metadata, niche, and known entity reputation for ${url} and target search [...]`;
    } else {
      prompt += `Scraped Page Content:\n${scrapedText}`;
    }

    // 4. Submit to AI provider (OpenRouter)
    const apiKey = config.ai.apiKey;
    let reportData = "";
    let requestId = `openrouter_${Date.now()}`;
    let status = "processing";

    if (apiKey && !apiKey.includes("your_") && apiKey.trim() !== "") {
      try {
        const model = "gpt-4o-mini"; // ajuste conforme necessário
        const genRes = await generateViaOpenRouter(systemPrompt, prompt, { model, temperature: 1 });
        reportData = genRes.text || JSON.stringify(genRes.raw || "");
        requestId = (genRes.raw && (genRes.raw.id || genRes.raw.request_id)) || requestId;
        status = "completed";
      } catch (err) {
        console.warn("OpenRouter generation failed, falling back to mocks:", err.message);
      }
    }

    if (!reportData) {
      // Mock mode fallback
      await new Promise(resolve => setTimeout(resolve, 3000));
      reportData = JSON.stringify({
        visibility_score: Math.floor(Math.random() * 35) + 55,
        eeat_score: Math.floor(Math.random() * 30) + 60,
        citation_likelihood: Math.floor(Math.random() * 40) + 45,
        readability_score: Math.floor(Math.random() * 20) + 75,
        summary: `Mock AI Visibility Audit for ${url} on keyword "${keyword}". The site shows reasonable structure but has gaps in modern AI-crawler discovery markup.`,
        strengths: [
          "Logical HTML document structure with standard paragraph wrappers.",
          "High density of keywords matching the search intent."
        ],
        weaknesses: [
          "No structured JSON-LD Schema markup declaring entities.",
          "Crawler rules in robots.txt do not explicitly list modern AI crawlers (e.g. GPTBot)."
        ],
        technical_audit: {
          robots_txt: "Crawler settings present but standard only.",
          schema_markup: "Missing structured Schema markup.",
          sitemap: "Sitemap xml path not declared in header meta."
        },
        recommendations: [
          {
            area: "Technical GEO",
            priority: "High",
            tips: "Configure robots.txt to explicitly welcome AI parsers (e.g. GPTBot, PerplexityBot) and reference a clean LLM text standard file."
          },
          {
            area: "Entity & Schema",
            priority: "Medium",
            tips: "Inject Organization and FAQ Schema structures to allow crawlers to easily extract key organizational entities and questions/answers."
          }
        ]
      });
      status = "completed";
    }

    // 5. Save report to DB
    let parsedScore = 0;
    let cleanedReport = reportData;
    try {
      cleanedReport = cleanJsonString(reportData);
      const dataObj = JSON.parse(cleanedReport);
      parsedScore = dataObj.visibility_score || 0;
    } catch (e) {
      console.warn("Failed to parse report visibility score, using default");
    }

    const geoReport = await prisma.geoReport.create({
      data: {
        userId: session.user.id,
        url,
        keyword,
        score: parsedScore,
        engines: JSON.stringify(engines),
        reportData: cleanedReport,
        requestId,
        status,
        creditCost: cost
      }
    });

    return NextResponse.json({
      id: geoReport.id,
      score: geoReport.score,
      reportData: geoReport.reportData,
      status: geoReport.status
    });

  } catch (error) {
    console.error("[GENERATION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
