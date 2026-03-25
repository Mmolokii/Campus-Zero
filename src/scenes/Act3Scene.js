import GameConfig from '../config/GameConfig.js';
import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import HUD from '../ui/HUD.js';
import DialogBox from '../ui/DialogBox.js';

export default class Act3Scene extends Phaser.Scene {

  constructor() {
    super({ key: 'Act3Scene' });
  }

  init(data) {
    this.score       = data.score || 0;
    this.timeLeft    = GameConfig.act3.timeLimit;
    this.gameOver    = false;
    this.actComplete = false;
    this.obstacles   = [];
    this.zombies     = [];
  }

  create() {
    const W = GameConfig.width;
    const H = GameConfig.height;
    const worldW = W * 4;

    this.physics.world.setBounds(0, 0, worldW, H);

    // ── Background ────────────────────────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x000000, 0x000000, 0x0a0a00, 0x0a0a00, 1);
    bg.fillRect(0, 0, worldW, H);

    // Ground
    const ground = this.add.graphics();
    ground.fillStyle(0x1a1a00, 1);
    ground.fillRect(0, H - 60, worldW, 60);
    ground.lineStyle(2, 0x444400, 1);
    ground.lineBetween(0, H - 60, worldW, H - 60);

    // ── Platforms ─────────────────────────────────────────────────────────────
    this.platforms = this.physics.add.staticGroup();
    this._addPlatform(worldW / 2, H - 30, worldW, 60);

    const platPositions = [
      [400,  H - 160, 100], [800,  H - 180, 80],
      [1200, H - 160, 120], [1600, H - 200, 100],
      [2000, H - 160, 80],  [2400, H - 180, 100],
      [2800, H - 160, 120], [3200, H - 200, 80],
    ];
    platPositions.forEach(([x, y, w]) => {
      this._addPlatform(x, y, w, 16);
    });

    // ── Obstacles ─────────────────────────────────────────────────────────────
    this._spawnObstacles(H, worldW);

    // ── Collectibles ──────────────────────────────────────────────────────────
    this.collectibles = this.physics.add.staticGroup();
    this._spawnCollectibles(H, worldW);

    // ── Zombies ───────────────────────────────────────────────────────────────
    this._spawnZombies(H, worldW);

    // ── Player ────────────────────────────────────────────────────────────────
    this.player = new Player(this, 80, H - 120);
    this.player.pickupWeapon('pistol');

    // ── Bullets ───────────────────────────────────────────────────────────────
    this.bullets = this.physics.add.group();

    // ── HUD ───────────────────────────────────────────────────────────────────
    this.hud = new HUD(this);

    // ── Dialog ────────────────────────────────────────────────────────────────
    this.dialog = new DialogBox(this);

    // ── Camera ────────────────────────────────────────────────────────────────
    this.cameras.main.setBounds(0, 0, worldW, H);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);

    // ── Collisions ────────────────────────────────────────────────────────────
    this.physics.add.collider(this.player.sprite, this.platforms);

    this.physics.add.overlap(
      this.player.sprite,
      this.collectibles,
      (p, item) => {
        item.destroy();
        this.score += GameConfig.act3.scorePerEnemy;
        this.hud.showMessage(`+${GameConfig.act3.scorePerEnemy}`, '#ffdd00');
      }
    );

    // ── Exit gate ─────────────────────────────────────────────────────────────
    this.exitX = worldW - 150;
    this.exitY = H - 100;
    this._drawExit();

