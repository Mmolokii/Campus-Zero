const GameConfig = {

  // ── Display ────────────────────────────────────────────────────────────────
  width: 960,
  height: 540,

  // ── Player ─────────────────────────────────────────────────────────────────
  player: {
    speed: 200,
    jumpForce: -450,
    maxHealth: 5,
    invincibilityMs: 1000,
    attackCooldown: 400,
    attackRange: 80,
  },

  // ── Enemies ────────────────────────────────────────────────────────────────
  enemy: {
    speed: 80,
    detectionRange: 220,
    damage: 1,
    scoreValue: 100,
    patrolDistance: 150,
  },

  // ── Act 1 — Adventure ──────────────────────────────────────────────────────
  act1: {
    cluesNeeded: 3,        // how many clues to find before weapon appears
    weaponSpawnX: 600,     // where the ruler spawns
    weaponSpawnY: 400,
  },

  // ── Act 2 — Action ─────────────────────────────────────────────────────────
  act2: {
    enemyCount: 6,
    bossHealth: 10,
    pistolDropAt: 3,       // which enemy drops the pistol
  },

  // ── Act 3 — Arcade ─────────────────────────────────────────────────────────
  act3: {
    timeLimit: 60,         // seconds to escape
    obstacleSpeed: 300,
    scorePerEnemy: 150,
    bonusPerSecond: 10,
  },

  // ── Dialogue ───────────────────────────────────────────────────────────────
  // Edit text here without touching scene code
  dialogue: {
    act1: [
      {
        trigger: 'start',
        lines: [
          "It's 8PM. The gates just locked.",
          "Your phone is dead.",
          "The lights went out.",
          "...something moved in the hallway.",
          "You need to find a way out."
        ]
      },
      {
        trigger: 'clue1',
        lines: [
          "The whiteboard still has today's date.",
          "Someone was here very recently."
        ]
      },
      {
        trigger: 'clue2',
        lines: [
          "A half-eaten sandwich on the desk.",
          "They left in a hurry."
        ]
      },
      {
        trigger: 'clue3',
        lines: [
          "A trail of something dark on the floor.",
          "It leads toward the hallway.",
          "You found a ruler. Not much...",
          "...but it's something."
        ]
      },
      {
        trigger: 'weaponFound',
        lines: [
          "You picked up a RULER.",
          "Time to fight your way out."
        ]
      }
    ],
    act2: [
      {
        trigger: 'start',
        lines: [
          "The hallway is crawling with them.",
          "Fight through. Find the exit.",
          "Z to attack. Don't stop moving."
        ]
      },
      {
        trigger: 'pistolDrop',
        lines: [
          "A staple gun! Better than nothing.",
          "Press X to shoot."
        ]
      },
      {
        trigger: 'bossAppear',
        lines: [
          "...Principal Morrison.",
          "What happened to you?",
          "DEFEND YOURSELF!"
        ]
      }
    ],
    act3: [
      {
        trigger: 'start',
        lines: [
          "The gate is open!",
          "RUN! Don't look back!",
          "Get out before it closes!"
        ]
      }
    ]
  }
};

export default GameConfig;