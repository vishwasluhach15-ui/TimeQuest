-- TimeQuest — Phase 0 schema
-- Run this in Supabase: Dashboard -> SQL Editor -> paste -> Run
-- (or via `supabase db push` if you're using the CLI)

create extension if not exists "uuid-ossp";

-- Broad subject buckets inside an era, used to group cards + quiz
-- questions and to compute "what topics remain unexplored" on the
-- dashboard.
create table topics (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  era text not null default 'Harappan Civilization'
);

-- The historically-supported facts the player collects while exploring.
create table knowledge_cards (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid not null references topics(id) on delete cascade,
  title text not null,
  fact_text text not null,
  source_note text,
  created_at timestamptz not null default now()
);

-- Adaptive quiz question bank.
create table quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid not null references topics(id) on delete cascade,
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  question text not null,
  options jsonb not null, -- e.g. ["Option A", "Option B", "Option C", "Option D"]
  correct_answer text not null
);

-- One row per player. Swap for Supabase Auth's `auth.users` once you add
-- real login — for Phase 0 a simple table keeps things unblocked.
create table players (
  id uuid primary key default uuid_generate_v4(),
  display_name text not null,
  created_at timestamptz not null default now()
);

-- Which cards a player has discovered in the game world.
create table player_cards (
  player_id uuid not null references players(id) on delete cascade,
  card_id uuid not null references knowledge_cards(id) on delete cascade,
  discovered_at timestamptz not null default now(),
  primary key (player_id, card_id)
);

-- Every quiz answer a player submits — this is what the dashboard
-- aggregates into "strong topics / weak topics / recommended next".
create table quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  player_id uuid not null references players(id) on delete cascade,
  question_id uuid not null references quiz_questions(id) on delete cascade,
  chosen_answer text not null,
  is_correct boolean not null,
  attempted_at timestamptz not null default now()
);

-- Helpful indexes for the dashboard aggregation queries.
create index idx_player_cards_player on player_cards(player_id);
create index idx_quiz_attempts_player on quiz_attempts(player_id);
create index idx_quiz_questions_topic on quiz_questions(topic_id);
create index idx_knowledge_cards_topic on knowledge_cards(topic_id);

-- ---------------------------------------------------------------------
-- Seed data: a handful of real, verifiable Harappan facts to start with.
-- Replace/expand these — keep source_note honest so the "historically
-- supported" claim in your project pitch actually holds up.
-- ---------------------------------------------------------------------

insert into topics (name, era) values
  ('Urban planning', 'Harappan Civilization'),
  ('Trade & seals', 'Harappan Civilization'),
  ('Script & writing', 'Harappan Civilization'),
  ('Daily life & crafts', 'Harappan Civilization');

insert into knowledge_cards (topic_id, title, fact_text, source_note)
select id, 'The Great Bath', 'Mohenjo-daro had a large brick-lined public bath, likely used for ritual bathing, with a design that kept it watertight using bitumen.', 'Archaeological Survey of India excavation reports'
from topics where name = 'Urban planning';

insert into knowledge_cards (topic_id, title, fact_text, source_note)
select id, 'Grid-planned streets', 'Harappan cities were laid out on a grid, with main streets running roughly north-south and east-west.', 'ASI excavation reports, Mohenjo-daro & Harappa'
from topics where name = 'Urban planning';

insert into knowledge_cards (topic_id, title, fact_text, source_note)
select id, 'Standardized weights', 'Harappans used a standardized system of cubical stone weights, suggesting regulated trade across the region.', 'Indus Valley archaeological studies'
from topics where name = 'Trade & seals';

insert into knowledge_cards (topic_id, title, fact_text, source_note)
select id, 'Undeciphered script', 'The Indus script, found on seals and pottery, has not yet been deciphered by historians.', 'Ongoing academic research — actively debated'
from topics where name = 'Script & writing';

insert into quiz_questions (topic_id, difficulty, question, options, correct_answer)
select id, 'easy',
  'What was the Great Bath most likely used for?',
  '["Storing grain", "Ritual bathing", "Housing soldiers", "A marketplace"]'::jsonb,
  'Ritual bathing'
from topics where name = 'Urban planning';

insert into quiz_questions (topic_id, difficulty, question, options, correct_answer)
select id, 'medium',
  'What does the standardization of Harappan weights suggest?',
  '["Religious rituals", "Regulated trade", "Military rank", "Farming seasons"]'::jsonb,
  'Regulated trade'
from topics where name = 'Trade & seals';
