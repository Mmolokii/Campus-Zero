import GameConfig from '../config/GameConfig.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import HUD from '../ui/HUD.js';
import DialogBox from '../ui/DialogBox.js';

export default class Act2Scene extends Phaser.Scene {

  constructor() {
    super({ key: 'Act2Scene' });
  }

  init(data) {
    this.score         = data.score || 0;
    this.enemiesKilled = 0;
    this.gameOver      = false;
    this.actComplete   = false;
    this.bossSpawned   = false;
    this.boss          = null;
  }

  create() {
    const W = GameConfig.width;
    const H = GameConfig.height;
    const worldW = W * 3;

    this.physics.world.setBounds(0, 0, worldW, H);

    // ── Background ────────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a0000, 0x0a0000, 0x1a0000, 0x1a0000, 1);
    bg.fillRect(0, 0, worldW, H);

    // Floor visual
    const floor = this.add.graphics();
    floor.fillStyle(0x1a1a1a, 1);
    floor.fillRect(0, H - 60, worldW, 60);
    floor.lineStyle(2, 0x440000, 1);
    floor.lineBetween(0, H - 60, worldW, H - 60);

    // ── Platforms ─────────────────────────────────────────────────────────────
    this.platforms = this.physics.add.staticGroup();
    this._addPlatform(worldW / 2, H - 30, worldW, 60);
    this._addPlatform(400,  H - 160, 120, 16);
    this._addPlatform(800,  H - 220, 100, 16);
    this._addPlatform(1200, H - 180, 140, 16);
    this._addPlatform(1600, H - 240, 120, 16);
    this._addPlatform(2000, H - 180, 100, 16);
    this._addPlatform(2400, H - 200, 160, 16);

    // ── Bullets group ─────────────────────────────────────────────────────────
    this.bullets = this.physics.add.group();

    // ── Enemies ───────────────────────────────────────────────────────────────
    this.enemies = [];
    const types = ['zombie1', 'zombie2', 'zombie3'];
    const positions = [400, 700, 1000, 1400, 1800, 2200];

    positions.slice(0, GameConfig.act2.enemyCount).forEach((x, i) => {
      const type = types[i % types.length];
      const e = new Enemy(this, x, H - 80, type, false);
      this.physics.add.collider(e.body, this.platforms);
      this.enemies.push(e);
    });

    // ── Player ────────────────────────────────────────────────────────────────
    this.player = new Player(this, 80, H - 120);
    this.player.pickupWeapon('ruler');

    // ── HUD ───────────────────────────────────────────────────────────────────
    this.hud = new HUD(this);

    // ── Dialog ────────────────────────────────────────────────────────────────
    this.dialog = new DialogBox(this);

    // ── Camera ────────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, worldW, H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);

    // ── Collisions ────────────────────────────────────────────────────────────
    this.physics.add.collider(this.player.sprite, this.platforms);

    // ── Decorations ───────────────────────────────────────────────────────────
    this._drawHallway(H, worldW);

    // ── Enemy counter UI ─────────────────────────────────────────────────────
    this.enemyCountText = this.add.text(16, 95, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ff4444',
    }).setScrollFactor(0).setDepth(150);

