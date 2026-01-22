"use client";

import { useMemo, useState } from "react";

type Msg = { role: "user" | "assistant"; text: string };

export default function Page() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", text: "สวัสดีครับ พิมพ์ข้อความเพื่อเริ่มแชทได้เลย" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const sessionId = useMemo(() => {
    if (typeof window === "undefined") return "demo";
    const key = "session_id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(key, id);
    return id;
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          user_id: "U-001",
          customer_name: "Somchai",
          message: text,
        }),
      });

      const data = await res.json();
      const reply = data?.reply ?? "ขออภัย ระบบไม่สามารถตอบได้ในขณะนี้";
      setMessages((m) => [...m, { role: "assistant", text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", text: "เกิดข้อผิดพลาดในการเชื่อมต่อ" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">MVP Web Chat (Next.js → n8n → Gemini)</h1>

      <div className="border rounded p-4 h-[60vh] overflow-auto space-y-3 bg-white">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className="inline-block max-w-[80%] rounded px-3 py-2 border">
              <div className="text-xs opacity-60 mb-1">{m.role}</div>
              <div className="whitespace-pre-wrap">{m.text}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="พิมพ์ข้อความ..."
          disabled={busy}
        />
        <button
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          onClick={send}
          disabled={busy}
        >
          Send
        </button>
      </div>

      <div className="text-sm text-gray-600 mt-2">
        Session: {sessionId} {busy ? " | กำลังคิด..." : ""}
      </div>
    </main>
  );
}
