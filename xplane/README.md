# X-Plane AI
### *the AI to explain any project, any code, any language.*

AI-powered GitHub repository explainer using RAG (Retrieval-Augmented Generation).

---

## Stack
- **Frontend**: Next.js 14 App Router, React
- **Database**: Turso (LibSQL / SQLite — free tier)
- **AI**: OpenAI `text-embedding-3-small` + `gpt-4o-mini`
- **Auth**: JWT + bcrypt + Twilio OTP
- **Deploy**: Vercel

---

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

---

## Deploy to Vercel (Step by Step)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "X-Plane AI initial commit"
git remote add origin https://github.com/YOUR_USERNAME/xplane-ai.git
git push -u origin main
```

### 2. Connect to Vercel
1. Go to https://vercel.com
2. Click **Add New Project**
3. Import your GitHub repo `xplane-ai`
4. Framework: **Next.js** (auto-detected)

### 3. Add Environment Variables in Vercel Dashboard
Go to Project → Settings → Environment Variables and add:

| Variable | Value |
|---|---|
| `OPENAI_API_KEY` | Your new OpenAI key |
| `GITHUB_TOKEN` | Your new GitHub token |
| `TWILIO_ACCOUNT_SID` | From console.twilio.com |
| `TWILIO_AUTH_TOKEN` | From console.twilio.com |
| `TWILIO_PHONE_NUMBER` | Your Twilio number e.g. +15551234567 |
| `TURSO_DATABASE_URL` | libsql://tursodatabase-bhargavthota.aws-ap-south-1.turso.io |
| `TURSO_AUTH_TOKEN` | Your new Turso token |
| `JWT_SECRET` | Any long random string |

### 4. Deploy
Click **Deploy**. Vercel builds and deploys automatically.
Every `git push` to main will auto-redeploy.

---

## Architecture

```
User → Next.js (Vercel)
         ├── /api/auth/signup     → bcrypt hash → Turso users table
         ├── /api/auth/login      → bcrypt verify → JWT cookie
         ├── /api/auth/send-otp   → Twilio SMS → Turso otp_codes table
         ├── /api/auth/verify-otp → check code → JWT cookie
         ├── /api/analyze         → GitHub API → chunk → OpenAI embed → Turso chunks table
         ├── /api/chat            → embed query → cosine similarity → GPT-4o-mini stream
         └── /api/history         → Turso repos table CRUD
```

## Database Schema (Turso SQLite)

- `users` — id, name, email, password (bcrypt), phone
- `otp_codes` — phone, code, expires_at, used
- `repos` — user_id, repo_url, repo_name, analysed_at
- `chunks` — repo_id, file_name, chunk_text, embedding (JSON)
- `cached_answers` — repo_id, question, answer

Tables are auto-created on first request via `initDb()`.

---

## Features
- ✅ Login / Signup with email + password
- ✅ OTP via Twilio SMS
- ✅ Real RAG: embed → store → cosine retrieval
- ✅ 4 analysis modes: Summary, Beginner, Advanced, Interview Q&A
- ✅ Streaming responses (typewriter effect)
- ✅ Download as .txt document
- ✅ FAQ generation + download
- ✅ Per-user history saved in Turso
- ✅ Response caching (same question = instant answer)
- ✅ Mouse-reactive dot background on every page
