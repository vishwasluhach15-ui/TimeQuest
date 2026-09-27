import type { QuizQuestion } from "./types";

const DIFFICULTY_RANK: Record<QuizQuestion["difficulty"], number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

export type TopicProgress = {
  topicId: string;
  pointer: number; // index into that topic's difficulty-sorted question list
  asked: number;
  correct: number;
};

export function groupQuestionsByTopic(
  questions: QuizQuestion[]
): Map<string, QuizQuestion[]> {
  const map = new Map<string, QuizQuestion[]>();
  for (const q of questions) {
    const list = map.get(q.topic_id) ?? [];
    list.push(q);
    map.set(q.topic_id, list);
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) => DIFFICULTY_RANK[a.difficulty] - DIFFICULTY_RANK[b.difficulty]
    );
  }
  return map;
}

/**
 * Adaptive selection, in plain words:
 * 1. Touch every topic once, easiest question first — this is what makes
 *    the quiz "cover" the whole civilization instead of drilling one area.
 * 2. Once every topic has been asked at least once, keep pulling from
 *    whichever topic the player is currently weakest in.
 *
 * This works with just 1-2 questions per topic. A bigger question bank
 * would let it step difficulty up/down within a topic too, not just
 * choose which topic to ask about next.
 */
export function pickNextQuestion(
  perTopic: Map<string, QuizQuestion[]>,
  progress: Map<string, TopicProgress>
): QuizQuestion | null {
  const withRemaining = [...perTopic.keys()].filter((topicId) => {
    const p = progress.get(topicId);
    if (!p) return false;
    return p.pointer < (perTopic.get(topicId)?.length ?? 0);
  });

  if (withRemaining.length === 0) return null;

  const unexplored = withRemaining.filter(
    (id) => progress.get(id)!.asked === 0
  );
  const pool = unexplored.length > 0 ? unexplored : withRemaining;

  pool.sort((a, b) => {
    const pa = progress.get(a)!;
    const pb = progress.get(b)!;
    const accA = pa.asked === 0 ? 0 : pa.correct / pa.asked;
    const accB = pb.asked === 0 ? 0 : pb.correct / pb.asked;
    return accA - accB; // weakest topic first
  });

  const topicId = pool[0];
  const p = progress.get(topicId)!;
  return perTopic.get(topicId)![p.pointer];
}
