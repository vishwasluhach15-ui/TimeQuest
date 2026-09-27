// Yeh types supabase/schema.sql ke tables se match karte hain.
// Baad me `supabase gen types typescript` se auto-generate kar sakte ho —
// abhi Phase 0 ke liye hand-written rakha hai taaki samajhna easy ho.

export type Topic = {
  id: string;
  name: string; // e.g. "Urban planning", "Trade & seals", "Script"
  era: string; // e.g. "Harappan Civilization"
};

export type KnowledgeCard = {
  id: string;
  topic_id: string;
  title: string;
  fact_text: string; // the historically-supported nugget shown to the player
  source_note: string | null; // where this fact comes from (for credibility)
  created_at: string;
};

export type QuizQuestion = {
  id: string;
  topic_id: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[]; // stored as jsonb in Postgres
  correct_answer: string;
};

export type Player = {
  id: string;
  display_name: string;
  created_at: string;
};

export type PlayerCard = {
  player_id: string;
  card_id: string;
  discovered_at: string;
};

export type QuizAttempt = {
  id: string;
  player_id: string;
  question_id: string;
  chosen_answer: string;
  is_correct: boolean;
  attempted_at: string;
};