    // ── Timer ─────────────────────────────────────────────────────────────────
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        this.timeLeft--;
        if (this.timeLeft <= 0) {
          this.timeLeft = 0;
          this.onPlayerDeath();
        }
      }
    });

    // ── Start dialog ──────────────────────────────────────────────────────────
    this.cameras.main.fadeIn(400);
    this.time.delayedCall(500, () => {
      const lines = GameConfig.dialogue.act3.find(
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

    this.player.update();
    this.dialog.update();

    // Update zombies
    this.zombies.forEach(zombie => {
      if (!zombie.isDead) {
        zombie.update(this.player.x, this.player.y);

        if (!this.player.isInvincible) {
          const dist = Phaser.Math.Distance.Between(
            this.player.x, this.player.y,
            zombie.x, zombie.y
          );
          if (dist < 40) {
            this.player.takeDamage(1);
          }
        }

        if (this.player.isAttacking) {
          const dist = Phaser.Math.Distance.Between(
            this.player.attackHitbox.x,
            this.player.attackHitbox.y,
            zombie.x, zombie.y
          );
          if (dist < 60) {
            const killed = zombie.takeDamage(1);
            if (killed) {
              this.score += GameConfig.act3.scorePerEnemy;
              this.hud.showMessage(`+${GameConfig.act3.scorePerEnemy}`, '#ffdd00');
            }
          }
        }
      }
    });

    // Bullets vs zombies
    this.bullets.getChildren().forEach(bullet => {
      this.zombies.forEach(zombie => {
        if (!zombie.isDead && bullet.active) {
          const dist = Phaser.Math.Distance.Between(
            bullet.x, bullet.y, zombie.x, zombie.y
          );
          if (dist < 40) {
            bullet.destroy();
            const killed = zombie.takeDamage(2);
            if (killed) {
              this.score += GameConfig.act3.scorePerEnemy;
            }
          }
        }
      });
    });

    // Check exit
    const distToExit = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.exitX, this.exitY
    );
    if (distToExit < 80 && !this.actComplete) {
      this._completeAct();
    }

    // Update HUD
    this.hud.update(
      this.player.health,
      GameConfig.player.maxHealth,
      this.score,
      this.timeLeft,
      'ACT 3 — ARCADE',
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
    bullet.body.setVelocityX(facingRight ? 600 : -600);
    this.bullets.add(bullet);

    this.time.delayedCall(1500, () => {
      if (bullet && bullet.active) bullet.destroy();
    });
  }

  // ---------------------------------------------------------------------------
  // COMPLETE ACT
  // ---------------------------------------------------------------------------
  _completeAct() {
    this.actComplete = true;
    this.timerEvent.remove();

    const bonus = Math.round(this.timeLeft * GameConfig.act3.bonusPerSecond);
    this.score += bonus;

    this.hud.showMessage(`ESCAPED! +${bonus} TIME BONUS!`, '#00ff88');
    this.cameras.main.fade(800, 0, 0, 0);
    this.time.delayedCall(800, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        act: 3,
        won: true,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // PLAYER DEATH
  // ---------------------------------------------------------------------------
  onPlayerDeath() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.timerEvent.remove();
    this.hud.showMessage('YOU DIED', '#ff4444');
    this.time.delayedCall(1500, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        act: 3,
        won: false,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------
  _spawnObstacles(H, worldW) {
    const positions = [
      300, 550, 750, 1000, 1300,
      1550, 1800, 2100, 2350, 2600,
      2900, 3100, 3300,
    ];

    positions.forEach(x => {
      const h = Phaser.Math.Between(40, 100);
      const obs = this.add.graphics();
      obs.fillStyle(0x333300, 1);
      obs.fillRect(-15, -h/2, 30, h);
      obs.lineStyle(2, 0x666600, 1);
      obs.strokeRect(-15, -h/2, 30, h);
      obs.setPosition(x, H - 60 - h/2);

      const zone = this.add.zone(x, H - 60 - h/2, 30, h);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      this.platforms.add(zone);
    });
  }

  _spawnCollectibles(H, worldW) {
    const positions = [
      200, 500, 900, 1100, 1400,
      1700, 2000, 2300, 2700, 3000,
    ];

    positions.forEach(x => {
      const gfx = this.add.graphics();
      gfx.fillStyle(0xffdd00, 1);
      gfx.fillCircle(0, 0, 8);
      gfx.setPosition(x, H - 100);

      this.tweens.add({
        targets: gfx,
        y: H - 115,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });

      const zone = this.add.zone(x, H - 100, 20, 20);
      this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
      const orig = zone.destroy.bind(zone);
      zone.destroy = () => { gfx.destroy(); orig(); };
      this.collectibles.add(zone);
    });
  }

  _spawnZombies(H, worldW) {
    const positions = [600, 1200, 1800, 2400, 3000];
    const types = ['zombie1', 'zombie2', 'zombie3'];

    positions.forEach((x, i) => {
      const e = new Enemy(this, x, H - 80, types[i % types.length], false);
      this.physics.add.collider(e.body, this.platforms);
      this.zombies.push(e);
    });
  }

  _addPlatform(x, y, w, h) {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x1a1a00, 1);
    gfx.fillRect(-w/2, -h/2, w, h);
    gfx.lineStyle(2, 0x444400, 0.8);
    gfx.strokeRect(-w/2, -h/2, w, h);
    gfx.setPosition(x, y);

    const zone = this.add.zone(x, y, w, h);
    this.physics.world.enable(zone, Phaser.Physics.Arcade.STATIC_BODY);
    this.platforms.add(zone);
  }

  _drawExit() {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x00aa00, 0.8);
    gfx.fillRect(-40, -80, 80, 160);
    gfx.lineStyle(3, 0x00ff00, 1);
    gfx.strokeRect(-40, -80, 80, 160);
    gfx.setPosition(this.exitX, this.exitY);

    this.add.text(this.exitX, this.exitY - 100, 'GATE\nEXIT', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#00ff00',
      align: 'center',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: gfx,
      alpha: 0.4,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }
}