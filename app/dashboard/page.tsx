"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getOrCreatePlayerId } from "@/lib/player";
import type { Topic } from "@/lib/types";

// See app/play/page.tsx for why this is needed.
export const dynamic = "force-dynamic";

type TopicSummary = {
  topic: Topic;
  cardsTotal: number;
  cardsFound: number;
  asked: number;
  correct: number;
};

export default function DashboardPage() {
  const [summaries, setSummaries] = useState<TopicSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const playerId = await getOrCreatePlayerId();

        const [
          { data: topics, error: topicsErr },
          { data: cards, error: cardsErr },
          { data: playerCards, error: pcErr },
          { data: questions, error: qErr },
          { data: attempts, error: attErr },
        ] = await Promise.all([
          getSupabaseClient().from("topics").select("*"),
          getSupabaseClient().from("knowledge_cards").select("*"),
          getSupabaseClient().from("player_cards").select("*").eq("player_id", playerId),
          getSupabaseClient().from("quiz_questions").select("*"),
          getSupabaseClient().from("quiz_attempts").select("*").eq("player_id", playerId),
        ]);
        if (topicsErr) throw topicsErr;
        if (cardsErr) throw cardsErr;
        if (pcErr) throw pcErr;
        if (qErr) throw qErr;
        if (attErr) throw attErr;

        const foundCardIds = new Set(
          (playerCards ?? []).map((pc) => pc.card_id)
        );
        const questionTopicById = new Map(
          (questions ?? []).map((q) => [q.id, q.topic_id])
        );

        const result: TopicSummary[] = (topics ?? []).map((topic) => {
          const topicCards = (cards ?? []).filter(
            (c) => c.topic_id === topic.id
          );
          const cardsFound = topicCards.filter((c) =>
            foundCardIds.has(c.id)
          ).length;

          const topicAttempts = (attempts ?? []).filter(
            (a) => questionTopicById.get(a.question_id) === topic.id
          );
          const correct = topicAttempts.filter((a) => a.is_correct).length;

          return {
            topic,
            cardsTotal: topicCards.length,
            cardsFound,
            asked: topicAttempts.length,
            correct,
          };
        });

        setSummaries(result);
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Could not load the dashboard."
        );
      }
    }
    load();
  }, []);

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-clay">{loadError}</p>
      </main>
    );
  }

  if (!summaries) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-ink/60">Loading your progress…</p>
      </main>
    );
  }

  const attempted = summaries.filter((s) => s.asked > 0);
  const weakest = [...attempted].sort(
    (a, b) => a.correct / a.asked - b.correct / b.asked
  )[0];
  const unexplored = summaries.filter(
    (s) => s.cardsTotal === 0 && s.asked === 0
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-lapis hover:underline">
        ← Back
      </Link>
      <h1 className="mt-3 font-display text-3xl text-ink">
        Your learning dashboard
      </h1>
      <p className="mt-1 text-sm text-ink/70">
        What you&apos;ve discovered, what you understand well, and what to
        explore next — per topic.
      </p>

      <div className="mt-8 space-y-4">
        {summaries.map((s) => {
          const accuracy =
            s.asked > 0 ? Math.round((s.correct / s.asked) * 100) : null;
          const cardPct =
            s.cardsTotal > 0
              ? Math.round((s.cardsFound / s.cardsTotal) * 100)
              : 0;

          return (
            <div
              key={s.topic.id}
              className="rounded-sm border border-sandstone bg-sandstone/10 p-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg text-ink">
                  {s.topic.name}
                </h2>
                {s.cardsTotal === 0 && s.asked === 0 ? (
                  <span className="text-xs text-ink/50">
                    Not yet available
                  </span>
                ) : accuracy === null ? (
                  <span className="text-xs text-ink/50">
                    Explored, not quizzed yet
                  </span>
                ) : accuracy >= 70 ? (
                  <span className="text-xs text-lapis">
                    Strong — {accuracy}%
                  </span>
                ) : (
                  <span className="text-xs text-clay">
                    Needs review — {accuracy}%
                  </span>
                )}
              </div>

              {s.cardsTotal > 0 && (
                <div className="mt-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-sandstone/30">
                    <div
                      className="h-full bg-lapis"
                      style={{ width: `${cardPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-ink/50">
                    {s.cardsFound}/{s.cardsTotal} cards discovered
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-10 rounded-sm border border-lapis bg-lapis/10 p-4">
        <h2 className="font-display text-lg text-lapis">What to do next</h2>
        <p className="mt-2 text-sm text-ink/80">
          {unexplored.length > 0
            ? `${unexplored
                .map((s) => s.topic.name)
                .join(", ")} ${
                unexplored.length > 1 ? "have" : "has"
              } no content yet — a good next area to build out before the
              next demo.`
            : weakest
            ? `Revisit "${weakest.topic.name}" — your weakest topic so far at ${Math.round(
                (weakest.correct / weakest.asked) * 100
              )}% accuracy.`
            : "Play through the ruins and take the quiz to see personalized recommendations here."}
        </p>
      </div>

      <Link
        href="/play"
        className="mt-8 inline-block rounded-sm bg-clay px-6 py-3 text-bone hover:bg-clay/90"
      >
        Back to the ruins
      </Link>
    </main>
  );
}
