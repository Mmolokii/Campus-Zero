import GameConfig from '../config/GameConfig.js';
import Player from '../entities/Player.js';
import HUD from '../ui/HUD.js';
import DialogBox from '../ui/DialogBox.js';

export default class Act1Scene extends Phaser.Scene {

  constructor() {
    super({ key: 'Act1Scene' });
  }

  init() {
    this.score         = 0;
    this.cluesFound    = 0;
    this.weaponSpawned = false;
    this.weaponPickedUp = false;
    this.gameOver      = false;
    this.actComplete   = false;
  }

  create() {
    const W = GameConfig.width;
    const H = GameConfig.height;
    const worldW = W * 2;

    this.physics.world.setBounds(0, 0, worldW, H);

    // ── Background ────────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0a0a, 0x0a0a0a, 0x1a0a0a, 0x1a0a0a, 1);
    bg.fillRect(0, 0, worldW, H);

    // ── Floor visual ──────────────────────────────────────────────────────────
    const floor = this.add.graphics();
    floor.fillStyle(0x1a1a1a, 1);
    floor.fillRect(0, H - 60, worldW, 60);
    floor.lineStyle(2, 0x333333, 1);
    floor.lineBetween(0, H - 60, worldW, H - 60);

    // ── Platforms ─────────────────────────────────────────────────────────────
    this.platforms = this.physics.add.staticGroup();
    this._addFloor(worldW / 2, H - 30, worldW, 60);

    // ── Decorations ───────────────────────────────────────────────────────────
    this._drawClassroom(W, H, worldW);

    // ── Clues ─────────────────────────────────────────────────────────────────
    this.clues = [];
    this._spawnClue(300,  H - 100, 'clue1', '📋 Whiteboard');
    this._spawnClue(700,  H - 100, 'clue2', '🥪 Sandwich');
    this._spawnClue(1200, H - 100, 'clue3', '🔦 Dark stain');

    // ── Player ────────────────────────────────────────────────────────────────
    this.player = new Player(this, 80, H - 120);

    // ── Collisions ────────────────────────────────────────────────────────────
    this.physics.add.collider(this.player.sprite, this.platforms);

    // ── HUD ───────────────────────────────────────────────────────────────────
    this.hud = new HUD(this);

    // ── Dialog ────────────────────────────────────────────────────────────────
    this.dialog = new DialogBox(this);

    // ── Camera ────────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, worldW, H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.fadeIn(600);

    // ── Interaction key ───────────────────────────────────────────────────────
    // Use E key to interact with clues — avoids conflict with attack key
    this.interactKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.E
    );

