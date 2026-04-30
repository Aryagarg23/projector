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
      const { data: pollRows } = await supabase
        .from("polls")
        .select("id, slide_id, question, option_a, option_b, option_c, option_d");
      const { data: countRows } = await supabase
        .from("vote_counts")
        .select("poll_id, choice, votes");
      if (cancelled) return;
      if (pollRows) {
        const map: Record<string, PollRow> = {};
        for (const p of pollRows as PollRow[]) {
          map[p.slide_id] = p;
        }
        setPollsBySlide(map);
      }
      if (countRows) {
        const map: Record<number, ChoiceCounts> = {};
        for (const r of countRows as { poll_id: number; choice: keyof ChoiceCounts; votes: number }[]) {
          if (!map[r.poll_id]) map[r.poll_id] = { A: 0, B: 0, C: 0, D: 0 };
          map[r.poll_id][r.choice] = r.votes;
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
