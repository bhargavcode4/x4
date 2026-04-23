import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { retrieve } from "@/lib/rag";
import { getOpenAI } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const user = getAuthUser(req);
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { repoId, question, mode } = await req.json();
    if (!repoId || !question) return new Response("Missing params", { status: 400 });

    const db = getDb();

    const cached = await db.execute({
      sql: "SELECT answer FROM cached_answers WHERE repo_id = ? AND question = ?",
      args: [repoId, question],
    });
    if (cached.rows.length > 0) {
      const answer = cached.rows[0][0];
      return new Response(answer, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }

    const chunks = await retrieve(repoId, question, 5);
    const context = chunks.map((c) => `[${c.file}]\n${c.text}`).join("\n\n---\n\n");

    const systemPrompts = {
      summary: "You are a senior engineer. Provide a comprehensive project summary covering purpose, tech stack, architecture, and key components. Use clear headers.",
      beginner: "You are a patient teacher. Explain this codebase to a complete beginner using simple analogies and plain English. Be warm and encouraging.",
      advanced: "You are a staff-level engineer. Provide a deep technical analysis covering patterns, security, performance, and scalability.",
      interview: "You are a technical interviewer. Generate 8 high-quality Q&As about this codebase. Format each as:\nQ: [question]\nA: [detailed answer]",
      chat: "You are a senior engineer who has fully analysed this codebase. Answer questions accurately, referencing specific files when relevant.",
      faq: "You are a developer relations expert. Generate 10 comprehensive FAQ entries for this project. Format each as:\nQ: [question]\nA: [detailed answer]",
    };

    const openai = getOpenAI();
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      stream: true,
      messages: [
        { role: "system", content: systemPrompts[mode] || systemPrompts.chat },
        { role: "user", content: `Codebase context:\n\n${context}\n\n---\n\n${question}` },
      ],
    });

    let fullAnswer = "";
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) { fullAnswer += text; controller.enqueue(new TextEncoder().encode(text)); }
        }
        controller.close();
        db.execute({ sql: "INSERT INTO cached_answers (repo_id, question, answer) VALUES (?, ?, ?)", args: [repoId, question, fullAnswer] }).catch(() => {});
      },
    });

    return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (e) {
    console.error("CHAT ERROR:", e.message, e.stack);
    return new Response("Error: " + e.message, { status: 500 });
  }
}
