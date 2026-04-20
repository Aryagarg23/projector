import { useEffect, useState } from "react";
import { supabase, type Poll } from "./supabase";

export interface LiveCounts {
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface LivePoll {
  poll: Poll | null;
  counts: LiveCounts;
}

const ZERO: LiveCounts = { A: 0, B: 0, C: 0, D: 0 };

// Subscribes to the currently-active poll and its live vote tallies.
export function useLivePoll(): LivePoll {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [counts, setCounts] = useState<LiveCounts>(ZERO);

  // Track active poll
  useEffect(() => {
    let cancelled = false;

    async function loadActive() {
      const { data: state } = await supabase
        .from("poll_state")
        .select("active_poll_id")
        .eq("id", 1)
        .single();
      if (cancelled) return;
      const activeId = state?.active_poll_id;
      if (activeId == null) {
        setPoll((prev) => (prev === null ? prev : null));
        return;
      }
      const { data } = await supabase
        .from("polls")
        .select("*")
        .eq("id", activeId)
        .single();
      if (!cancelled && data) {
        setPoll((prev) =>
          prev && prev.id === (data as Poll).id ? prev : (data as Poll)
        );
      }
    }

    loadActive();
    const ch = supabase
      .channel("poll_state_results")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poll_state" },
        () => loadActive()
      )
      .subscribe();

    // Polling fallback in case realtime isn't delivering
    const poll = setInterval(loadActive, 2000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      supabase.removeChannel(ch);
    };
  }, []);

  // Load + subscribe to counts for the active poll
  useEffect(() => {
    if (!poll) {
      setCounts(ZERO);
      return;
    }
    let cancelled = false;

    async function refresh() {
      const { data } = await supabase
        .from("vote_counts")
        .select("choice, votes")
        .eq("poll_id", poll!.id);
      if (cancelled || !data) return;
      const next: LiveCounts = { ...ZERO };
      for (const row of data as { choice: "A" | "B" | "C" | "D"; votes: number }[]) {
        next[row.choice] = row.votes;
      }
      setCounts(next);
    }

    refresh();
    const ch = supabase
      .channel(`votes_live_${poll.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "votes",
          filter: `poll_id=eq.${poll.id}`,
        },
        () => refresh()
      )
      .subscribe();

    const tick = setInterval(refresh, 1500);

    return () => {
      cancelled = true;
      clearInterval(tick);
      supabase.removeChannel(ch);
    };
  }, [poll]);

  return { poll, counts };
}
