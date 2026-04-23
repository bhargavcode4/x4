export const metadata = {
  title: "X-Plane AI — Explain any project, any code, any language",
  description: "AI-powered GitHub repository explainer using RAG. Get instant summaries, beginner guides, advanced analysis and interview Q&As for any codebase.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
