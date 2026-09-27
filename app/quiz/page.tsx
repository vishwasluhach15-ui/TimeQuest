"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabase/client";
import { getOrCreatePlayerId } from "@/lib/player";
import {
  groupQuestionsByTopic,
  pickNextQuestion,
  type TopicProgress,
} from "@/lib/quiz";
import type { QuizQuestion, Topic } from "@/lib/types";

// See app/play/page.tsx for why this is needed.
export const dynamic = "force-dynamic";

const MAX_QUESTIONS = 8;

export default function QuizPage() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [perTopic, setPerTopic] = useState<Map<
    string,
    QuizQuestion[]
  > | null>(null);
  const [progress, setProgress] = useState<Map<string, TopicProgress>>(
    new Map()
  );
  const [current, setCurrent] = useState<QuizQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        const id = await getOrCreatePlayerId();
        setPlayerId(id);

        const [
          { data: topicsData, error: topicsErr },
          { data: questionsData, error: qErr },
        ] = await Promise.all([
          getSupabaseClient().from("topics").select("*"),
          getSupabaseClient().from("quiz_questions").select("*"),
        ]);
        if (topicsErr) throw topicsErr;
        if (qErr) throw qErr;

        const grouped = groupQuestionsByTopic(questionsData ?? []);
        const initialProgress = new Map<string, TopicProgress>();
        (topicsData ?? []).forEach((t) => {
          initialProgress.set(t.id, {
            topicId: t.id,
            pointer: 0,
            asked: 0,
            correct: 0,
          });
        });

        setTopics(topicsData ?? []);
        setPerTopic(grouped);
        setProgress(initialProgress);
        setCurrent(pickNextQuestion(grouped, initialProgress));
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Could not load the quiz."
        );
      }
    }
    setup();
  }, []);

  async function handleAnswer(option: string) {
    if (!current || !perTopic || selected) return;
    setSelected(option);

    const isCorrect = option === current.correct_answer;
    const topicId = current.topic_id;

    const nextProgress = new Map(progress);
    const p = { ...nextProgress.get(topicId)! };
    p.pointer += 1;
    p.asked += 1;
    if (isCorrect) p.correct += 1;
    nextProgress.set(topicId, p);
    setProgress(nextProgress);

    if (playerId) {
      await getSupabaseClient().from("quiz_attempts").insert({
        player_id: playerId,
        question_id: current.id,
        chosen_answer: option,
        is_correct: isCorrect,
      });
    }

    // Brief pause so the player sees which answer was correct before the
    // next question replaces it.
    setTimeout(() => {
      const nextCount = answeredCount + 1;
      setAnsweredCount(nextCount);
      setSelected(null);

      if (nextCount >= MAX_QUESTIONS) {
        setFinished(true);
        return;
      }

      const next = pickNextQuestion(perTopic, nextProgress);
      setCurrent(next);
      if (!next) setFinished(true);
    }, 900);
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-clay">{loadError}</p>
      </main>
    );
  }

  if (finished) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16 text-center">
        <h1 className="font-display text-3xl text-ink">Quiz complete</h1>
        <p className="mt-3 text-ink/70">
          {answeredCount} question{answeredCount === 1 ? "" : "s"} answered
          across {topics.length} topics.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-block rounded-sm bg-lapis px-6 py-3 text-bone hover:bg-lapis/90"
        >
          See your learning dashboard
        </Link>
      </main>
    );
  }

  if (!current) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <p className="text-ink/60">Loading questions…</p>
      </main>
    );
  }

  const topicName = topics.find((t) => t.id === current.topic_id)?.name ?? "";

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <p className="text-sm text-lapis">
        {topicName} · {current.difficulty}
      </p>
      <h1 className="mt-3 font-display text-2xl text-ink">
        {current.question}
      </h1>

      <div className="mt-6 space-y-3">
        {current.options.map((opt) => {
          const isChosen = selected === opt;
          const isCorrectOpt = !!selected && opt === current.correct_answer;
          return (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              disabled={!!selected}
              className={`block w-full rounded-sm border p-3 text-left text-sm transition-colors ${
                isCorrectOpt
                  ? "border-lapis bg-lapis/10"
                  : isChosen
                  ? "border-clay bg-clay/10"
                  : "border-sandstone bg-sandstone/10 hover:bg-sandstone/20"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-ink/50">
        Question {answeredCount + 1} of up to {MAX_QUESTIONS}
      </p>
    </main>
  );
}
