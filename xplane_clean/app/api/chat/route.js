import { sql } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

async function embed(text) {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text.slice(0, 8000) }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Embed failed");
  return data.data[0].embedding;
}

function cosine(a, b) {
  let dot = 0, A = 0, B = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; A += a[i]*a[i]; B += b[i]*b[i]; }
  return dot / (Math.sqrt(A) * Math.sqrt(B));
}

async function retrieve(repoId, query, topN = 5) {
  const qVec = await embed(query);
  const rows = await sql("SELECT file_name, chunk_text, embedding FROM chunks WHERE repo_id = ?", [repoId]);
  return rows.rows
    .map(r => ({ file: r[0], text: r[1], score: cosine(qVec, JSON.parse(r[2])) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

const PROMPTS = {
  summary: "You are a senior engineer. Provide a comprehensive project summary: purpose, tech stack, architecture, key components. Use clear headers.",
  beginner: "You are a patient teacher. Explain this codebase to a complete beginner using simple analogies. Be warm and encouraging.",
  advanced: "You are a staff engineer. Deep technical analysis: architectural patterns, security considerations, performance, scalability.",
  interview: "You are a technical interviewer. Generate 8 high-quality Q&As about this codebase.\nFormat:\nQ: [question]\nA: [detailed answer]",
  faq: "You are a developer relations expert. Generate 10 FAQ entries for new developers.\nFormat:\nQ: [question]\nA: [detailed answer]",
  chat: "You are a senior engineer who has fully analysed this codebase. Answer questions accurately, referencing specific files when relevant.",
};

export async function POST(req) {
  try {
    const user = getAuthUser(req);
    if (!user) return new Response("Unauthorized", { status: 401 });

    const { repoId, question, mode } = await req.json();
    if (!repoId || !question) return new Response("Missing params", { status: 400 });

    // Check cache
    const cached = await sql(
      "SELECT answer FROM cached_answers WHERE repo_id = ? AND question = ?",
      [repoId, question]
    );
    if (cached.rows.length > 0) {
      return new Response(cached.rows[0][0], { headers: { "Content-Type": "text/plain" } });
    }

    const chunks = await retrieve(repoId, question, 5);
    const context = chunks.map(c => `[${c.file}]\n${c.text}`).join("\n\n---\n\n");

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        stream: true,
        messages: [
          { role: "system", content: PROMPTS[mode] || PROMPTS.chat },
          { role: "user", content: `Codebase context:\n\n${context}\n\n---\n\n${question}` },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const err = await openaiRes.text();
      throw new Error("OpenAI error: " + err);
    }

    let fullAnswer = "";
    const readable = new ReadableStream({
      async start(controller) {
        const reader = openaiRes.body.getReader();
        const dec = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const line of dec.decode(value).split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const text = JSON.parse(data).choices?.[0]?.delta?.content || "";
              if (text) { fullAnswer += text; controller.enqueue(new TextEncoder().encode(text)); }
            } catch {}
          }
        }
        controller.close();
        if (fullAnswer) {
          sql("INSERT INTO cached_answers (repo_id, question, answer) VALUES (?, ?, ?)",
            [repoId, question, fullAnswer]).catch(() => {});
        }
      },
    });

    return new Response(readable, { headers: { "Content-Type": "text/plain" } });
  } catch (e) {
    console.error("CHAT ERROR:", e.message);
    return new Response("Error: " + e.message, { status: 500 });
  }
}
