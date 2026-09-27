"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { getOrCreatePlayerId } from "@/lib/player";
import type { KnowledgeCard } from "@/lib/types";

// Phaser touches `window`, so the game component must never render on the
// server. ssr:false is what makes that safe inside Next.js.
const PhaserGame = dynamic(() => import("@/game/PhaserGame"), { ssr: false });

export default function PlayPage() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [cards, setCards] = useState<KnowledgeCard[]>([]);
  const [discovered, setDiscovered] = useState<KnowledgeCard[]>([]);
  const [dialogueOpen, setDialogueOpen] = useState(false);
  const [allFound, setAllFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function setup() {
      try {
        const id = await getOrCreatePlayerId();
        setPlayerId(id);

        const { data, error } = await supabase
          .from("knowledge_cards")
          .select("*")
          .order("created_at")
          .limit(6);

        if (error) throw error;
        setCards(data ?? []);
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Could not load the game."
        );
      }
    }
    setup();
  }, []);

  async function handleDiscover(card: KnowledgeCard) {
    setDiscovered((prev) => [...prev, card]);

    if (!playerId) return;
    // upsert so re-visiting the same card (e.g. after a refresh) never
    // throws a duplicate primary-key error.
    await supabase
      .from("player_cards")
      .upsert(
        { player_id: playerId, card_id: card.id },
        { onConflict: "player_id,card_id" }
      );
  }

  if (loadError) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-clay">
          {loadError} — check your <code>.env.local</code> and that{" "}
          <code>supabase/schema.sql</code> has been run.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/" className="text-sm text-lapis hover:underline">
        ← Back
      </Link>
      <h1 className="mt-2 font-display text-3xl text-ink">
        Explore Mohenjo-daro
      </h1>
      <p className="mt-1 text-sm text-ink/70">
        Arrow keys (or the on-screen d-pad on mobile) to move. Walk over the
        glowing markers to discover knowledge cards. Stand near the Elder
        and press SPACE (or tap near them) to talk.
      </p>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <span className="rounded-sm bg-sandstone/40 px-3 py-1 text-ink">
          Cards found: {discovered.length}/{cards.length || "…"}
        </span>
        {allFound && (
          <Link
            href="/quiz"
            className="rounded-sm bg-lapis px-3 py-1 text-bone hover:bg-lapis/90"
          >
            All cards found — take the quiz →
          </Link>
        )}
      </div>

      <div className="mt-4">
        {cards.length > 0 ? (
          <PhaserGame
            cards={cards}
            onDiscover={handleDiscover}
            onAllFound={() => setAllFound(true)}
            onTalkNpc={() => setDialogueOpen(true)}
          />
        ) : (
          <p className="text-ink/60">Loading the site…</p>
        )}
      </div>

      {dialogueOpen && (
        <div className="mt-4 rounded-sm border border-lapis bg-lapis/10 p-4">
          <p className="font-display text-lapis">Elder</p>
          <p className="mt-1 text-sm text-ink/80">
            &ldquo;Four truths of this city lie scattered among these ruins.
            Find them, traveller, and I will test what you&apos;ve
            learned.&rdquo;
          </p>
          <button
            onClick={() => setDialogueOpen(false)}
            className="mt-3 rounded-sm bg-lapis px-4 py-1.5 text-sm text-bone hover:bg-lapis/90"
          >
            Close
          </button>
        </div>
      )}

      {discovered.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-lg text-ink">Discovered so far</h2>
          <ul className="mt-2 space-y-2">
            {discovered.map((card) => (
              <li
                key={card.id}
                className="rounded-sm border border-sandstone bg-sandstone/20 p-3 text-sm"
              >
                <span className="font-semibold text-ink">{card.title}</span>
                <span className="text-ink/70"> — {card.fact_text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
