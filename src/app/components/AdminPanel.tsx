import { useEffect, useState } from "react";
import { supabase, type Poll } from "../lib/supabase";

export function AdminPanel() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: p } = await supabase
        .from("polls")
        .select("*")
        .order("position");
      const { data: s } = await supabase
        .from("poll_state")
        .select("active_poll_id")
        .eq("id", 1)
        .single();
      if (cancelled) return;
      setPolls((p as Poll[]) ?? []);
      setActiveId(s?.active_poll_id ?? null);
    })();

    const ch = supabase
      .channel("admin_state")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_state" },
        (payload) => {
          const next = (payload.new as { active_poll_id: number | null })
            ?.active_poll_id;
          if (next !== undefined) setActiveId(next);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
  }, []);

  async function activate(pollId: number | null) {
    setBusy(true);
    setErr(null);
    const { error } = await supabase
      .from("poll_state")
      .update({ active_poll_id: pollId, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setBusy(false);
    if (error) setErr(error.message);
    else setActiveId(pollId);
  }

  async function clearVotes(pollId: number) {
    if (!confirm("Delete all votes for this poll?")) return;
    setBusy(true);
    const { error } = await supabase.from("votes").delete().eq("poll_id", pollId);
    setBusy(false);
    if (error) setErr(error.message);
  }

  return (
    <div className="w-screen min-h-screen bg-black text-white p-6 font-mono">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">
        <div>
          <div className="text-xs tracking-[0.3em] opacity-50">
            CROWD POLLS · ADMIN
          </div>
          <h1 className="text-2xl font-black mt-1">Control Panel</h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => activate(null)}
            disabled={busy}
            className="px-3 py-2 text-xs rounded border border-white/20 hover:bg-white/10"
          >
            ⏸ DEACTIVATE
          </button>
        </div>

        {err && <div className="text-red-400 text-xs">{err}</div>}

        <div className="flex flex-col gap-2">
          {polls.map((p) => {
            const active = p.id === activeId;
            return (
              <div
                key={p.id}
                className="border rounded-lg p-4 flex flex-col gap-2"
                style={{
                  borderColor: active
                    ? "rgba(0,255,136,0.5)"
                    : "rgba(255,255,255,0.1)",
                  background: active
                    ? "rgba(0,255,136,0.06)"
                    : "rgba(255,255,255,0.02)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs tracking-[0.25em] opacity-60">
                    {p.slide_id.toUpperCase()}
                    {active && " · ● ACTIVE"}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => activate(p.id)}
                      disabled={busy || active}
                      className="px-3 py-1.5 text-xs rounded border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-40"
                    >
                      {active ? "ACTIVE" : "▶ ACTIVATE"}
                    </button>
                    <button
                      onClick={() => clearVotes(p.id)}
                      disabled={busy}
                      className="px-3 py-1.5 text-xs rounded border border-red-400/30 text-red-300 hover:bg-red-400/10"
                    >
                      ↺ RESET VOTES
                    </button>
                  </div>
                </div>
                <div className="text-base font-semibold">{p.question}</div>
                <div className="grid grid-cols-2 gap-1 text-xs opacity-70">
                  <div>A · {p.option_a}</div>
                  <div>B · {p.option_b}</div>
                  <div>C · {p.option_c}</div>
                  <div>D · {p.option_d}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[10px] tracking-[0.25em] opacity-40 mt-4">
          /answer-here · /results-here · /
        </div>
      </div>
    </div>
  );
}
