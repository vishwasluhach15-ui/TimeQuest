-- Phase 3 content seed — run this ONCE in the SQL Editor, after
-- schema.sql and phase2-seed.sql. Fills in the last topic
-- ("Daily life & crafts") with cards and questions, so all four topics
-- have real content for the demo.

insert into knowledge_cards (topic_id, title, fact_text, source_note)
select id, 'The 4:2:1 brick ratio', 'Harappan baked bricks followed a near-universal ratio of 4:2:1 (length:width:height) across cities hundreds of kilometres apart — a striking sign of shared standards.', 'ASI excavation reports, comparative brick studies'
from topics where name = 'Daily life & crafts';

insert into knowledge_cards (topic_id, title, fact_text, source_note)
select id, 'Carnelian bead-making', 'Craftsmen at sites like Chanhudaro made long carnelian beads using a specialised drilling technique, traded widely across the region.', 'Indus Valley craft-production studies'
from topics where name = 'Daily life & crafts';

insert into quiz_questions (topic_id, difficulty, question, options, correct_answer)
select id, 'easy',
  'What does the shared 4:2:1 brick ratio across Harappan cities suggest?',
  '["Random building styles", "Shared construction standards", "Different eras of construction", "Religious symbolism only"]'::jsonb,
  'Shared construction standards'
from topics where name = 'Daily life & crafts';

insert into quiz_questions (topic_id, difficulty, question, options, correct_answer)
select id, 'medium',
  'Carnelian beads made at sites like Chanhudaro are evidence of what?',
  '["Isolated village life", "Specialised craft production and trade", "Purely decorative religious items with no trade role", "Currency used for taxation"]'::jsonb,
  'Specialised craft production and trade'
from topics where name = 'Daily life & crafts';
