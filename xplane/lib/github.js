import axios from "axios";

const api = axios.create({
  timeout: 10000,
  headers: {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  },
});

const CODE_EXTS = [".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".go", ".rs"];

async function getContents(owner, repo, path = "") {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const res = await api.get(url);
  return res.data;
}

export async function getRepoFiles(repoUrl) {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/\s]+)/);
  if (!match) throw new Error("Invalid GitHub URL");

  const [, owner, repoRaw] = match;
  const repo = repoRaw.replace(/\.git$/, "");

  const files = [];
  const queue = [""];

  const MAX_FILES = 10;

  while (queue.length && files.length < MAX_FILES) {
    const path = queue.shift();

    try {
      const items = await getContents(owner, repo, path);
      const list = Array.isArray(items) ? items : [items];

      for (const item of list) {
        if (files.length >= MAX_FILES) break;

        if (item.type === "dir") {
          queue.push(item.path);
        } else if (
          item.type === "file" &&
          CODE_EXTS.some((e) => item.name.endsWith(e)) &&
          item.size < 30000
        ) {
          try {
            const raw = await api.get(item.download_url);
            files.push({
              name: item.path,
              content: String(raw.data).slice(0, 2000),
            });
          } catch (err) {
            console.warn("File fetch failed:", item.path);
          }
        }
      }
    } catch (err) {
      console.warn("Path skipped:", path);
    }
  }

  return files;
}

export function parseRepoName(repoUrl) {
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/\s]+)/);
  return match ? match[1].replace(/\.git$/, "") : repoUrl;
}
