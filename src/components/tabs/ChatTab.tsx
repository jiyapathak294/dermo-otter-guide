import { useEffect, useRef, useState } from "react";
import { loadProfile } from "@/lib/profile";
import { Send, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import bear from "@/assets/dermo-bear.svg";

type Msg = { role: "user" | "assistant"; content: string };

export const ChatTab = () => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm **Dermo** 🐻. Tell me how your skin, hair, or nails are doing this week." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input };
    const next = [...messages, userMsg];
    setMessages(next); setInput(""); setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dermo-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: next, profile: loadProfile() }),
      });
      if (!resp.ok || !resp.body) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error || "Failed");
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = ""; let acc = "";
      setMessages((m) => [...m, { role: "assistant", content: "" }]);
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buf += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") { done = true; break; }
          try {
            const p = JSON.parse(j);
            const c = p.choices?.[0]?.delta?.content;
            if (c) {
              acc += c;
              setMessages((m) => m.map((x, i) => i === m.length - 1 ? { ...x, content: acc } : x));
            }
          } catch { buf = line + "\n" + buf; break; }
        }
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `Sorry — ${e.message}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-6 pb-3 border-b border-border flex items-center gap-3">
        <img src={bear} alt="Dermo" className="h-9 w-9 object-contain" />
        <div>
          <h2 className="font-heading text-xl text-navy leading-tight">Ask Dermo</h2>
          <p className="text-[11px] text-muted-foreground">Personal AI dermatology companion</p>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
            <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-navy text-white" : "bg-baby-blue/40 text-foreground border border-border"}`}>
              {m.content ? (
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>
              ) : (loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null)}
            </div>
          </div>
        ))}
      </div>
      <div className="px-3 pb-3 pt-2 flex gap-2">
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="How's your skin today?"
          className="flex-1 rounded-2xl border-2 border-navy px-4 py-3 text-sm outline-none focus:border-jazz-blue"
        />
        <button onClick={send} disabled={loading} className="h-12 w-12 rounded-2xl bg-baby-blue text-white flex items-center justify-center"><Send className="h-5 w-5" /></button>
      </div>
    </div>
  );
};
