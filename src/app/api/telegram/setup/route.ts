import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const webhookUrl = body.url as string | undefined;

    if (!webhookUrl) {
      return NextResponse.json(
        { error: "Missing 'url' in request body" },
        { status: 400 }
      );
    }

    const fullUrl = `${webhookUrl}/api/telegram/webhook`;

    const res = await fetch(
      `https://api.telegram.org/bot${token}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: fullUrl }),
      }
    );

    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: data.description ?? "Failed to set webhook" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      webhookUrl: fullUrl,
      description: data.description,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN not configured" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/getWebhookInfo`,
      { method: "GET" }
    );
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: data.description ?? "Failed to get webhook info" },
        { status: 500 }
      );
    }

    return NextResponse.json(data.result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
