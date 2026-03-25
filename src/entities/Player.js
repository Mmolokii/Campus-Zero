import GameConfig from '../config/GameConfig.js';

export default class Player {

  constructor(scene, x, y) {
    this.scene = scene;
    this.cfg = GameConfig.player;

    // ── Sprite with physics ───────────────────────────────────────────────────
    this.sprite = scene.physics.add.sprite(x, y, 'player_idle');
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setScale(1.5);

    // ── State ─────────────────────────────────────────────────────────────────
    this.health       = this.cfg.maxHealth;
    this.score        = 0;
    this.isAttacking  = false;
    this.canAttack    = true;
    this.isShooting   = false;
    this.canShoot     = true;
    this.isInvincible = false;
    this.isDead       = false;
    this.facingRight  = true;
    this.weapon       = null;

    // ── Attack hitbox ─────────────────────────────────────────────────────────
    this.attackHitbox = scene.add.rectangle(
      0, 0, this.cfg.attackRange, 24, 0x000000, 0
    );
    scene.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.enable = false;

    // ── Controls ──────────────────────────────────────────────────────────────
    this.keys = scene.input.keyboard.addKeys({
      left:   Phaser.Input.Keyboard.KeyCodes.LEFT,
      right:  Phaser.Input.Keyboard.KeyCodes.RIGHT,
      up:     Phaser.Input.Keyboard.KeyCodes.UP,
      a:      Phaser.Input.Keyboard.KeyCodes.A,
      d:      Phaser.Input.Keyboard.KeyCodes.D,
      w:      Phaser.Input.Keyboard.KeyCodes.W,
      space:  Phaser.Input.Keyboard.KeyCodes.SPACE,
      attack: Phaser.Input.Keyboard.KeyCodes.Z,
      shoot:  Phaser.Input.Keyboard.KeyCodes.X,
    });

    // Start idle animation
    this.sprite.play('idle');
  }

  // ---------------------------------------------------------------------------
  // UPDATE
  // ---------------------------------------------------------------------------
  update() {
    if (this.isDead) return;
    this._move();
    this._handleAttack();
    this._handleShoot();
    this._positionHitbox();
  }

  // ---------------------------------------------------------------------------
  // MOVEMENT
  // ---------------------------------------------------------------------------
  _move() {
    const goLeft  = this.keys.left.isDown  || this.keys.a.isDown;
    const goRight = this.keys.right.isDown || this.keys.d.isDown;
    const goJump  = Phaser.Input.Keyboard.JustDown(this.keys.up)   ||
                    Phaser.Input.Keyboard.JustDown(this.keys.w)    ||
                    Phaser.Input.Keyboard.JustDown(this.keys.space);

    if (goLeft) {
      this.sprite.body.setVelocityX(-this.cfg.speed);
      this.sprite.setFlipX(true);
      this.facingRight = false;
    } else if (goRight) {
      this.sprite.body.setVelocityX(this.cfg.speed);
      this.sprite.setFlipX(false);
      this.facingRight = true;
    } else {
      this.sprite.body.setVelocityX(
        this.sprite.body.velocity.x * 0.8
      );
    }

    if (goJump && this.sprite.body.blocked.down) {
      this.sprite.body.setVelocityY(this.cfg.jumpForce);
    }

    // ── Animations ────────────────────────────────────────────────────────────
    if (this.isAttacking) return;

    if (!this.sprite.body.blocked.down) {
      if (this.sprite.anims.currentAnim?.key !== 'jump') {
        this.sprite.play('jump', true);
      }
    } else if (goLeft || goRight) {
      if (this.sprite.anims.currentAnim?.key !== 'run') {
        this.sprite.play('run', true);
      }
    } else {
      if (this.sprite.anims.currentAnim?.key !== 'idle') {
        this.sprite.play('idle', true);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // MELEE ATTACK
  // ---------------------------------------------------------------------------
  _handleAttack() {
    if (!this.weapon) return;
    if (this.weapon === 'pistol') return;

    if (
      Phaser.Input.Keyboard.JustDown(this.keys.attack) &&
      this.canAttack
    ) {
      this.isAttacking = true;
      this.canAttack = false;
      this.attackHitbox.body.enable = true;
      this.sprite.play('attack', true);

      this.sprite.once('animationcomplete', () => {
        this.isAttacking = false;
        this.attackHitbox.body.enable = false;
        this.sprite.play('idle', true);
      });

      this.scene.time.delayedCall(
        this.cfg.attackCooldown, () => {
          this.canAttack = true;
        }
      );
    }
  }

  // ---------------------------------------------------------------------------
  // SHOOT
  // ---------------------------------------------------------------------------
  _handleShoot() {
    if (this.weapon !== 'pistol') return;

    if (
      Phaser.Input.Keyboard.JustDown(this.keys.shoot) &&
      this.canShoot
    ) {
      this.canShoot = false;
      this.isShooting = true;
      this.scene.fireBullet(
        this.sprite.x, this.sprite.y, this.facingRight
      );
      this.scene.time.delayedCall(500, () => {
        this.canShoot = true;
        this.isShooting = false;
      });
    }

    // Still can melee with Z
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.attack) &&
      this.canAttack
    ) {
      this.isAttacking = true;
      this.canAttack = false;
      this.attackHitbox.body.enable = true;
      this.sprite.play('attack', true);

      this.sprite.once('animationcomplete', () => {
        this.isAttacking = false;
        this.attackHitbox.body.enable = false;
        this.sprite.play('idle', true);
      });

      this.scene.time.delayedCall(
        this.cfg.attackCooldown, () => {
          this.canAttack = true;
        }
      );
    }
  }

  // ---------------------------------------------------------------------------
  // TAKE DAMAGE
  // ---------------------------------------------------------------------------
  takeDamage(amount = 1) {
    if (this.isInvincible || this.isDead) return;
    this.health -= amount;
    this.isInvincible = true;

    this.sprite.play('hurt', true);
    this.sprite.once('animationcomplete', () => {
      if (!this.isDead) this.sprite.play('idle', true);
    });

    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 4,
    });

    this.scene.time.delayedCall(
      this.cfg.invincibilityMs, () => {
        this.isInvincible = false;
        this.sprite.setAlpha(1);
      }
    );

    if (this.health <= 0) this._die();
  }

  // ---------------------------------------------------------------------------
  // PICKUP WEAPON
  // ---------------------------------------------------------------------------
  pickupWeapon(type) {
    this.weapon = type;
  }

  // ---------------------------------------------------------------------------
  // DIE
  // ---------------------------------------------------------------------------
  _die() {
    this.isDead = true;
    this.sprite.body.setVelocity(0, 0);
    this.sprite.play('death', true);
    this.sprite.once('animationcomplete', () => {
      this.scene.time.delayedCall(500, () => {
        this.scene.onPlayerDeath();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // POSITION HITBOX
  // ---------------------------------------------------------------------------
  _positionHitbox() {
    const x = this.sprite.x + (this.facingRight
      ? 40 + this.cfg.attackRange / 2
      : -40 - this.cfg.attackRange / 2);
    this.attackHitbox.setPosition(x, this.sprite.y);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  destroy() {
    this.sprite.destroy();
    this.attackHitbox.destroy();
  }
}