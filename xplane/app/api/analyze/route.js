import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { getRepoFiles, parseRepoName } from "@/lib/github";
import { buildAndStoreIndex } from "@/lib/rag";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repoUrl } = await req.json();
    if (!repoUrl) {
      return NextResponse.json({ error: "repoUrl required" }, { status: 400 });
    }

    const db = getDb();
    const repoName = parseRepoName(repoUrl);

    console.log("Analyzing repo:", repoUrl);

    const existing = await db.execute({
      sql: "SELECT id FROM repos WHERE user_id = ? AND repo_url = ?",
      args: [user.id, repoUrl],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json({
        ok: true,
        cached: true,
        repoId: Number(existing.rows[0][0]),
      });
    }

    const files = await getRepoFiles(repoUrl);

    if (!files.length) {
      return NextResponse.json(
        { error: "No readable files found" },
        { status: 400 }
      );
    }

    const repoResult = await db.execute({
      sql: "INSERT INTO repos (user_id, repo_url, repo_name) VALUES (?, ?, ?)",
      args: [user.id, repoUrl, repoName],
    });

    const repoId = Number(repoResult.lastInsertRowid);

    await buildAndStoreIndex(repoId, files);

    return NextResponse.json({
      ok: true,
      cached: false,
      repoId,
      fileCount: files.length,
    });
  } catch (e) {
    console.error("ANALYZE ERROR:", e);
    return NextResponse.json(
      { error: e.message || "Analysis failed" },
      { status: 500 }
    );
  }
}
