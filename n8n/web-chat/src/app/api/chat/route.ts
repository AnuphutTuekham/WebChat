import { NextResponse } from "next/server";

function formatUpstreamError(upstreamStatus: number, data: unknown) {
  const maybe = data as { message?: unknown; hint?: unknown };
  const message = typeof maybe?.message === "string" ? maybe.message : "Unknown error";
  const hint = typeof maybe?.hint === "string" ? maybe.hint : "";
  const parts = [`เชื่อมต่อ n8n ไม่สำเร็จ (HTTP ${upstreamStatus}).`, message];
  if (hint) parts.push(hint);
  return parts.filter(Boolean).join(" ");
}

export async function GET() {
  return NextResponse.json({ ok: true }, { status: 200 });
}

export async function POST(req: Request) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return NextResponse.json(
      {
        reply: "ตั้งค่า N8N_WEBHOOK_URL ใน .env.local ก่อน",
        upstreamStatus: null,
      },
      { status: 500 },
    );
  }

  const body = await req.json().catch(() => ({}));

  const r = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
     //"x-api-key": process.env.N8N_WEBHOOK_SECRET!, // ถ้าจะส่ง secret ไปให้ n8n ตรวจ ต้องเพิ่ม condition ใน node if
    },
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));
  if (r.ok) {
    return NextResponse.json({ ...data, upstreamStatus: r.status }, { status: 200 });
  }

  const reply = formatUpstreamError(r.status, data);
  return NextResponse.json(
    {
      reply,
      upstreamStatus: r.status,
      upstream: data,
    },
    { status: 200 },
  );
}
