import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { GrainyGradient } from "./GrainyGradient";
import { supabase, type Poll } from "../lib/supabase";
import { slides } from "./slideConfig";

type Choice = "A" | "B" | "C" | "D";
const LABELS: Choice[] = ["A", "B", "C", "D"];

const questionSlides = slides.filter((s) => s.bottom.showGraph);

// Returns the gradient that matches the active question. results-here is now
// decoupled and never shows the active question's tally, so voters can safely
// see their own question's colors here.
function backgroundGradientFor(slideId: string) {
  const slide = questionSlides.find((s) => s.id === slideId);
  return slide?.bottom.gradient ?? slides[0].bottom.gradient;
}

export function AnswerScreen() {
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setActivePoll((prev) => (prev === null ? prev : null));
        return;
      }
      const { data: poll } = await supabase
        .from("polls")
        .select("*")
        .eq("id", activeId)
        .single();
      if (!cancelled && poll) {
        setActivePoll((prev) =>
          prev && prev.id === (poll as Poll).id ? prev : (poll as Poll)
        );
      }
    }

    loadActive();

    const subscription = supabase
      .channel("poll_state_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "poll_state" },
        () => loadActive()
      )
      .subscribe();

    const tick = setInterval(loadActive, 500);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      clearInterval(tick);
    };
  }, []);

  // Reset answer view when admin advances to a new poll.
  useEffect(() => {
    setLastChoice(null);
  }, [activePoll?.id]);

  async function submit(choice: Choice) {
    if (!activePoll || submitting) return;
    setSubmitting(true);
    setError(null);
    const { error } = await supabase
      .from("votes")
      .insert({ poll_id: activePoll.id, choice });
    setSubmitting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setLastChoice(choice);
  }

  async function advance() {
    if (!activePoll) return;
    const currentId = activePoll.id;
    const { data: all } = await supabase
      .from("polls")
      .select("*")
      .order("position");
    if (!all || all.length === 0) return;
    const idx = (all as Poll[]).findIndex((p) => p.id === currentId);
    if (idx < 0) return;
    const next = (all as Poll[])[(idx + 1) % all.length];
    // Optimistic local swap: switch activePoll AND clear lastChoice in the
    // same render so there's no flash of the old question's text.
    setActivePoll(next);
    setLastChoice(null);
    // Fire-and-forget DB update — listeners on other clients will pick it up.
    supabase
      .from("poll_state")
      .update({ active_poll_id: next.id, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .then(() => {});
  }

  useEffect(() => {
    if (!lastChoice) return;
    const t = setTimeout(advance, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastChoice]);

  const gradient = backgroundGradientFor(activePoll?.slide_id ?? "welcome");
  const options = activePoll
    ? [activePoll.option_a, activePoll.option_b, activePoll.option_c, activePoll.option_d]
    : [];

  const HEAD_FONT = "'Archivo Black', 'Archivo', system-ui, sans-serif";

  return (
    <div
      className="w-screen h-screen bg-black overflow-hidden select-none relative text-white uppercase"
      style={{ fontFamily: HEAD_FONT, fontWeight: 900, letterSpacing: "-0.005em" }}
    >
      <GrainyGradient config={gradient} dpiScale={1} />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="relative z-10 w-full h-full flex flex-col p-5">
        <AnimatePresence mode="wait">
          {!activePoll && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <div className="text-sm opacity-50" style={{ letterSpacing: "0.3em" }}>
                STANDBY
              </div>
            </motion.div>
          )}

          {activePoll && lastChoice && (
            <motion.div
              key={`thanks-${activePoll.id}-${lastChoice}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col items-start justify-center gap-4 text-left px-2"
            >
              <div className="text-base opacity-60">YOU ANSWERED</div>
              <div className="text-4xl sm:text-5xl leading-tight" style={{ letterSpacing: "-0.01em" }}>
                {options[LABELS.indexOf(lastChoice)]}
              </div>
              <div className="text-sm opacity-50 mt-2">
                THANK YOU FOR YOUR TIME.
              </div>
              <button
                onClick={advance}
                className="mt-6 px-6 py-3 rounded-lg text-sm"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  fontFamily: HEAD_FONT,
                  fontWeight: 900,
                  letterSpacing: "0.05em",
                }}
              >
                DONE
              </button>
            </motion.div>
          )}

          {activePoll && !lastChoice && (
            <motion.div
              key={`q-${activePoll.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="flex-1 flex flex-col gap-4"
            >
              <h1
                className="text-2xl sm:text-3xl leading-tight text-left"
                style={{ letterSpacing: "-0.01em" }}
              >
                {activePoll.question}
              </h1>

              <div className="flex-1 flex flex-col gap-2">
                {LABELS.map((label, i) => {
                  const text = options[i];
                  if (text == null || text === "") return null;
                  return (
                    <motion.button
                      key={label}
                      onClick={() => submit(label)}
                      disabled={submitting}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 min-h-[64px] w-full px-4 flex items-center gap-4 text-left rounded-lg disabled:opacity-50"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        fontFamily: HEAD_FONT,
                        fontWeight: 900,
                      }}
                    >
                      <span
                        className="text-2xl opacity-50 tabular-nums"
                        style={{ letterSpacing: "-0.01em" }}
                      >
                        {label}
                      </span>
                      <span
                        className="text-lg sm:text-xl leading-tight"
                        style={{ letterSpacing: "-0.005em" }}
                      >
                        {text}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {error && (
                <div className="text-xs text-red-300">{error}</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
