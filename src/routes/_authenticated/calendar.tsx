import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useAuthedServerFn } from "@/lib/use-authed-server-fn";
import {
  beginGoogleCalendarOAuth,
  disconnectCalendar,
  getCalendarEvents,
  scheduleCalendarEvent,
} from "@/server/calendar.functions";
import { Panel } from "@/components/lucid/Panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays, ExternalLink, Plug, Plus, Unlink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Lucid" },
      { name: "description", content: "Sync habits with your Google Calendar." },
    ],
  }),
  component: CalendarPage,
});

interface Ev {
  id: string;
  summary: string;
  start: string;
  end: string;
  htmlLink: string;
  allDay: boolean;
}

function CalendarPage() {
  const begin = useAuthedServerFn(beginGoogleCalendarOAuth);
  const fetchEvents = useAuthedServerFn(getCalendarEvents);
  const schedule = useAuthedServerFn(scheduleCalendarEvent);
  const disconnect = useAuthedServerFn(disconnectCalendar);

  const [connected, setConnected] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchEvents();
      setConnected(r.connected);
      setEmail(r.email ?? null);
      setEvents(r.events ?? []);
    } finally {
      setLoading(false);
    }
  }, [fetchEvents]);

  useEffect(() => {
    reload();
    const params = new URLSearchParams(window.location.search);
    if (params.get("connected") === "1") {
      toast.success("Google Calendar connected");
      window.history.replaceState({}, "", "/calendar");
    } else if (params.get("error")) {
      toast.error(`Calendar connection failed: ${params.get("error")}`);
      window.history.replaceState({}, "", "/calendar");
    }
  }, [reload]);

  async function handleConnect() {
    const { url } = await begin();
    window.location.href = url;
  }

  async function handleDisconnect() {
    await disconnect();
    toast.success("Disconnected");
    reload();
  }

  // Quick-schedule form
  const [summary, setSummary] = useState("");
  const [when, setWhen] = useState(() => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  });
  const [duration, setDuration] = useState(30);

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;
    try {
      await schedule({
        data: {
          summary,
          startISO: new Date(when).toISOString(),
          durationMin: duration,
        },
      });
      toast.success("Scheduled to Google Calendar");
      setSummary("");
      reload();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to schedule");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-ink">Calendar</h1>
          <p className="text-ash text-sm mt-1 font-mono">
            Bind your operations to time. Real Google Calendar sync.
          </p>
        </div>
        {connected ? (
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            <Unlink className="h-3.5 w-3.5 mr-2" /> Disconnect
          </Button>
        ) : null}
      </div>

      {connected === false && (
        <Panel title="Connect Google Calendar" subtitle="One-time consent. Per-user OAuth.">
          <div className="flex items-center justify-between gap-4 py-4">
            <p className="text-sm text-ash max-w-md">
              Lucid will read your upcoming events and write events you schedule
              from this app. We never delete or modify events you didn't create here.
            </p>
            <Button onClick={handleConnect} className="gap-2">
              <Plug className="h-4 w-4" /> Connect
            </Button>
          </div>
        </Panel>
      )}

      {connected && (
        <>
          <Panel
            title="Quick schedule"
            subtitle={email ? `Writing to ${email}` : "Primary calendar"}
          >
            <form
              onSubmit={handleSchedule}
              className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2 py-3"
            >
              <Input
                placeholder="What are you doing?"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />
              <Input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
              <Input
                type="number"
                min={5}
                max={480}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-24"
              />
              <Button type="submit" className="gap-2">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </form>
          </Panel>

          <Panel
            title="Next 7 days"
            subtitle={`${events.length} event${events.length === 1 ? "" : "s"}`}
          >
            {loading ? (
              <div className="text-ash text-sm py-6 font-mono">Loading…</div>
            ) : events.length === 0 ? (
              <div className="text-ash text-sm py-6 font-mono">
                Clear week. Schedule something above.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {events.map((ev) => (
                  <li
                    key={ev.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CalendarDays className="h-4 w-4 text-gold shrink-0" />
                      <div className="min-w-0">
                        <div className="text-sm text-ink truncate">{ev.summary}</div>
                        <div className="text-[11px] font-mono text-ash">
                          {formatRange(ev.start, ev.end, ev.allDay)}
                        </div>
                      </div>
                    </div>
                    <a
                      href={ev.htmlLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ash hover:text-ink"
                      title="Open in Google Calendar"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}

function formatRange(startISO: string, endISO: string, allDay: boolean) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const day = s.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  if (allDay) return `${day} · all day`;
  const t = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} · ${t(s)} – ${t(e)}`;
}
