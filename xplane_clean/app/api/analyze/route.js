import { NextResponse } from "next/server";
import { sql, sqlBatch, initDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

async function ghFetch(url) {
  const res = await fetch(url, {
    headers: { Authorization: `token ${process.env.GITHUB_TOKEN}`, Accept: "application/vnd.github.v3+json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${url}`);
  return res.json();
}

const CODE_EXTS = [".js",".ts",".jsx",".tsx",".py",".java",".go",".rs",".cpp",".c",".cs",".php",".rb",".md",".json",".yaml",".yml",".sh"];

async function getRepoFiles(repoUrl) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s#?]+)/);
  if (!match) throw new Error("Invalid GitHub URL");
  const [, owner, repo] = match;
  const files = [], queue = [""];
  while (queue.length && files.length < 12) {
    const path = queue.shift();
    try {
      const items = await ghFetch(`https://api.github.com/repos/${owner}/${repo.replace(/\.git$/, "")}/contents/${path}`);
      for (const item of Array.isArray(items) ? items : [items]) {
        if (files.length >= 12) break;
        if (item.type === "dir") queue.push(item.path);
        else if (item.type === "file" && CODE_EXTS.some(e => item.name.endsWith(e)) && item.size < 40000) {
          try {
            const raw = await fetch(item.download_url, { signal: AbortSignal.timeout(5000) });
            files.push({ name: item.path, content: (await raw.text()).slice(0, 3000) });
          } catch {}
        }
      }
    } catch {}
  }
  return files;
}

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

function parseRepoName(url) {
  const m = url.match(/github\.com\/([^/]+\/[^/\s#?]+)/);
  return m ? m[1].replace(/\.git$/, "") : url;
}

export async function POST(req) {
  try {
    await initDb();
    const user = getAuthUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { repoUrl } = await req.json();
    if (!repoUrl) return NextResponse.json({ error: "repoUrl required" }, { status: 400 });

    const repoName = parseRepoName(repoUrl);

    // Check cache
    const existing = await sql("SELECT id FROM repos WHERE user_id = ? AND repo_url = ?", [user.id, repoUrl]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ ok: true, cached: true, repoId: existing.rows[0][0] });
    }

    const files = await getRepoFiles(repoUrl);
    if (!files.length) return NextResponse.json({ error: "No readable files found in this repo" }, { status: 400 });

    const repoResult = await sql(
      "INSERT INTO repos (user_id, repo_url, repo_name) VALUES (?, ?, ?)",
      [user.id, repoUrl, repoName]
    );
    const repoId = repoResult.lastInsertRowid;

    // Embed all chunks and batch insert
    const insertStatements = [];
    for (const file of files) {
      const chunks = file.content.match(/.{1,700}/g) || [];
      for (const chunk of chunks) {
        const vector = await embed(chunk);
        insertStatements.push({
          sql: "INSERT INTO chunks (repo_id, file_name, chunk_text, embedding) VALUES (?, ?, ?, ?)",
          args: [repoId, file.name, chunk, JSON.stringify(vector)],
        });
      }
    }
    await sqlBatch(insertStatements);

    return NextResponse.json({ ok: true, cached: false, repoId, fileCount: files.length });
  } catch (e) {
    console.error("ANALYZE ERROR:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
