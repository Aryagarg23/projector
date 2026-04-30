import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface PollRow {
  id: number;
  slide_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
}

export interface ChoiceCounts {
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface AllPollCounts {
  /** Polls indexed by slide_id (e.g. "q1") */
  pollsBySlide: Record<string, PollRow>;
  /** Vote counts indexed by numeric poll id */
  countsByPollId: Record<number, ChoiceCounts>;
}

/**
 * Subscribes to every poll's tally — used by surfaces that cycle through
 * multiple questions and need real Supabase counts for each, not just the
 * currently-active one.
 */
export function useAllPollCounts(): AllPollCounts {
  const [pollsBySlide, setPollsBySlide] = useState<Record<string, PollRow>>({});
  const [countsByPollId, setCountsByPollId] = useState<Record<number, ChoiceCounts>>({});

  useEffect(() => {
    let cancelled = false;

    async function fetchAll() {
      const { data: pollRows, error: pollErr } = await supabase
        .from("polls")
        .select("id, slide_id, question, option_a, option_b, option_c, option_d");
      const { data: countRows, error: countErr } = await supabase
        .from("vote_counts")
        .select("poll_id, choice, votes");
      if (cancelled) return;
      if (pollErr) console.warn("[useAllPollCounts] polls fetch error:", pollErr);
      if (countErr) console.warn("[useAllPollCounts] vote_counts fetch error:", countErr);
      if (pollRows) {
        const map: Record<string, PollRow> = {};
        for (const p of pollRows as PollRow[]) {
          // Coerce id in case PostgREST returns bigint as string
          map[p.slide_id] = { ...p, id: Number(p.id) };
        }
        setPollsBySlide(map);
      }
      if (countRows) {
        const map: Record<number, ChoiceCounts> = {};
        for (const r of countRows as { poll_id: number | string; choice: keyof ChoiceCounts; votes: number | string }[]) {
          // bigint columns (poll_id, count) can come back as strings — coerce.
          const pid = Number(r.poll_id);
          if (!map[pid]) map[pid] = { A: 0, B: 0, C: 0, D: 0 };
          map[pid][r.choice] = Number(r.votes) || 0;
        }
        setCountsByPollId(map);
      }
    }

    fetchAll();
    const ch = supabase
      .channel("all_polls_votes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "votes" },
        () => fetchAll()
      )
      .subscribe();
    const tick = setInterval(fetchAll, 2000);

    return () => {
      cancelled = true;
      clearInterval(tick);
      supabase.removeChannel(ch);
    };
  }, []);

  return { pollsBySlide, countsByPollId };
}
