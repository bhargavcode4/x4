"use client";
import { useState, useRef, useEffect, useCallback } from "react";

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  bg: "linear-gradient(145deg,#e8f7f7,#f0fafa 40%,#e4f4f7)",
  card: "rgba(255,255,255,0.82)",
  border: "rgba(13,148,136,0.18)",
  borderMed: "rgba(13,148,136,0.35)",
  teal: "#0d9488", cyan: "#06b6d4",
  grad: "linear-gradient(135deg,#0d9488,#06b6d4)",
  text: "#0f3d40", textMid: "#2d7a82", textMuted: "#6b9ea4",
  shadow: "rgba(13,148,136,0.12)",
  green: "#10b981", red: "#ef4444", amber: "#f59e0b",
};

// ── Dot canvas background ──────────────────────────────────────────────────
function DotBg() {
  const ref = useRef(null);
  const mouse = useRef({ x: -999, y: -999 });
  const dots = useRef([]);
  const raf = useRef(null);

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const S = 30, R = 1.6, INF = 130, PX = 22;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = Math.max(window.innerHeight, document.body.scrollHeight);
      dots.current = [];
      for (let r = 0; r <= Math.ceil(canvas.height / S) + 2; r++)
        for (let c = 0; c <= Math.ceil(canvas.width / S) + 2; c++)
          dots.current.push({ ox: c * S, oy: r * S, x: c * S, y: r * S });
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { x: mx, y: my } = mouse.current;
      for (const d of dots.current) {
        const dx = d.ox - mx, dy = d.oy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < INF && dist > 0) {
          const f = 1 - dist / INF;
          d.x += (d.ox + (dx / dist) * f * PX - d.x) * 0.22;
          d.y += (d.oy + (dy / dist) * f * PX - d.y) * 0.22;
        } else {
          d.x += (d.ox - d.x) * 0.09;
          d.y += (d.oy - d.y) * 0.09;
        }
        const p = Math.max(0, 1 - dist / INF);
        ctx.beginPath();
        ctx.arc(d.x, d.y, R + p * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(13,148,136,${0.10 + p * 0.42})`;
        ctx.fill();
      }
      raf.current = requestAnimationFrame(draw);
    };

    const onMove = (e) => { mouse.current = { x: e.clientX + window.scrollX, y: e.clientY + window.scrollY }; };
    const onResize = () => init();
    init(); draw();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf.current); window.removeEventListener("mousemove", onMove); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={ref} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

// ── Small reusable pieces ──────────────────────────────────────────────────
const Spin = ({ s = 14 }) => (
  <span style={{ display: "inline-block", width: s, height: s, border: `2px solid rgba(13,148,136,0.2)`, borderTop: `2px solid #0d9488`, borderRadius: "50%", animation: "xspin .7s linear infinite", flexShrink: 0 }} />
);

const GradTxt = ({ children, style = {} }) => (
  <span style={{ background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", ...style }}>{children}</span>
);

const Card = ({ children, style = {} }) => (
  <div style={{ background: T.card, backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderRadius: 16, border: `1px solid ${T.border}`, boxShadow: `0 4px 28px ${T.shadow}`, ...style }}>
    {children}
  </div>
);

const TBtn = ({ children, onClick, disabled, style = {} }) => (
  <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: disabled ? "rgba(13,148,136,0.25)" : T.grad, color: "#fff", border: "none", borderRadius: 10, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 13, padding: "11px 20px", transition: "all .22s", boxShadow: disabled ? "none" : `0 4px 16px rgba(13,148,136,0.28)`, ...style }}>
    {children}
  </button>
);

const GBtn = ({ children, onClick, style = {} }) => (
  <button onClick={onClick} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, background: "rgba(255,255,255,0.78)", color: T.textMid, border: `1px solid ${T.border}`, borderRadius: 10, cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 600, fontSize: 13, padding: "11px 20px", transition: "all .22s", ...style }}>
    {children}
  </button>
);