    // ── Interaction prompt ────────────────────────────────────────────────────
    this.prompt = this.add.text(0, 0, '[E] Examine', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#00ffff',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 },
    }).setDepth(99).setVisible(false);

    // ── Start dialog ──────────────────────────────────────────────────────────
    this.time.delayedCall(800, () => {
      const lines = GameConfig.dialogue.act1.find(
        d => d.trigger === 'start'
      ).lines;
      this.dialog.show(lines, 'SYSTEM', null);
    });
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------
  update() {
    if (this.gameOver || this.actComplete) return;

    // Only update player when dialog is closed
    if (!this.dialog.isOpen) {
      this.player.update();
    }

    this.dialog.update();

    // Find nearest clue
    let nearestClue = null;
    let nearestDist = 999;

    this.clues.forEach(clue => {
      if (!clue.collected) {
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y,
          clue.x, clue.y
        );
        if (dist < 80 && dist < nearestDist) {
          nearestDist = dist;
          nearestClue = clue;
        }
      }
    });

    // Show interact prompt near clue
    if (nearestClue && !this.dialog.isOpen) {
      this.prompt.setPosition(nearestClue.x - 40, nearestClue.y - 55);
      this.prompt.setVisible(true);

      // Press E to collect
      if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
        this._collectClue(nearestClue);
      }
    } else {
      this.prompt.setVisible(false);
    }

    // Check weapon pickup
    if (this.weaponSpawned && !this.weaponPickedUp && !this.dialog.isOpen) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        this.weaponX, this.weaponY
      );
      if (dist < 60) {
        this._pickupWeapon();
      }
    }

    // Update HUD
    this.hud.update(
      this.player.health,
      GameConfig.player.maxHealth,
      this.score,
      null,
      'ACT 1 — ADVENTURE',
      this.player.weapon
    );
  }

  // ---------------------------------------------------------------------------
  // COLLECT CLUE
  // ---------------------------------------------------------------------------
  _collectClue(clue) {
    clue.collected = true;
    clue.gfx.destroy();
    clue.labelText.destroy();
    this.cluesFound++;

    const cfg = GameConfig.dialogue.act1.find(
      d => d.trigger === clue.trigger
    );

    this.dialog.show(cfg.lines, 'OBSERVATION', () => {
      if (this.cluesFound >= GameConfig.act1.cluesNeeded && !this.weaponSpawned) {
        this._spawnWeapon();
      }
    });

    this.hud.showMessage(
      `Clue ${this.cluesFound}/${GameConfig.act1.cluesNeeded} found!`,
      '#44ff88'
    );
  }

  // ---------------------------------------------------------------------------
  // SPAWN WEAPON
  // ---------------------------------------------------------------------------
  _spawnWeapon() {
    this.weaponSpawned = true;
    this.weaponX = GameConfig.act1.weaponSpawnX;
    this.weaponY = GameConfig.act1.weaponSpawnY;

    this.weaponGfx = this.add.graphics();
    this.weaponGfx.fillStyle(0xffff00, 1);
    this.weaponGfx.fillRect(-20, -4, 40, 8);
    this.weaponGfx.setPosition(this.weaponX, this.weaponY);

    this.tweens.add({
      targets: this.weaponGfx,
      y: this.weaponY - 10,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    this.weaponLabel = this.add.text(
      this.weaponX, this.weaponY - 30,
      '[ RULER — walk over to pick up ]', {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffff00',
      }
    ).setOrigin(0.5);

    this.hud.showMessage('A weapon appeared nearby!', '#ffff00');
  }

  // ---------------------------------------------------------------------------
  // PICKUP WEAPON
  // ---------------------------------------------------------------------------
  _pickupWeapon() {
    this.weaponPickedUp = true;
    this.weaponGfx.destroy();
    this.weaponLabel.destroy();
    this.player.pickupWeapon('ruler');

    const lines = GameConfig.dialogue.act1.find(
      d => d.trigger === 'weaponFound'
    ).lines;

    this.dialog.show(lines, 'SYSTEM', () => {
      this._completeAct();
    });
  }

  // ---------------------------------------------------------------------------
  // COMPLETE ACT
  // ---------------------------------------------------------------------------
  _completeAct() {
    this.actComplete = true;
    this.hud.showMessage('ACT 1 COMPLETE!', '#00ff88');
    this.cameras.main.fade(600, 0, 0, 0);
    this.time.delayedCall(600, () => {
      this.scene.start('Act2Scene', { score: this.score });
    });
  }

  // ---------------------------------------------------------------------------
  // PLAYER DEATH
  // ---------------------------------------------------------------------------
  onPlayerDeath() {
    this.gameOver = true;
    this.hud.showMessage('YOU DIED', '#ff4444');
    this.time.delayedCall(1500, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        act: 1,
        won: false,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  _spawnClue(x, y, trigger, label) {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x00aaff, 0.8);
    gfx.fillCircle(0, 0, 14);
    gfx.lineStyle(2, 0x00ffff, 1);
    gfx.strokeCircle(0, 0, 14);
    gfx.setPosition(x, y);

    this.tweens.add({
      targets: gfx,
      y: y - 8,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.inOut',
    });

    const labelText = this.add.text(x, y - 30, label, {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#00ffff',
    }).setOrigin(0.5);

    this.clues.push({
      x, y, trigger, gfx,
      labelText,
      collected: false
    });
  }

  _addFloor(x, y, w, h) {
    const zone = this.add.zone(x, y, w, h);
    this.physics.world.enable(
      zone, Phaser.Physics.Arcade.STATIC_BODY
    );
    this.platforms.add(zone);
  }

  _drawClassroom(W, H, worldW) {
    // Desks
    for (let i = 0; i < 8; i++) {
      const dx = 200 + i * 220;
      const desk = this.add.graphics();
      desk.fillStyle(0x2a1a0a, 1);
      desk.fillRect(-30, -20, 60, 40);
      desk.lineStyle(1, 0x4a3a2a, 1);
      desk.strokeRect(-30, -20, 60, 40);
      desk.setPosition(dx, H - 120);
    }

    // Windows
    for (let i = 0; i < 4; i++) {
      const wx = 300 + i * 400;
      const win = this.add.graphics();
      win.fillStyle(0x001133, 0.8);
      win.fillRect(-30, -50, 60, 100);
      win.lineStyle(2, 0x334455, 1);
      win.strokeRect(-30, -50, 60, 100);
      win.setPosition(wx, 100);
    }

    // Exit door
    const door = this.add.graphics();
    door.fillStyle(0x4a2a0a, 1);
    door.fillRect(-20, -60, 40, 120);
    door.lineStyle(2, 0xaa6622, 1);
    door.strokeRect(-20, -60, 40, 120);
    door.setPosition(worldW - 100, H - 120);

    this.add.text(worldW - 100, H - 200, 'EXIT →', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#666666',
    }).setOrigin(0.5);
  }
}