import { NextResponse } from "next/server";
import { sendPushToAll } from "@/lib/push/send";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const result = await sendPushToAll({
    title: "SideQuest 🎲",
    body: "Доброго ранку! Твій квест дня чекає.",
    url: "/home",
  });
  return NextResponse.json({ ok: true, ...result });
}
