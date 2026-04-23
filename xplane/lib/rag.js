import { embed } from "./openai";
import { getDb } from "./db";

function chunkText(text, size = 700) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks.slice(0, 5);
}

export async function buildAndStoreIndex(repoId, files) {
  const db = getDb();

  const allChunks = [];

  for (const file of files) {
    const chunks = chunkText(file.content);
    for (const chunk of chunks) {
      allChunks.push({
        file: file.name,
        text: chunk,
      });
    }
  }

  const vectors = await Promise.all(
    allChunks.map((c) => embed(c.text))
  );

  const queries = allChunks.map((c, i) => ({
    sql: `INSERT INTO chunks (repo_id, file_name, chunk_text, embedding) VALUES (?, ?, ?, ?)`,
    args: [repoId, c.file, c.text, JSON.stringify(vectors[i])],
  }));

  await db.batch(queries);
}