    // ── Start dialog ──────────────────────────────────────────────────────────
    this.cameras.main.fadeIn(600);
    this.time.delayedCall(800, () => {
      const lines = GameConfig.dialogue.act2.find(
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

    if (!this.dialog.isOpen) {
      this.player.update();
    }

    this.dialog.update();

    // Count living non-boss enemies
    const livingEnemies = this.enemies.filter(
      e => !e.isDead && !e.isBoss
    ).length;

    this.enemyCountText.setText(
      this.bossSpawned
        ? 'DEFEAT THE BOSS!'
        : `Enemies remaining: ${livingEnemies}`
    );

    // Update enemies
    this.enemies.forEach(enemy => {
      if (!enemy.isDead) {
        enemy.update(this.player.x, this.player.y);

        // Enemy touches player
        if (!this.player.isInvincible) {
          const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            enemy.x, enemy.y
          );
          if (dist < 40) {
            this.player.takeDamage(GameConfig.enemy.damage);
          }
        }

        // Player melee attack hits enemy
        if (this.player.isAttacking) {
          const dist = Phaser.Math.Distance.Between(
            this.player.attackHitbox.x,
            this.player.attackHitbox.y,
            enemy.x, enemy.y
          );
          if (dist < 60) {
            const killed = enemy.takeDamage(1);
            if (killed) this._onEnemyKilled(enemy);
          }
        }
      }
    });

    // Bullets vs enemies
    this.bullets.getChildren().forEach(bullet => {
      this.enemies.forEach(enemy => {
        if (!enemy.isDead && bullet.active) {
          const dist = Phaser.Math.Distance.Between(
            bullet.x, bullet.y,
            enemy.x, enemy.y
          );
          if (dist < 40) {
            bullet.destroy();
            const killed = enemy.takeDamage(2);
            if (killed) this._onEnemyKilled(enemy);
          }
        }
      });
    });

    // Spawn boss when all regular enemies are dead
    const allRegularDead = this.enemies.filter(
      e => !e.isBoss
    ).every(e => e.isDead);

    if (allRegularDead && !this.bossSpawned) {
      this._spawnBoss();
    }

    // Complete act when boss is dead
    if (this.bossSpawned && this.boss && this.boss.isDead && !this.actComplete) {
      this._completeAct();
    }

    // Update HUD
    this.hud.update(
      this.player.health,
      GameConfig.player.maxHealth,
      this.score,
      null,
      'ACT 2 — ACTION',
      this.player.weapon
    );
  }

  // ---------------------------------------------------------------------------
  // FIRE BULLET
  // ---------------------------------------------------------------------------
  fireBullet(x, y, facingRight) {
    const bullet = this.add.rectangle(
      x + (facingRight ? 30 : -30),
      y, 12, 6, 0xff8800
    );
    this.physics.add.existing(bullet);
    bullet.body.setAllowGravity(false);
    bullet.body.setImmovable(true);
    bullet.body.setVelocityX(facingRight ? 800 : -800);
    bullet.body.setVelocityY(0);
    this.bullets.add(bullet);

    this.time.delayedCall(1500, () => {
      if (bullet && bullet.active) bullet.destroy();
    });
  }

  // ---------------------------------------------------------------------------
  // ENEMY KILLED
  // ---------------------------------------------------------------------------
  _onEnemyKilled(enemy) {
    this.enemiesKilled++;
    this.score += enemy.scoreValue;
    this.hud.showMessage(`+${enemy.scoreValue}`, '#ffdd00');

    // Drop pistol after killing enough enemies
    if (
      this.enemiesKilled >= GameConfig.act2.pistolDropAt &&
      this.player.weapon === 'ruler'
    ) {
      this._dropPistol(enemy.x, enemy.y);
    }
  }

  // ---------------------------------------------------------------------------
  // DROP PISTOL
  // ---------------------------------------------------------------------------
  _dropPistol(x, y) {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x888888, 1);
    gfx.fillRect(-15, -6, 30, 12);
    gfx.fillRect(-5, -12, 10, 6);
    gfx.setPosition(x, y - 30);

    this.tweens.add({
      targets: gfx,
      y: y - 40,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    const label = this.add.text(x, y - 60, '[ STAPLE GUN — walk over ]', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#888888',
    }).setOrigin(0.5);

    // Check pickup
    const checkPickup = this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        const dist = Phaser.Math.Distance.Between(
          this.player.x, this.player.y, x, y - 30
        );
        if (dist < 60) {
          gfx.destroy();
          label.destroy();
          checkPickup.remove();
          this.player.pickupWeapon('pistol');
          const lines = GameConfig.dialogue.act2.find(
            d => d.trigger === 'pistolDrop'
          ).lines;
          this.dialog.show(lines, 'SYSTEM', null);
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // SPAWN BOSS
  // ---------------------------------------------------------------------------
  _spawnBoss() {
    this.bossSpawned = true;
    const H = GameConfig.height;

    const lines = GameConfig.dialogue.act2.find(
      d => d.trigger === 'bossAppear'
    ).lines;

    this.dialog.show(lines, 'WARNING', () => {
      this.boss = new Enemy(this, 2600, H - 100, 'zombie4', true);
      this.physics.add.collider(this.boss.body, this.platforms);
      this.enemies.push(this.boss);
      this.hud.showMessage('BOSS APPEARED!', '#ff0000');
    });
  }

  // ---------------------------------------------------------------------------
  // COMPLETE ACT
  // ---------------------------------------------------------------------------
  _completeAct() {
    this.actComplete = true;
    this.hud.showMessage('ACT 2 COMPLETE!', '#00ff88');
    this.cameras.main.fade(600, 0, 0, 0);
    this.time.delayedCall(600, () => {
      this.scene.start('Act3Scene', { score: this.score });
    });
  }

  // ---------------------------------------------------------------------------
  // PLAYER DEATH
  // ---------------------------------------------------------------------------
  onPlayerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.hud.showMessage('YOU DIED', '#ff4444');
    this.time.delayedCall(1500, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        act: 2,
        won: false,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  _addPlatform(x, y, w, h) {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x1a1a1a, 1);
    gfx.fillRect(-w/2, -h/2, w, h);
    gfx.lineStyle(2, 0x440000, 0.8);
    gfx.strokeRect(-w/2, -h/2, w, h);
    gfx.setPosition(x, y);

    const zone = this.add.zone(x, y, w, h);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    this.platforms.add(zone);
  }

  _drawHallway(H, worldW) {
    // Lockers
    for (let i = 0; i < 12; i++) {
      const lx = 150 + i * 230;
      const locker = this.add.graphics();
      locker.fillStyle(0x1a2a1a, 1);
      locker.fillRect(-25, -50, 50, 100);
      locker.lineStyle(1, 0x2a4a2a, 1);
      locker.strokeRect(-25, -50, 50, 100);
      locker.fillStyle(0x1a3a1a, 1);
      locker.fillCircle(18, 0, 4);
      locker.setPosition(lx, 80);
    }

    // Blood splatters
    for (let i = 0; i < 8; i++) {
      const sx = Phaser.Math.Between(100, worldW - 100);
      const splat = this.add.graphics();
      splat.fillStyle(0x440000, 0.6);
      splat.fillCircle(0, 0, Phaser.Math.Between(8, 20));
      splat.setPosition(sx, H - 65);
    }

    // Boss arena marker
    const arena = this.add.graphics();
    arena.lineStyle(2, 0x440000, 0.5);
    arena.strokeRect(2300, 0, 500, H);
    arena.setDepth(0);

    this.add.text(2550, 50, '⚠ BOSS ARENA', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#440000',
    }).setOrigin(0.5);

    // Exit sign
    this.add.text(worldW - 100, H - 200, 'EXIT', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#00ff00',
    }).setOrigin(0.5);
  }
}