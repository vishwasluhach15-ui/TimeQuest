import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { KnowledgeCard, Topic } from "@/lib/types";

// Without this, Next.js tries to pre-render this page at BUILD time,
// which means it hits Supabase during the build itself — if env vars
// aren't available yet at that point, the whole deployment fails.
// force-dynamic makes it fetch on each real request instead.
export const dynamic = "force-dynamic";

// Server Component: yeh page load hote hi seedha Supabase se data fetch
// karta hai (no client-side loading state needed for Phase 0).
export default async function CardsPage() {
  const supabase = createServerSupabaseClient();

  const { data: topics, error: topicsError } = await supabase
    .from("topics")
    .select("*")
    .order("name");

  const { data: cards, error: cardsError } = await supabase
    .from("knowledge_cards")
    .select("*")
    .order("created_at");

  if (topicsError || cardsError) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-clay">
          Couldn&apos;t reach Supabase. Check that{" "}
          <code className="rounded bg-sandstone/40 px-1">.env.local</code> has
          your project URL and anon key, and that{" "}
          <code className="rounded bg-sandstone/40 px-1">
            supabase/schema.sql
          </code>{" "}
          has been run against your project.
        </p>
      </main>
    );
  }

  const cardsByTopic = new Map<string, KnowledgeCard[]>();
  for (const card of cards ?? []) {
    const list = cardsByTopic.get(card.topic_id) ?? [];
    list.push(card);
    cardsByTopic.set(card.topic_id, list);
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-lapis hover:underline">
        ← Back
      </Link>
      <h1 className="mt-4 font-display text-4xl text-ink">Knowledge cards</h1>
      <p className="mt-2 text-ink/70">
        Everything below is seeded from{" "}
        <code className="rounded bg-sandstone/40 px-1">
          supabase/schema.sql
        </code>
        . In the finished game, players unlock these by exploring.
      </p>

      <div className="mt-10 space-y-10">
        {(topics ?? []).map((topic: Topic) => (
          <section key={topic.id}>
            <h2 className="font-display text-2xl text-lapis">{topic.name}</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {(cardsByTopic.get(topic.id) ?? []).map((card) => (
                <article
                  key={card.id}
                  className="rounded-sm border border-sandstone bg-sandstone/20 p-4"
                >
                  <h3 className="font-display text-lg text-ink">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/80">
                    {card.fact_text}
                  </p>
                  {card.source_note && (
                    <p className="mt-3 text-xs text-ink/50">
                      Source: {card.source_note}
                    </p>
                  )}
                </article>
              ))}
              {(cardsByTopic.get(topic.id) ?? []).length === 0 && (
                <p className="text-sm text-ink/50">
                  No cards seeded for this topic yet.
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
