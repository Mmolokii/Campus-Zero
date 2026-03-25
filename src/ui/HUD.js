import GameConfig from '../config/GameConfig.js';

export default class HUD {

  constructor(scene) {
    this.scene = scene;
    const W = GameConfig.width;
    const D = 150;

    // ── Health bar ───────────────────────────────────────────────────────────
    this.healthLbl = scene.add.text(16, 12, 'HP', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#aaaaaa',
    }).setScrollFactor(0).setDepth(D);

    this.healthBg = scene.add.graphics().setScrollFactor(0).setDepth(D);
    this.healthBar = scene.add.graphics().setScrollFactor(0).setDepth(D);

    // ── Score ────────────────────────────────────────────────────────────────
    this.scoreLbl = scene.add.text(16, 50, 'SCORE', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#aaaaaa',
    }).setScrollFactor(0).setDepth(D);

    this.scoreVal = scene.add.text(16, 62, '000000', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffffff',
    }).setScrollFactor(0).setDepth(D);

    // ── Timer ────────────────────────────────────────────────────────────────
    this.timerLbl = scene.add.text(W/2, 12, 'TIME', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D);

    this.timerVal = scene.add.text(W/2, 24, '--', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(D);

    // ── Act label ────────────────────────────────────────────────────────────
    this.actLbl = scene.add.text(W - 16, 12, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#555555',
      align: 'right',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(D);

    // ── Weapon indicator ─────────────────────────────────────────────────────
    this.weaponLbl = scene.add.text(W - 16, 30, 'NO WEAPON', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#444444',
      align: 'right',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(D);

    // ── Message banner ───────────────────────────────────────────────────────
    this.banner = scene.add.text(W/2, 180, '', {
      fontFamily: 'monospace',
      fontSize: '28px',
      color: '#ffff00',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(D + 1).setAlpha(0);
  }

  // ---------------------------------------------------------------------------
  // UPDATE — call every frame
  // ---------------------------------------------------------------------------
  update(health, maxHealth, score, timeLeft, actLabel, weapon) {

    // Health bar
    this.healthBg.clear();
    this.healthBg.fillStyle(0x333333, 1);
    this.healthBg.fillRect(16, 26, 150, 16);

    this.healthBar.clear();
    const pct = Math.max(0, health / maxHealth);
    const color = pct > 0.5 ? 0x00ff00 : pct > 0.25 ? 0xffaa00 : 0xff0000;
    this.healthBar.fillStyle(color, 1);
    this.healthBar.fillRect(16, 26, 150 * pct, 16);

    // Score
    this.scoreVal.setText(score.toString().padStart(6, '0'));

    // Timer
    if (timeLeft !== null) {
      this.timerVal.setText(Math.ceil(timeLeft).toString());
      this.timerVal.setColor(timeLeft < 15 ? '#ff4444' : '#ffffff');
    } else {
      this.timerVal.setText('--');
    }

    // Act label
    this.actLbl.setText(actLabel);

    // Weapon
    this.weaponLbl.setText(weapon || 'NO WEAPON');
    this.weaponLbl.setColor(weapon ? '#ffffff' : '#444444');
  }

  // ---------------------------------------------------------------------------
  // SHOW MESSAGE — brief on screen feedback
  // ---------------------------------------------------------------------------
  showMessage(text, color = '#ffff00') {
    this.banner.setText(text).setColor(color).setAlpha(1);
    this.scene.tweens.add({
      targets: this.banner,
      alpha: 0,
      y: this.banner.y - 30,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => { this.banner.setY(180); }
    });
  }

  destroy() {
    [
      this.healthLbl, this.healthBg, this.healthBar,
      this.scoreLbl, this.scoreVal,
      this.timerLbl, this.timerVal,
      this.actLbl, this.weaponLbl,
      this.banner
    ].forEach(o => o.destroy());
  }
}