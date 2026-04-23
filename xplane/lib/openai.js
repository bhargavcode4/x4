import OpenAI from "openai";

let _client;
export function getOpenAI() {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export async function embed(text) {
  const res = await getOpenAI().embeddings.create({
    model: "text-embedding-3-small",
    input: text.slice(0, 8000),
  });
  return res.data[0].embedding;
}

export function cosine(a, b) {
  let dot = 0, A = 0, B = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    A += a[i] * a[i];
    B += b[i] * b[i];
  }
  return dot / (Math.sqrt(A) * Math.sqrt(B));
}
