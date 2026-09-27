import Phaser from "phaser";
import type { KnowledgeCard } from "../../lib/types";

export type SceneOptions = {
  cards: KnowledgeCard[];
  onDiscover: (card: KnowledgeCard) => void;
  onAllFound: () => void;
  onTalkNpc: () => void;
};

// Fixed spots in the 800x480 world where knowledge cards spawn.
const CARD_POSITIONS: [number, number][] = [
  [140, 100],
  [660, 100],
  [140, 380],
  [660, 380],
  [250, 240],
  [550, 240],
];

const NPC_POS = { x: 400, y: 260 };
const PLAYER_START = { x: 400, y: 420 };
const NPC_TALK_RADIUS = 55;

export default class HarappaScene extends Phaser.Scene {
  private cards: KnowledgeCard[];
  private onDiscover: (card: KnowledgeCard) => void;
  private onAllFound: () => void;
  private onTalkNpc: () => void;

  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private talkPrompt!: Phaser.GameObjects.Text;
  private cardSprites: Phaser.Physics.Arcade.Sprite[] = [];
  private foundCount = 0;
  private totalCards = 0;
  private touchState = { up: false, down: false, left: false, right: false };
  private isNearNpc = false;

  // Called from the React d-pad overlay on mobile — pointer down/up
  // toggles a direction, read in update() alongside the keyboard cursors.
  setTouchDirection(dir: "up" | "down" | "left" | "right", pressed: boolean) {
    this.touchState[dir] = pressed;
  }

  // Called from the React "Talk" button on mobile, where there's no
  // SPACE key to press. Only actually talks if the player is close
  // enough — same rule as the keyboard path.
  attemptTalk() {
    if (this.isNearNpc) this.onTalkNpc();
  }

  constructor(options: SceneOptions) {
    super("HarappaScene");
    this.cards = options.cards;
    this.onDiscover = options.onDiscover;
    this.onAllFound = options.onAllFound;
    this.onTalkNpc = options.onTalkNpc;
  }

  preload() {
    // No sprite sheets to load — generate simple circular textures at
    // runtime. Keeps the whole scene dependency-free and fast to boot.
    this.makeCircleTexture("player-tex", 0x28415f, 26);
    this.makeCircleTexture("card-tex", 0xc9a876, 18);
  }

  private makeCircleTexture(key: string, color: number, size: number) {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillCircle(size / 2, size / 2, size / 2);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  create() {
    this.add.rectangle(400, 240, 800, 480, 0xede6d6);

    // Placeholder "Great Bath" structure — swap for a real tileset later.
    this.add
      .rectangle(400, 240, 170, 110, 0xc9a876)
      .setStrokeStyle(2, 0x241e18);
    this.add
      .text(400, 240, "Great Bath", {
        fontSize: "13px",
        color: "#241E18",
      })
      .setOrigin(0.5);

    // NPC
    this.add.circle(NPC_POS.x, NPC_POS.y, 17, 0xa6432d);
    this.add
      .text(NPC_POS.x, NPC_POS.y - 32, "Elder", {
        fontSize: "12px",
        color: "#241E18",
      })
      .setOrigin(0.5);

    this.talkPrompt = this.add
      .text(NPC_POS.x, NPC_POS.y + 30, "Press SPACE to talk", {
        fontSize: "11px",
        color: "#28415F",
      })
      .setOrigin(0.5)
      .setVisible(false);

    // Player
    this.player = this.physics.add.sprite(
      PLAYER_START.x,
      PLAYER_START.y,
      "player-tex"
    );
    this.player.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, 800, 480);

    // Knowledge cards
    const usableCards = this.cards.slice(0, CARD_POSITIONS.length);
    this.totalCards = usableCards.length;

    usableCards.forEach((card, i) => {
      const [x, y] = CARD_POSITIONS[i];
      const sprite = this.physics.add.sprite(x, y, "card-tex");
      sprite.setData("card", card);
      this.cardSprites.push(sprite);

      this.physics.add.overlap(this.player, sprite, () => {
        this.collectCard(sprite);
      });
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.spaceKey = this.input.keyboard!.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
  }

  private collectCard(sprite: Phaser.Physics.Arcade.Sprite) {
    if (!sprite.active) return;
    const card = sprite.getData("card") as KnowledgeCard;
    sprite.destroy();
    this.foundCount += 1;
    this.onDiscover(card);

    if (this.foundCount >= this.totalCards) {
      this.onAllFound();
    }
  }

  update() {
    const speed = 170;
    this.player.setVelocity(0);

    const left = this.cursors.left?.isDown || this.touchState.left;
    const right = this.cursors.right?.isDown || this.touchState.right;
    const up = this.cursors.up?.isDown || this.touchState.up;
    const down = this.cursors.down?.isDown || this.touchState.down;

    if (left) this.player.setVelocityX(-speed);
    else if (right) this.player.setVelocityX(speed);

    if (up) this.player.setVelocityY(-speed);
    else if (down) this.player.setVelocityY(speed);

    const dist = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      NPC_POS.x,
      NPC_POS.y
    );
    const nearNpc = dist < NPC_TALK_RADIUS;
    this.isNearNpc = nearNpc;
    this.talkPrompt.setVisible(nearNpc);

    if (nearNpc && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.onTalkNpc();
    }
  }
}
