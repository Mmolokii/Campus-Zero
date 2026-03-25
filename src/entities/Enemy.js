import GameConfig from '../config/GameConfig.js';

export default class Enemy {

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x, y    - spawn position
   * @param {string} type    - 'zombie1', 'zombie2', 'zombie3', 'zombie4'
   * @param {boolean} isBoss - is this the boss enemy?
   */
  constructor(scene, x, y, type = 'zombie1', isBoss = false) {
    this.scene  = scene;
    this.cfg    = GameConfig.enemy;
    this.type   = type;
    this.isBoss = isBoss;

    // Boss is bigger and tougher
    const w = isBoss ? 48 : 30;
    const h = isBoss ? 64 : 48;
    this.maxHp = isBoss ? GameConfig.act2.bossHealth : 2;
    this.hp    = this.maxHp;

    // ── Physics body ──────────────────────────────────────────────────────────
    this.body = scene.add.rectangle(x, y, w, h, 0x000000, 0);
    scene.physics.add.existing(this.body);
    this.body.body.setCollideWorldBounds(true);

    // ── Visual ────────────────────────────────────────────────────────────────
    this.gfx = scene.add.graphics();

    // ── State ─────────────────────────────────────────────────────────────────
    this.state          = 'patrol';
    this.patrolDir      = 1;
    this.patrolOriginX  = x;
    this.isDead         = false;
    this.scoreValue     = isBoss ? 500 : this.cfg.scoreValue;
    this._hitFlash      = false;
    this.attackTimer    = 0;
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------
  update(playerX, playerY) {
    if (this.isDead) return;
    this._fsm(playerX, playerY);
    this._updateVisual();
  }

  // ---------------------------------------------------------------------------
  // AI STATE MACHINE
  // ---------------------------------------------------------------------------
  _fsm(px, py) {
    const dist = Phaser.Math.Distance.Between(
      this.body.x, this.body.y, px, py
    );

    // Boss has longer detection range
    const detection = this.isBoss
      ? this.cfg.detectionRange * 2
      : this.cfg.detectionRange;

    const speed = this.isBoss
      ? this.cfg.speed * 0.7
      : this.cfg.speed;

    switch (this.state) {

      case 'patrol':
        this.body.body.setVelocityX(speed * this.patrolDir);
        if (Math.abs(this.body.x - this.patrolOriginX) > this.cfg.patrolDistance) {
          this.patrolDir *= -1;
        }
        if (dist < detection) this.state = 'chase';
        break;

      case 'chase':
        const dirX = px > this.body.x ? 1 : -1;
        this.body.body.setVelocityX(speed * 1.3 * dirX);
        if (dist > detection * 1.5) this.state = 'patrol';
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // TAKE DAMAGE
  // ---------------------------------------------------------------------------
  takeDamage(amount = 1) {
    if (this.isDead) return false;
    this.hp -= amount;
    this._hitFlash = true;

    this.scene.time.delayedCall(120, () => {
      this._hitFlash = false;
    });

    if (this.hp <= 0) {
      this._die();
      return true;
    }
    return false;
  }

  // ---------------------------------------------------------------------------
  // DIE
  // ---------------------------------------------------------------------------
  _die() {
    this.isDead = true;
    this.body.body.setVelocity(0, 0);

    this.scene.tweens.add({
      targets: this.gfx,
      alpha: 0,
      y: this.gfx.y - 20,
      duration: 500,
      onComplete: () => {
        this.gfx.destroy();
        this.body.destroy();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // DRAW
  // ---------------------------------------------------------------------------
  _draw() {
    this.gfx.clear();

    // Colors per zombie type
    const colors = {
      zombie1: 0x44aa44,
      zombie2: 0xaaaa00,
      zombie3: 0xaa4400,
      zombie4: 0x880088,
    };

    const baseColor = this._hitFlash ? 0xffffff : (colors[this.type] || 0x44aa44);
    const w = this.isBoss ? 48 : 30;
    const h = this.isBoss ? 64 : 48;

    // Body
    this.gfx.fillStyle(baseColor, 1);
    this.gfx.fillRect(-w/2, -h/2, w, h);

    // Head
    this.gfx.fillStyle(this._hitFlash ? 0xffffff : 0x336633, 1);
    this.gfx.fillCircle(0, -h/2 - 10, this.isBoss ? 16 : 10);

    // Eyes — red when chasing
    const eyeCol = this.state === 'chase' ? 0xff0000 : 0xffffff;
    this.gfx.fillStyle(eyeCol, 1);
    this.gfx.fillCircle(-4, -h/2 - 11, 3);
    this.gfx.fillCircle(4,  -h/2 - 11, 3);

    // HP bar
    const barW = this.isBoss ? 80 : 40;
    this.gfx.fillStyle(0x000000, 0.7);
    this.gfx.fillRect(-barW/2, -h/2 - 26, barW, 6);

    const hpPct = Math.max(0, this.hp / this.maxHp);
    const hpCol = hpPct > 0.5 ? 0x00ff00 : hpPct > 0.25 ? 0xffaa00 : 0xff0000;
    this.gfx.fillStyle(hpCol, 1);
    this.gfx.fillRect(-barW/2, -h/2 - 26, barW * hpPct, 6);

    // Boss crown indicator
    if (this.isBoss) {
      this.gfx.fillStyle(0xffdd00, 1);
      this.gfx.fillTriangle(-16, -h/2 - 30, 0, -h/2 - 42, 16, -h/2 - 30);
    }
  }

  _updateVisual() {
    this.gfx.setPosition(this.body.x, this.body.y);
    this._draw();
  }

  get x() { return this.body.x; }
  get y() { return this.body.y; }
}