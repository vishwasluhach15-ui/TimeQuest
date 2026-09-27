-- Phase 2 seed — run this ONCE in the Supabase SQL Editor, in addition to
-- schema.sql (don't re-run schema.sql itself, it would duplicate rows).
--
-- Adds quiz questions for the "Script & writing" topic, so the quiz has
-- three topics to draw from instead of two.
--
-- "Daily life & crafts" is deliberately left with zero cards and zero
-- questions. That's not a bug — it's what makes the dashboard's "topics
-- you haven't explored yet" section show something real instead of being
-- hardcoded.

insert into quiz_questions (topic_id, difficulty, question, options, correct_answer)
select id, 'easy',
  'Where has the undeciphered Indus script mainly been found?',
  '["Cave paintings", "Seals and pottery", "Palace walls", "Coins"]'::jsonb,
  'Seals and pottery'
from topics where name = 'Script & writing';

insert into quiz_questions (topic_id, difficulty, question, options, correct_answer)
select id, 'medium',
  'What is the current state of research on the Indus script?',
  '["Fully deciphered decades ago", "Still undeciphered and actively debated", "Known to be a numeral system only", "Proven to be decorative, not writing"]'::jsonb,
  'Still undeciphered and actively debated'
from topics where name = 'Script & writing';