const InputField = ({ label, ...props }) => (
  <div style={{ marginBottom: 13 }}>
    {label && <label style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, display: "block", marginBottom: 4 }}>{label}</label>}
    <input {...props} style={{ width: "100%", background: "rgba(255,255,255,0.75)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 13, color: T.text, outline: "none", fontFamily: "'Nunito',sans-serif", transition: "border-color .2s", ...props.style }} onFocus={e => e.target.style.borderColor = T.teal} onBlur={e => e.target.style.borderColor = T.border} />
  </div>
);

const MsgBox = ({ msg, ok }) => msg ? (
  <div style={{ padding: "9px 13px", borderRadius: 9, fontSize: 12, marginBottom: 12, background: ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${ok ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`, color: ok ? "#059669" : T.red }}>
    {msg}
  </div>
) : null;

const Nav = ({ user, historyCount, onHistory, onLogout }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 24px", background: "rgba(255,255,255,0.76)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${T.border}`, boxShadow: `0 1px 14px ${T.shadow}`, position: "sticky", top: 0, zIndex: 10 }}>
    <div>
      <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        X-Plane <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>AI</span>
      </div>
      <div style={{ fontSize: 10, color: T.textMuted, fontStyle: "italic", fontFamily: "'Cormorant Garamond',serif" }}>the AI to explain any project, any code, any language.</div>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      {historyCount > 0 && (
        <button onClick={onHistory} style={{ padding: "6px 12px", background: "rgba(13,148,136,0.09)", border: `1px solid rgba(13,148,136,0.2)`, borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, color: T.teal, fontFamily: "'Nunito',sans-serif" }}>
          History ({historyCount})
        </button>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 11px", background: "rgba(255,255,255,0.75)", border: `1px solid ${T.border}`, borderRadius: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.textMid }}>{user?.name?.split(" ")[0]}</span>
      </div>
      <GBtn onClick={onLogout} style={{ padding: "6px 12px", fontSize: 12 }}>Sign Out</GBtn>
    </div>
  </div>
);

// ── Streaming helper ───────────────────────────────────────────────────────
async function streamFetch(url, body, token, onChunk, onDone) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    full += dec.decode(value);
    onChunk(full);
  }
  onDone(full);
}

// ── CSS ────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;1,400;1,600&family=DM+Serif+Display&family=Nunito:wght@400;600;700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
@keyframes xspin{to{transform:rotate(360deg);}}
@keyframes xfadeUp{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);}}
@keyframes xpop{0%{opacity:0;transform:scale(.95);}100%{opacity:1;transform:scale(1);}}
@keyframes xblink{50%{opacity:0;}}
body{background:#edf8f6;font-family:'Nunito',sans-serif;}
.xau .teal-tab-on{background:linear-gradient(135deg,rgba(13,148,136,.14),rgba(6,182,212,.10))!important;color:#0d9488!important;border-color:rgba(13,148,136,0.4)!important;}
.prose{font-family:monospace;font-size:13px;line-height:1.82;color:#2d7a82;white-space:pre-wrap;word-break:break-word;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:rgba(13,148,136,0.22);border-radius:4px;}
`;

// ═══════════════════════════════════════════════════════════════════════════
export default function XPlane() {
  // ── page: login | otp | home | loading | choice | results | faq | history
  const [page, setPage] = useState("login");
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Auth
  const [authMode, setAuthMode] = useState("login");
  const [authFields, setAuthFields] = useState({ name: "", email: "", password: "", phone: "" });
  const [authMsg, setAuthMsg] = useState(null);
  const [authOk, setAuthOk] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // OTP
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [otpPhone, setOtpPhone] = useState("");
  const [otpMsg, setOtpMsg] = useState(null);
  const [otpOk, setOtpOk] = useState(false);
  const [otpDevCode, setOtpDevCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const otpRefs = useRef([]);

  // Repo / analysis
  const [repoUrl, setRepoUrl] = useState("");
  const [repoId, setRepoId] = useState(null);
  const [repoName, setRepoName] = useState("");
  const [loadMsg, setLoadMsg] = useState("");
  const [loadP, setLoadP] = useState(0);
  const [displayChoice, setDisplayChoice] = useState(null);

  // Results
  const [activeSection, setActiveSection] = useState("summary");
  const [sections, setSections] = useState({ summary: "", beginner: "", advanced: "", interview: "" });
  const [sectionLoading, setSectionLoading] = useState({});
  const [faqText, setFaqText] = useState("");
  const [faqLoading, setFaqLoading] = useState(false);

  // History
  const [history, setHistory] = useState([]);

  const af = (k) => (v) => setAuthFields((p) => ({ ...p, [k]: v }));
  const rName = repoUrl.replace(/https?:\/\/github\.com\//, "").replace(/\/+$/, "") || "repository";

  // ── Load history from API ────────────────────────────────────────────────
  const loadHistory = useCallback(async (tok) => {
    try {
      const res = await fetch("/api/history", { headers: { Authorization: `Bearer ${tok}` } });
      const data = await res.json();
      if (data.history) setHistory(data.history);
    } catch {}
  }, []);

  // ── Auth: login ──────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setAuthMsg(null); setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authFields.email, password: authFields.password }),
      });
      const data = await res.json();
      if (!res.ok) { setAuthMsg(data.error); setAuthOk(false); setAuthLoading(false); return; }
      setUser({ name: data.name, email: data.email });
      setToken(data.token || "cookie");
      await loadHistory(data.token || "cookie");
      setPage("home");
    } catch { setAuthMsg("Network error"); setAuthOk(false); }
    setAuthLoading(false);
  };

  // ── Auth: signup ─────────────────────────────────────────────────────────
  const handleSignup = async () => {
    setAuthMsg(null); setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authFields),
      });
      const data = await res.json();
      if (!res.ok) { setAuthMsg(data.error); setAuthOk(false); setAuthLoading(false); return; }
      setUser({ name: data.name, email: data.email });
      setPage("home");
    } catch { setAuthMsg("Network error"); setAuthOk(false); }
    setAuthLoading(false);
  };

  // ── OTP: send ────────────────────────────────────────────────────────────
  const sendOtp = async () => {
    const phone = authFields.phone;
    if (!phone) { setAuthMsg("Enter your phone number first"); setAuthOk(false); return; }
    setOtpPhone(phone); setOtpMsg(null); setOtpLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpMsg(data.error); setOtpOk(false); setOtpLoading(false); return; }
      if (data.code) setOtpDevCode(data.code); // dev mode
      setOtpDigits(["", "", "", "", "", ""]);
      setPage("otp");
    } catch { setOtpMsg("Network error"); setOtpOk(false); }
    setOtpLoading(false);
  };

  // ── OTP: verify ──────────────────────────────────────────────────────────
  const verifyOtp = async () => {
    const code = otpDigits.join("");
    if (code.length !== 6) { setOtpMsg("Enter all 6 digits"); setOtpOk(false); return; }
    setOtpLoading(true); setOtpMsg(null);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: otpPhone, code }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpMsg(data.error); setOtpOk(false); setOtpLoading(false); return; }
      setUser({ name: data.name, email: data.email });
      await loadHistory("cookie");
      setPage("home");
    } catch { setOtpMsg("Network error"); setOtpOk(false); }
    setOtpLoading(false);
  };

  const otpKey = (i, e) => {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };
  const otpChange = (i, v) => {
    const d = [...otpDigits]; d[i] = v.slice(-1); setOtpDigits(d);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
  };

  // ── Analyse repo ─────────────────────────────────────────────────────────
  const startAnalyse = async () => {
    if (!repoUrl.trim()) return;
    setPage("loading"); setLoadP(0);
    const msgs = ["Connecting to GitHub…", "Fetching file tree…", "Reading source files…", "Chunking (500–800 tokens)…", "Generating embeddings…", "Storing in Turso DB…", "Finalising RAG index…"];

    // Animate the first 6 steps while the real API call runs in parallel
    let step = 0;
    const iv = setInterval(() => {
      if (step < msgs.length) { setLoadMsg(msgs[step]); setLoadP(Math.round(((step + 1) / (msgs.length + 1)) * 100)); step++; }
    }, 700);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });
      const data = await res.json();
      clearInterval(iv);
      if (!res.ok) { setPage("home"); alert("Error: " + data.error); return; }
      setRepoId(data.repoId);
      setRepoName(rName);
      setLoadMsg("All set!"); setLoadP(100);
      await new Promise(r => setTimeout(r, 400));
      setDisplayChoice(null);
      setSections({ summary: "", beginner: "", advanced: "", interview: "" });
      setFaqText("");
      setPage("choice");
      await loadHistory(token || "cookie");
    } catch (e) {
      clearInterval(iv);
      setPage("home");
      alert("Error: " + e.message);
    }
  };

  // ── Generate a section ───────────────────────────────────────────────────
  const generateSection = async (mode) => {
    setSectionLoading(p => ({ ...p, [mode]: true }));
    setSections(p => ({ ...p, [mode]: "" }));
    const questions = {
      summary: "Give a comprehensive project summary: what it does, tech stack, architecture, and key components.",
      beginner: "Explain this project to a complete beginner using simple analogies and plain English.",
      advanced: "Provide a deep technical analysis: architectural patterns, performance, security, and scalability.",
      interview: "Generate 8 high-quality technical interview Q&As about this codebase.",
    };
    try {
      await streamFetch("/api/chat", { repoId, question: questions[mode], mode }, token,
        (t) => setSections(p => ({ ...p, [mode]: t })),
        () => setSectionLoading(p => ({ ...p, [mode]: false }))
      );
    } catch (e) {
      setSections(p => ({ ...p, [mode]: "Error: " + e.message }));
      setSectionLoading(p => ({ ...p, [mode]: false }));
    }
  };

  const switchSection = (mode) => {
    setActiveSection(mode);
    if (!sections[mode]) generateSection(mode);
  };

  const confirmChoice = () => {
    if (!displayChoice) return;
    setPage("results");
    setActiveSection("summary");
    generateSection("summary");
    if (displayChoice === "download") {
      // Will trigger download once all sections are ready
      setTimeout(() => generateAllAndDownload(), 200);
    }
  };

  const generateAllAndDownload = async () => {
    const modes = ["summary", "beginner", "advanced", "interview"];
    const results = {};
    for (const mode of modes) {
      await new Promise((res) => {
        streamFetch("/api/chat", { repoId, question: `Generate the ${mode} analysis.`, mode }, token,
          (t) => { results[mode] = t; setSections(p => ({ ...p, [mode]: t })); },
          () => res()
        );
      });
    }
    const doc = buildDoc(repoUrl, rName, results);
    downloadTxt(`${rName.replace("/", "_")}_analysis.txt`, doc);
  };

  const generateFaq = async () => {
    setFaqLoading(true); setFaqText("");
    try {
      await streamFetch("/api/chat",
        { repoId, question: "Generate 10 comprehensive FAQ entries for this project.", mode: "faq" },
        token,
        setFaqText,
        () => setFaqLoading(false)
      );
    } catch (e) { setFaqText("Error: " + e.message); setFaqLoading(false); }
  };

  // ── History delete ───────────────────────────────────────────────────────
  const deleteHistory = async (id) => {
    await fetch(`/api/history?repoId=${id}`, { method: "DELETE" });
    setHistory(p => p.filter(h => h.id !== id));
  };

  // ── Download helpers ─────────────────────────────────────────────────────
  const buildDoc = (url, name, data, faq = "") => `
╔══════════════════════════════════════════════════════════════╗
  X-PLANE AI — ANALYSIS REPORT
  Generated: ${new Date().toLocaleString()}
╚══════════════════════════════════════════════════════════════╝

Repository: ${url}
Project:    ${name}

${"═".repeat(62)}

1. SUMMARY
${"─".repeat(62)}
${data.summary || ""}

${"═".repeat(62)}

2. BEGINNER EXPLANATION
${"─".repeat(62)}
${data.beginner || ""}

${"═".repeat(62)}

3. ADVANCED TECHNICAL ANALYSIS
${"─".repeat(62)}
${data.advanced || ""}

${"═".repeat(62)}

4. INTERVIEW Q&A
${"─".repeat(62)}
${data.interview || ""}

${faq ? `\n${"═".repeat(62)}\n\n5. FREQUENTLY ASKED QUESTIONS\n${"─".repeat(62)}\n${faq}` : ""}

${"═".repeat(62)}
  X-Plane AI • ${new Date().getFullYear()} • the AI to explain any project, any code, any language.
${"═".repeat(62)}
`;

  const downloadTxt = (name, content) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    a.download = name; a.click();
  };

  const logout = () => { setUser(null); setToken(null); setHistory([]); setSections({ summary: "", beginner: "", advanced: "", interview: "" }); setFaqText(""); setPage("login"); };

  // ── Input style ───────────────────────────────────────────────────────────
  const inp = { width: "100%", background: "rgba(255,255,255,0.75)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "11px 14px", fontSize: 13, color: T.text, outline: "none", fontFamily: "'Nunito',sans-serif", transition: "border-color .2s" };

  const tabSections = [
    { id: "summary", label: "Summary" },
    { id: "beginner", label: "Beginner" },
    { id: "advanced", label: "Advanced" },
    { id: "interview", label: "Interview Q&A" },
  ];

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="xau" style={{ minHeight: "100vh", background: T.bg, position: "relative" }}>
      <style>{CSS}</style>
      <DotBg />
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ══ LOGIN PAGE ══════════════════════════════════════════════════ */}
        {page === "login" && (
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 16px", animation: "xfadeUp .5s ease" }}>
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(34px,6vw,56px)", lineHeight: 1.1, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textShadow: "0 3px 20px rgba(13,148,136,.12)" }}>X-Plane</div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(13px,2.2vw,17px)", color: T.textMid, fontWeight: 600, marginBottom: 6 }}>the AI to explain any project, any code, any language.</div>
              <p style={{ fontSize: 12, color: T.textMuted }}>Sign in to save your analyses &amp; history</p>
            </div>

            <Card style={{ width: "100%", maxWidth: 380, padding: "26px 26px 22px", animation: "xpop .4s ease" }}>
              {/* Toggle */}
              <div style={{ display: "flex", background: "rgba(13,148,136,0.07)", borderRadius: 9, padding: 3, marginBottom: 18 }}>
                {["login", "signup"].map(m => (
                  <button key={m} onClick={() => { setAuthMode(m); setAuthMsg(null); }} style={{ flex: 1, padding: "7px", borderRadius: 7, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "'Nunito',sans-serif", background: authMode === m ? T.grad : "transparent", color: authMode === m ? "#fff" : T.textMuted, transition: "all .2s" }}>
                    {m === "login" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>

              {authMode === "signup" && (
                <InputField label="Full Name" placeholder="Your full name" value={authFields.name} onChange={e => af("name")(e.target.value)} />
              )}
              <InputField label="Email" type="email" placeholder="you@example.com" value={authFields.email} onChange={e => af("email")(e.target.value)} />
              <InputField label="Phone (for OTP verification)" placeholder="+91 9876543210" value={authFields.phone} onChange={e => af("phone")(e.target.value)} />
              <InputField label="Password" type="password" placeholder="••••••••" value={authFields.password} onChange={e => af("password")(e.target.value)} onKeyDown={e => e.key === "Enter" && (authMode === "login" ? handleLogin() : handleSignup())} />

              <MsgBox msg={authMsg} ok={authOk} />

              <TBtn onClick={authMode === "login" ? handleLogin : handleSignup} disabled={authLoading} style={{ width: "100%", padding: "12px", marginBottom: 10 }}>
                {authLoading ? <Spin s={14} /> : (authMode === "login" ? "Sign In →" : "Create Account →")}
              </TBtn>

              <GBtn onClick={sendOtp} style={{ width: "100%", padding: "10px", fontSize: 12 }}>
                {otpLoading ? <Spin s={13} /> : "Send OTP to Phone Instead"}
              </GBtn>

              <p style={{ fontSize: 11, color: T.textMuted, textAlign: "center", marginTop: 12 }}>
                Demo: <span style={{ fontFamily: "monospace", color: T.textMid }}>any email / any password after signup</span>
              </p>
            </Card>
          </div>
        )}

        {/* ══ OTP PAGE ════════════════════════════════════════════════════ */}
        {page === "otp" && (
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "30px 16px" }}>
            <Card style={{ width: "100%", maxWidth: 340, padding: "28px 24px", textAlign: "center", animation: "xpop .4s ease" }}>
              <div style={{ width: 50, height: 50, borderRadius: 13, background: "linear-gradient(135deg,rgba(13,148,136,.14),rgba(6,182,212,.11))", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.57 3.5 2 2 0 0 1 3.54 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l.86-.86a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16z" /></svg>
              </div>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 5 }}>Verify Your Phone</div>
              <p style={{ fontSize: 13, color: T.textMuted, marginBottom: 4 }}>6-digit code sent to</p>
              <p style={{ fontFamily: "monospace", fontWeight: 700, color: T.textMid, marginBottom: 18, fontSize: 13 }}>{otpPhone}</p>

              {/* 6 digit inputs */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 14 }}>
                {otpDigits.map((d, i) => (
                  <input key={i} ref={el => otpRefs.current[i] = el} maxLength={1} value={d}
                    onChange={e => otpChange(i, e.target.value)}
                    onKeyDown={e => otpKey(i, e)}
                    style={{ width: 44, height: 50, textAlign: "center", fontSize: 22, fontWeight: 700, background: "rgba(255,255,255,0.8)", border: `1px solid ${T.border}`, borderRadius: 10, outline: "none", fontFamily: "'Nunito',sans-serif", color: T.text }} />
                ))}
              </div>

              <MsgBox msg={otpMsg} ok={otpOk} />
              {otpDevCode && <p style={{ fontSize: 11, color: T.teal, marginBottom: 10, fontFamily: "monospace" }}>Dev OTP: <strong>{otpDevCode}</strong></p>}

              <TBtn onClick={verifyOtp} disabled={otpLoading} style={{ width: "100%", padding: "12px", marginBottom: 9 }}>
                {otpLoading ? <Spin /> : "Verify & Sign In →"}
              </TBtn>
              <GBtn onClick={sendOtp} style={{ width: "100%", padding: "9px", fontSize: 12, marginBottom: 9 }}>Resend OTP</GBtn>
              <button onClick={() => setPage("login")} style={{ background: "none", border: "none", fontSize: 12, color: T.textMuted, cursor: "pointer", fontFamily: "'Nunito',sans-serif" }}>← Back to sign in</button>
            </Card>
          </div>
        )}

        {/* ══ HOME PAGE ════════════════════════════════════════════════════ */}
        {page === "home" && (
          <>
            <Nav user={user} historyCount={history.length} onHistory={() => setPage("history")} onLogout={logout} />
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px 50px", animation: "xfadeUp .4s ease" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 16px", background: "rgba(255,255,255,0.65)", border: `1px solid rgba(13,148,136,0.22)`, borderRadius: 99, marginBottom: 18 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.teal, boxShadow: `0 0 6px ${T.teal}` }} />
                <GradTxt style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".08em" }}>RAG · GPT-4o-MINI · TURSO SQL</GradTxt>
              </div>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(38px,6vw,64px)", lineHeight: 1.05, letterSpacing: "-.5px", background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", textShadow: "0 3px 20px rgba(13,148,136,.15)", marginBottom: 4 }}>X-Plane</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(15px,2.5vw,22px)", fontWeight: 600, color: T.textMid, marginBottom: 12 }}>the AI to explain any project, any code, any language.</div>
                <p style={{ fontSize: 14, color: T.textMuted, maxWidth: 420, margin: "0 auto", lineHeight: 1.65 }}>Paste any GitHub URL — get AI-powered analysis, view on screen or download as a document.</p>
              </div>

              <Card style={{ width: "100%", maxWidth: 560, padding: "22px 22px 18px" }}>
                <div style={{ display: "flex", gap: 9, marginBottom: 12 }}>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,0.75)", border: `1px solid ${T.border}`, borderRadius: 10, padding: "0 13px" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
                    <input value={repoUrl} onChange={e => setRepoUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && startAnalyse()} placeholder="https://github.com/owner/repository" style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: 13, color: T.text, padding: "12px 0", fontFamily: "monospace" }} />
                  </div>
                  <TBtn onClick={startAnalyse} style={{ padding: "0 20px", whiteSpace: "nowrap" }}>Analyse →</TBtn>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["expressjs/express", "vercel/next.js", "django/django"].map(r => (
                    <button key={r} onClick={() => setRepoUrl("https://github.com/" + r)} style={{ padding: "3px 10px", background: "rgba(13,148,136,0.06)", border: `1px solid rgba(13,148,136,0.18)`, borderRadius: 5, cursor: "pointer", fontSize: 10, color: T.textMuted, fontFamily: "monospace", transition: "all .18s" }} onMouseOver={e => e.target.style.color = T.teal} onMouseOut={e => e.target.style.color = T.textMuted}>{r}</button>
                  ))}
                </div>
              </Card>

              {history.length > 0 && (
                <div style={{ width: "100%", maxWidth: 560, marginTop: 22 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: ".07em", marginBottom: 9 }}>RECENT ANALYSES</p>
                  {history.slice(0, 3).map(h => (
                    <div key={h.id} onClick={() => { setRepoUrl(h.url); setRepoId(h.id); setRepoName(h.name); setSections({ summary: "", beginner: "", advanced: "", interview: "" }); setPage("results"); setActiveSection("summary"); setTimeout(() => generateSection("summary"), 100); }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", background: "rgba(255,255,255,0.75)", border: `1px solid ${T.border}`, borderRadius: 10, marginBottom: 8, cursor: "pointer", transition: "all .18s" }}
                      onMouseOver={e => e.currentTarget.style.borderColor = T.teal}
                      onMouseOut={e => e.currentTarget.style.borderColor = T.border}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.textMid }}>{h.name}</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{h.date}</div>
                      </div>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ LOADING PAGE ════════════════════════════════════════════════ */}
        {page === "loading" && (
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
            <Card style={{ width: "100%", maxWidth: 400, padding: "38px 34px", textAlign: "center", animation: "xpop .4s ease" }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: "linear-gradient(135deg,rgba(13,148,136,.14),rgba(6,182,212,.11))", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <Spin s={24} />
              </div>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>Processing Repository</div>
              <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 26, fontFamily: "monospace", minHeight: 18 }}>{loadMsg}</p>
              <div style={{ background: "rgba(13,148,136,0.09)", borderRadius: 99, height: 5, overflow: "hidden", marginBottom: 8 }}>
                <div style={{ height: "100%", width: `${loadP}%`, background: T.grad, borderRadius: 99, transition: "width .4s ease", boxShadow: `0 0 10px rgba(13,148,136,0.4)` }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.textMuted, fontFamily: "monospace" }}>
                <span>Building RAG index</span><span>{loadP}%</span>
              </div>
            </Card>
          </div>
        )}

        {/* ══ CHOICE PAGE ═════════════════════════════════════════════════ */}
        {page === "choice" && (
          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", animation: "xfadeUp .4s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: "rgba(255,255,255,0.76)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${T.border}` }}>
              <GBtn onClick={() => setPage("home")} style={{ padding: "6px 12px", fontSize: 12 }}>← Back</GBtn>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 16, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Choose Output</div>
              <div style={{ width: 70 }} />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "30px 16px" }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 13px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 99, marginBottom: 14 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={T.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.green }}>Repository indexed successfully</span>
                </div>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: "clamp(24px,4vw,38px)", background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>How would you like</div>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "clamp(20px,3vw,30px)", fontWeight: 600, color: T.textMid, marginBottom: 6 }}>your analysis?</div>
                <p style={{ fontSize: 12, color: T.textMuted, fontFamily: "monospace" }}>{rName}</p>
              </div>

              <div style={{ display: "flex", gap: 16, maxWidth: 600, width: "100%", flexWrap: "wrap", justifyContent: "center", marginBottom: 24 }}>
                {[
                  { id: "screen", icon: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z", title: "Display on Screen", desc: "View analysis in your browser. Pick any section — Summary, Beginner, Advanced, or Interview Q&A." },
                  { id: "download", icon: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3", title: "Download Document", desc: "Generate a complete .txt analysis file and download it for offline reading or sharing." },
                ].map(opt => (
                  <div key={opt.id} onClick={() => setDisplayChoice(opt.id)} style={{ flex: 1, minWidth: 220, background: "rgba(255,255,255,0.84)", backdropFilter: "blur(14px)", borderRadius: 16, padding: "26px 22px", textAlign: "center", cursor: "pointer", border: `2px solid ${displayChoice === opt.id ? T.teal : "rgba(13,148,136,0.12)"}`, transition: "all .25s", boxShadow: displayChoice === opt.id ? `0 8px 32px rgba(13,148,136,0.24)` : `0 4px 20px ${T.shadow}`, transform: displayChoice === opt.id ? "translateY(-2px)" : "none", position: "relative" }}>
                    {displayChoice === opt.id && (
                      <div style={{ position: "absolute", top: 10, right: 12, width: 20, height: 20, borderRadius: "50%", background: T.grad, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                      </div>
                    )}
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,rgba(13,148,136,.12),rgba(6,182,212,.09))", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={opt.icon} /></svg>
                    </div>
                    <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 18, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>{opt.title}</div>
                    <p style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.55 }}>{opt.desc}</p>
                  </div>
                ))}
              </div>

              <TBtn onClick={confirmChoice} disabled={!displayChoice} style={{ padding: "12px 36px" }}>
                {displayChoice === "download" ? "Generate & Download →" : displayChoice ? "View Analysis →" : "Select an option above"}
              </TBtn>
            </div>
          </div>
        )}

        {/* ══ RESULTS PAGE ════════════════════════════════════════════════ */}
        {page === "results" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: "rgba(255,255,255,0.76)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${T.border}`, boxShadow: `0 1px 14px ${T.shadow}`, position: "sticky", top: 0, zIndex: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <GBtn onClick={() => setPage("home")} style={{ padding: "5px 11px", fontSize: 12 }}>⌂ Home</GBtn>
                <div>
                  <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 16, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Analysis <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>Results</span></div>
                  <div style={{ fontSize: 10, color: T.textMuted, fontFamily: "monospace" }}>{repoName || rName}</div>
                </div>
              </div>
              <TBtn onClick={() => { const doc = buildDoc(repoUrl, rName, sections); downloadTxt(`${rName.replace("/", "_")}_analysis.txt`, doc); }} style={{ padding: "7px 14px", fontSize: 12 }}>↓ Download</TBtn>
            </div>

            {/* Section tabs */}
            <div style={{ background: "rgba(255,255,255,0.55)", borderBottom: `1px solid ${T.border}`, display: "flex", overflowX: "auto" }}>
              {tabSections.map(s => (
                <button key={s.id} onClick={() => switchSection(s.id)} style={{ padding: "11px 18px", background: "transparent", border: "none", borderBottom: `2px solid ${activeSection === s.id ? T.teal : "transparent"}`, fontSize: 12, fontWeight: 700, color: activeSection === s.id ? T.teal : T.textMuted, cursor: "pointer", fontFamily: "'Nunito',sans-serif", transition: "all .2s", whiteSpace: "nowrap" }}>
                  {s.label}
                </button>
              ))}
            </div>

            <div style={{ maxWidth: 860, margin: "0 auto", padding: "26px 20px 60px" }}>
              {tabSections.map(s => s.id === activeSection && (
                <div key={s.id} style={{ animation: "xfadeUp .3s ease" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 26, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.label}</div>
                    {sectionLoading[s.id] && <Spin />}
                  </div>
                  <Card style={{ padding: "24px 28px", minHeight: 240 }}>
                    {sections[s.id]
                      ? <div className="prose">{sections[s.id]}</div>
                      : sectionLoading[s.id]
                        ? <div><GradTxt style={{ fontFamily: "monospace", fontSize: 13 }}>Generating {s.label.toLowerCase()}…<span style={{ animation: "xblink 1s step-end infinite" }}>▋</span></GradTxt></div>
                        : <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 15, color: T.textMuted }}>Click to generate this section.</p>}
                  </Card>
                </div>
              ))}

              {/* FAQ CTA */}
              {!Object.values(sectionLoading).some(Boolean) && sections.summary && (
                <Card style={{ marginTop: 40, padding: "28px 26px", textAlign: "center", border: `1px solid rgba(13,148,136,0.25)`, animation: "xfadeUp .4s ease" }}>
                  <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 8 }}>Want the FAQ Document?</div>
                  <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 15, color: T.textMuted, maxWidth: 400, margin: "0 auto 20px", lineHeight: 1.65 }}>Generate 10 frequently asked questions &amp; detailed answers about this project as a downloadable file.</p>
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <TBtn onClick={() => { setPage("faq"); generateFaq(); }}>Yes, Generate FAQ</TBtn>
                    <GBtn onClick={() => setPage("home")}>No, Return Home</GBtn>
                  </div>
                </Card>
              )}
            </div>
          </>
        )}

        {/* ══ FAQ PAGE ════════════════════════════════════════════════════ */}
        {page === "faq" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: "rgba(255,255,255,0.76)", backdropFilter: "blur(14px)", borderBottom: `1px solid ${T.border}`, boxShadow: `0 1px 14px ${T.shadow}`, position: "sticky", top: 0, zIndex: 10 }}>
              <GBtn onClick={() => setPage("home")} style={{ padding: "5px 11px", fontSize: 12 }}>⌂ Home</GBtn>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 16, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Frequently Asked <span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic" }}>Questions</span>
              </div>
              {!faqLoading && faqText && (
                <TBtn onClick={() => downloadTxt(`${rName.replace("/", "_")}_faq.txt`, faqText)} style={{ padding: "7px 14px", fontSize: 12 }}>↓ FAQ</TBtn>
              )}
              {(faqLoading || !faqText) && <div style={{ width: 80 }} />}
            </div>
            <div style={{ maxWidth: 860, margin: "0 auto", padding: "26px 20px 60px" }}>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 6 }}>Project FAQ</div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 14, color: T.textMuted, marginBottom: 20 }}>{repoName || rName}</p>
              <Card style={{ padding: "24px 28px", minHeight: 240 }}>
                {faqText
                  ? <div className="prose">{faqText}</div>
                  : <GradTxt style={{ fontFamily: "monospace", fontSize: 13 }}>Generating FAQ…<span style={{ animation: "xblink 1s step-end infinite" }}>▋</span></GradTxt>}
              </Card>
              {!faqLoading && faqText && (
                <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
                  <TBtn onClick={() => downloadTxt(`${rName.replace("/", "_")}_faq.txt`, faqText)}>↓ Download FAQ</TBtn>
                  <TBtn onClick={() => { const doc = buildDoc(repoUrl, rName, sections, faqText); downloadTxt(`${rName.replace("/", "_")}_full_report.txt`, doc); }} style={{ background: "linear-gradient(135deg,#0f766e,#0e7490)" }}>↓ Full Report + FAQ</TBtn>
                  <GBtn onClick={() => setPage("home")}>Return Home</GBtn>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ HISTORY PAGE ════════════════════════════════════════════════ */}
        {page === "history" && (
          <>
            <Nav user={user} historyCount={history.length} onHistory={() => {}} onLogout={logout} />
            <div style={{ maxWidth: 720, margin: "0 auto", padding: "26px 20px 60px" }}>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 28, background: T.grad, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4, animation: "xfadeUp .3s ease" }}>Saved Analyses</div>
              <p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 15, color: T.textMuted, marginBottom: 22 }}>{history.length} repositor{history.length === 1 ? "y" : "ies"} analysed</p>

              {history.length === 0
                ? <Card style={{ padding: "40px 24px", textAlign: "center" }}><p style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: 15, color: T.textMuted }}>No analyses yet — go analyse a repo!</p></Card>
                : history.map((h, i) => (
                  <Card key={h.id} style={{ padding: "14px 18px", marginBottom: 10, animation: `xfadeUp ${.3 + i * .07}s ease` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,rgba(13,148,136,.12),rgba(6,182,212,.09))", border: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" /></svg>
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.textMid }}>{h.name}</div>
                        <div style={{ fontSize: 11, color: T.textMuted, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.url}</div>
                        <div style={{ fontSize: 11, color: T.textMuted }}>{h.date}</div>
                      </div>
                      <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                        <TBtn onClick={() => { setRepoUrl(h.url); setRepoId(h.id); setRepoName(h.name); setSections({ summary: "", beginner: "", advanced: "", interview: "" }); setPage("results"); setActiveSection("summary"); setTimeout(() => generateSection("summary"), 100); }} style={{ padding: "6px 12px", fontSize: 11 }}>View</TBtn>
                        <GBtn onClick={() => deleteHistory(h.id)} style={{ padding: "6px 8px", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: T.red }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                        </GBtn>
                      </div>
                    </div>
                  </Card>
                ))
              }
            </div>
          </>
        )}

      </div>
    </div>
  );
}
