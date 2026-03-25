import GameConfig from '../config/GameConfig.js';

export default class MenuScene extends Phaser.Scene {

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const W = GameConfig.width;
    const H = GameConfig.height;

    // ── Background ─────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000000, 0x000000, 0x0a0a0a, 0x1a0000, 1);
    bg.fillRect(0, 0, W, H);

    // Flickering light effect
    const flicker = this.add.rectangle(W/2, H/2, W, H, 0xff0000, 0.03);
    this.tweens.add({
      targets: flicker,
      alpha: { from: 0.03, to: 0.08 },
      duration: 200,
      yoyo: true,
      repeat: -1,
    });

    // ── Title ───────────────────────────────────────────────────────────────
    const title = this.add.text(W/2, 120, 'CAMPUS ZERO', {
      fontFamily: 'monospace',
      fontSize: '64px',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setAlpha(0);

    const subtitle = this.add.text(W/2, 190, '"You thought it was just another Monday."', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#666666',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);

    // ── Act badges ──────────────────────────────────────────────────────────
    const acts = [
      { label: 'ACT 1',  cat: 'ADVENTURE', desc: 'Explore & survive',  color: 0x44ff88 },
      { label: 'ACT 2',  cat: 'ACTION',    desc: 'Fight your way out', color: 0xff4444 },
      { label: 'ACT 3',  cat: 'ARCADE',    desc: 'Sprint to freedom',  color: 0xffdd00 },
    ];

    acts.forEach((act, i) => {
      const bx = W/2 + (i - 1) * 240;
      const by = 300;

      const gfx = this.add.graphics();
      gfx.fillStyle(act.color, 0.08);
      gfx.fillRect(bx - 90, by - 30, 180, 60);
      gfx.lineStyle(1, act.color, 0.5);
      gfx.strokeRect(bx - 90, by - 30, 180, 60);

      this.add.text(bx, by - 12, act.label, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#' + act.color.toString(16).padStart(6, '0'),
      }).setOrigin(0.5);

      this.add.text(bx, by + 6, act.cat, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#888888',
      }).setOrigin(0.5);

      this.add.text(bx, by + 22, act.desc, {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#444444',
      }).setOrigin(0.5);
    });

    // ── Start button ────────────────────────────────────────────────────────
    const btnY = 420;
    const btnGfx = this.add.graphics();

    const drawBtn = (hover) => {
      btnGfx.clear();
      btnGfx.fillStyle(hover ? 0x440000 : 0x1a0000, 1);
      btnGfx.fillRect(W/2 - 120, btnY - 25, 240, 50);
      btnGfx.lineStyle(2, hover ? 0xff0000 : 0x660000, 1);
      btnGfx.strokeRect(W/2 - 120, btnY - 25, 240, 50);
    };
    drawBtn(false);

    this.add.text(W/2, btnY, '[ BEGIN ]', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ff4444',
    }).setOrigin(0.5);

    const hit = this.add.rectangle(W/2, btnY, 240, 50, 0xffffff, 0)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => drawBtn(true));
    hit.on('pointerout',  () => drawBtn(false));
    hit.on('pointerdown', () => {
      this.cameras.main.fade(500, 0, 0, 0);
      this.time.delayedCall(500, () => {
        this.scene.start('Act1Scene');
      });
    });

    // ── Controls ────────────────────────────────────────────────────────────
    this.add.text(W/2, H - 40, 'Arrow keys / WASD — Move     SPACE — Jump     Z — Attack     X — Shoot', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#333333',
    }).setOrigin(0.5);

    // ── Entrance animations ──────────────────────────────────────────────────
    this.tweens.add({
      targets: title,
      alpha: 1,
      y: { from: 80, to: 120 },
      duration: 800,
      ease: 'Back.out',
    });

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 1000,
      delay: 600,
    });
  }
}
