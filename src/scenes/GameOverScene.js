import GameConfig from '../config/GameConfig.js';

export default class GameOverScene extends Phaser.Scene {

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data) {
    this.won   = data.won   || false;
    this.score = data.score || 0;
    this.act   = data.act   || 1;
  }

  create() {
    const W = GameConfig.width;
    const H = GameConfig.height;

    this.cameras.main.fadeIn(500);

    // ── Background ────────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 1);
    bg.fillRect(0, 0, W, H);

    // Scanlines effect
    for (let y = 0; y < H; y += 4) {
      bg.lineStyle(1, 0x111111, 0.5);
      bg.lineBetween(0, y, W, y);
    }

    // ── Result ────────────────────────────────────────────────────────────────
    const resultText  = this.won ? 'YOU ESCAPED!' : 'GAME OVER';
    const resultColor = this.won ? '#00ff88'      : '#ff0000';

    const result = this.add.text(W/2, 90, resultText, {
      fontFamily: 'monospace',
      fontSize: '56px',
      color: resultColor,
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setAlpha(0);

    // Act reached
    this.add.text(W/2, 160, `Reached: Act ${this.act}`, {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#555555',
    }).setOrigin(0.5);

    // ── Score ─────────────────────────────────────────────────────────────────
    this.add.text(W/2, 210, 'FINAL SCORE', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#888888',
    }).setOrigin(0.5);

    const scoreText = this.add.text(W/2, 255, '000000', {
      fontFamily: 'monospace',
      fontSize: '60px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Count up animation
    let displayed = 0;
    const target = this.score;
    const step = Math.max(1, Math.floor(target / 60));
    this.time.addEvent({
      delay: 16,
      repeat: 80,
      callback: () => {
        displayed = Math.min(displayed + step, target);
        scoreText.setText(displayed.toString().padStart(6, '0'));
      }
    });

    // ── Act summary ───────────────────────────────────────────────────────────
    const acts = [
      { num: 1, label: 'ACT 1', cat: 'ADVENTURE', color: '#44ff88',
        done: this.act >= 1 },
      { num: 2, label: 'ACT 2', cat: 'ACTION',    color: '#ff4444',
        done: this.act >= 2 },
      { num: 3, label: 'ACT 3', cat: 'ARCADE',    color: '#ffdd00',
        done: this.act >= 3 },
    ];

    acts.forEach((act, i) => {
      const ax = W/2 + (i - 1) * 220;
      const ay = 370;

      const gfx = this.add.graphics();
      gfx.fillStyle(act.done ? 0x111111 : 0x000000, 1);
      gfx.fillRect(ax - 80, ay - 30, 160, 60);
      gfx.lineStyle(1, act.done ? 0x444444 : 0x222222, 1);
      gfx.strokeRect(ax - 80, ay - 30, 160, 60);

      this.add.text(ax, ay - 12, act.label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: act.done ? act.color : '#333333',
      }).setOrigin(0.5);

      this.add.text(ax, ay + 8, act.cat, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: act.done ? '#666666' : '#222222',
      }).setOrigin(0.5);

      // Checkmark if completed
      if (act.done) {
        this.add.text(ax + 60, ay - 20, '✓', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: act.color,
        }).setOrigin(0.5);
      }
    });

    // ── Buttons ───────────────────────────────────────────────────────────────
    this._makeButton(W/2 - 130, 460, 'RETRY ACT ' + this.act, () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        const scenes = ['Act1Scene', 'Act2Scene', 'Act3Scene'];
        this.scene.start(scenes[this.act - 1], { score: 0 });
      });
    });

    this._makeButton(W/2 + 130, 460, 'MAIN MENU', () => {
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('MenuScene');
      });
    });

    // ── Entrance animation ────────────────────────────────────────────────────
    this.tweens.add({
      targets: result,
      alpha: 1,
      y: { from: 50, to: 90 },
      duration: 700,
      ease: 'Back.out',
      delay: 300,
    });

    // ── Win celebration ───────────────────────────────────────────────────────
    if (this.won) {
      this._celebrate(W, H);
    } else {
      // Flicker effect for game over
      this.tweens.add({
        targets: result,
        alpha: 0.3,
        duration: 150,
        yoyo: true,
        repeat: 5,
        delay: 1000,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // BUTTON HELPER
  // ---------------------------------------------------------------------------
  _makeButton(x, y, label, callback) {
    const bw = 220, bh = 46;
    const bg = this.add.graphics();

    const draw = (hover) => {
      bg.clear();
      bg.fillStyle(hover ? 0x1a1a1a : 0x0a0a0a, 1);
      bg.fillRect(x - bw/2, y - bh/2, bw, bh);
      bg.lineStyle(2, hover ? 0xffffff : 0x333333, 1);
      bg.strokeRect(x - bw/2, y - bh/2, bw, bh);
    };
    draw(false);

    this.add.text(x, y, label, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const hit = this.add.rectangle(x, y, bw, bh, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerover',  () => draw(true));
    hit.on('pointerout',   () => draw(false));
    hit.on('pointerdown',  callback);
  }

  // ---------------------------------------------------------------------------
  // WIN CELEBRATION
  // ---------------------------------------------------------------------------
  _celebrate(W, H) {
    for (let i = 0; i < 50; i++) {
      const dot = this.add.graphics();
      dot.fillStyle(Phaser.Display.Color.RandomRGB().color, 1);
      dot.fillCircle(0, 0, Phaser.Math.Between(3, 8));
      dot.setPosition(W/2, H/2);

      this.tweens.add({
        targets: dot,
        x: W/2 + Phaser.Math.Between(-W/2, W/2),
        y: H/2 + Phaser.Math.Between(-H/2, H/2),
        alpha: 0,
        duration: Phaser.Math.Between(800, 2000),
        delay: Phaser.Math.Between(0, 500),
        ease: 'Power2',
      });
    }
  }
}