import { useEffect, useRef, useState } from "react";
import { loadProfile } from "@/lib/profile";
import { ChevronUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { DermoLogo } from "@/components/DermoLogo";

type Msg = { role: "user" | "assistant"; content: string };

const CLAY = "#b3674d";
const CLAY_LIGHT = "#c9856b";

export const ChatTab = () => {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm **Dermo**. Tell me how your skin, hair, or nails are doing this week." },
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
    <div className="flex flex-col h-full bg-white">
      <div className="px-5 pt-7 pb-4 flex items-center gap-3 bg-white">
        <DermoLogo color={CLAY} size={42} />
        <h1 className="font-heading text-[34px] text-foreground">Ask Dermo</h1>
      </div>

      <div
        className="flex-1 flex flex-col px-4 pt-5 pb-5 rounded-t-[28px]"
        style={{ background: `linear-gradient(180deg, ${CLAY_LIGHT} 0%, ${CLAY} 100%)` }}
      >
        <div className="flex-1 rounded-[26px] bg-white p-4 flex flex-col shadow-soft overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                <div
                  className={`max-w-[82%] px-4 py-2.5 text-sm leading-snug ${
                    m.role === "user"
                      ? "rounded-2xl rounded-br-md text-white"
                      : "rounded-2xl rounded-bl-md bg-[#ececec] text-foreground"
                  }`}
                  style={m.role === "user" ? { background: CLAY } : undefined}
                >
                  {m.content ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  ) : (loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-full bg-white pl-5 pr-2 py-2 shadow-soft">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="e.g. remove products containing fragrance"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={send}
            disabled={loading}
            className="h-10 w-10 rounded-full flex items-center justify-center text-white disabled:opacity-60"
            style={{ background: CLAY }}
            aria-label="Send"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronUp className="h-5 w-5" strokeWidth={2.6} />}
          </button>
        </div>
      </div>
    </div>
  );
};
