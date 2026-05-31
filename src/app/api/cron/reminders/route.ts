import { NextResponse } from "next/server";
import { runDailyReminders } from "@/lib/jobs/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/reminders]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Reminder job failed",
      },
      { status: 500 }
    );
  }
}
