"use client";
import { useEffect, useRef } from "react";
import type Phaser from "phaser";
import type HarappaSceneType from "./scenes/HarappaScene";
import type { KnowledgeCard } from "../lib/types";

type Props = {
  cards: KnowledgeCard[];
  onDiscover: (card: KnowledgeCard) => void;
  onAllFound: () => void;
  onTalkNpc: () => void;
};

type Direction = "up" | "down" | "left" | "right";

// Phaser sirf browser me chal sakta hai (canvas/DOM use karta hai), isliye
// yeh saara code dynamic import ke andar hai — SSR ke waqt yeh file
// evaluate hi nahi hoti server pe.
export default function PhaserGame({
  cards,
  onDiscover,
  onAllFound,
  onTalkNpc,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const sceneRef = useRef<HarappaSceneType | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const [{ default: Phaser }, { default: HarappaScene }] =
        await Promise.all([import("phaser"), import("./scenes/HarappaScene")]);

      if (cancelled || !containerRef.current) return;

      const scene = new HarappaScene({ cards, onDiscover, onAllFound, onTalkNpc });
      sceneRef.current = scene;

      gameRef.current = new Phaser.Game({
        type: Phaser.AUTO,
        width: 800,
        height: 480,
        parent: containerRef.current,
        backgroundColor: "#EDE6D6",
        physics: {
          default: "arcade",
          arcade: { debug: false },
        },
        // FIT scales the canvas down to whatever width the container
        // actually has (phone screens included) while keeping the 800x480
        // aspect ratio — without this the canvas just overflows on mobile.
        scale: {
          mode: Phaser.Scale.FIT,
          autoCenter: Phaser.Scale.CENTER_BOTH,
          width: 800,
          height: 480,
        },
        scene,
      });
    }

    boot();

    return () => {
      cancelled = true;
      gameRef.current?.destroy(true);
      gameRef.current = null;
      sceneRef.current = null;
    };
    // Intentionally empty deps — cards/callbacks are captured once at boot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function press(dir: Direction, pressed: boolean) {
    sceneRef.current?.setTouchDirection(dir, pressed);
  }

  // pointer handlers cover both touch and mouse, and firing on both
  // down and up (not just tap) is what makes holding a button move
  // the player continuously.
  function dpadButton(dir: Direction, label: string) {
    return (
      <button
        onPointerDown={() => press(dir, true)}
        onPointerUp={() => press(dir, false)}
        onPointerLeave={() => press(dir, false)}
        className="flex h-12 w-12 items-center justify-center rounded-sm border border-sandstone bg-sandstone/30 text-lg text-ink active:bg-sandstone/50"
        aria-label={`Move ${dir}`}
      >
        {label}
      </button>
    );
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="relative aspect-[5/3] w-full max-w-[800px] overflow-hidden rounded-sm border border-sandstone"
      />
      {/* Touch controls — only needed where there's no keyboard */}
      <div className="mt-3 flex items-end gap-6 sm:hidden">
        <div className="grid w-32 grid-cols-3 grid-rows-3 gap-1">
          <div />
          {dpadButton("up", "↑")}
          <div />
          {dpadButton("left", "←")}
          <div />
          {dpadButton("right", "→")}
          <div />
          {dpadButton("down", "↓")}
          <div />
        </div>
        <button
          onClick={() => sceneRef.current?.attemptTalk()}
          className="h-12 rounded-sm border border-lapis bg-lapis/20 px-4 text-sm text-lapis active:bg-lapis/30"
        >
          Talk
        </button>
      </div>
    </div>
  );
}
