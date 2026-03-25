import GameConfig from '../config/GameConfig.js';

export default class BootScene extends Phaser.Scene {

  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const W = GameConfig.width;
    const H = GameConfig.height;

    // ── Loading bar ───────────────────────────────────────────────────────────
    const barBg = this.add.rectangle(W/2, H/2, 400, 20, 0x333333);
    const bar   = this.add.rectangle(W/2 - 200, H/2, 0, 20, 0x00ff88);
    bar.setOrigin(0, 0.5);

    this.add.text(W/2, H/2 - 40, 'CAMPUS ZERO', {
      fontFamily: 'monospace',
      fontSize: '32px',
      color: '#ffffff'
    }).setOrigin(0.5);

    this.add.text(W/2, H/2 + 40, 'LOADING...', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#666666'
    }).setOrigin(0.5);

    this.load.on('progress', (value) => {
      bar.width = 400 * value;
    });

    // ── Player spritesheets ───────────────────────────────────────────────────
    this.load.spritesheet('player_idle',
      'assets/images/spr_player_idle_strip5.png',
      { frameWidth: 64, frameHeight: 64 });

    this.load.spritesheet('player_run',
      'assets/images/spr_player_run_strip9.png',
      { frameWidth: 64, frameHeight: 64 });

    this.load.spritesheet('player_jump',
      'assets/images/spr_player_jump_strip12.png',
      { frameWidth: 64, frameHeight: 64 });

    this.load.spritesheet('player_dash',
      'assets/images/spr_player_dash_strip13.png',
      { frameWidth: 64, frameHeight: 64 });

    this.load.spritesheet('player_attack',
      'assets/images/spr_player_attack_strip9.png',
      { frameWidth: 64, frameHeight: 64 });

    this.load.spritesheet('player_hurt',
      'assets/images/spr_player_hurt_strip4.png',
      { frameWidth: 64, frameHeight: 64 });

    this.load.spritesheet('player_death',
      'assets/images/spr_player_death_strip8.png',
      { frameWidth: 64, frameHeight: 64 });

    // ── Zombie spritesheets ───────────────────────────────────────────────────
    // We need to check zombie frame sizes first
    // For now loading as images until we check dimensions
    this.load.image('zombie1_idle',   'assets/images/Zombie_1/Idle.png');
    this.load.image('zombie1_walk',   'assets/images/Zombie_1/Walk.png');
    this.load.image('zombie1_attack', 'assets/images/Zombie_1/Attack.png');
    this.load.image('zombie1_hurt',   'assets/images/Zombie_1/Hurt.png');
    this.load.image('zombie1_dead',   'assets/images/Zombie_1/Dead.png');

    this.load.image('zombie2_idle',   'assets/images/Zombie_2/Idle.png');
    this.load.image('zombie2_walk',   'assets/images/Zombie_2/Walk.png');
    this.load.image('zombie2_attack', 'assets/images/Zombie_2/Attack.png');
    this.load.image('zombie2_hurt',   'assets/images/Zombie_2/Hurt.png');
    this.load.image('zombie2_dead',   'assets/images/Zombie_2/Dead.png');

    this.load.image('zombie3_idle',   'assets/images/Zombie_3/Idle.png');
    this.load.image('zombie3_walk',   'assets/images/Zombie_3/Walk.png');
    this.load.image('zombie3_attack', 'assets/images/Zombie_3/Attack.png');
    this.load.image('zombie3_hurt',   'assets/images/Zombie_3/Hurt.png');
    this.load.image('zombie3_dead',   'assets/images/Zombie_3/Dead.png');

    this.load.image('zombie4_idle',   'assets/images/Zombie_4/Idle.png');
    this.load.image('zombie4_walk',   'assets/images/Zombie_4/Walk.png');
    this.load.image('zombie4_attack', 'assets/images/Zombie_4/Attack.png');
    this.load.image('zombie4_hurt',   'assets/images/Zombie_4/Hurt.png');
    this.load.image('zombie4_dead',   'assets/images/Zombie_4/Dead.png');

    // ── Tilesets ──────────────────────────────────────────────────────────────
    this.load.image('tiles_platformer',
      'assets/images/tilemap_packed.png');
    this.load.image('tiles_topdown',
      'assets/images/tilesheet_complete.png');
    this.load.image('tiles_items',
      'assets/images/roguelikeSheet_transparent.png');

    // ── School backgrounds ────────────────────────────────────────────────────
    this.load.image('bg_classroom',
      'assets/images/school/Classroom/Full.png');
    this.load.image('bg_hallway',
      'assets/images/school/Hallway/Full.png');
    this.load.image('bg_exterior',
      'assets/images/school/School Back/Full.png');

    // ── School objects ────────────────────────────────────────────────────────
    this.load.image('obj_locker',
      'assets/images/school/Objects/Locker - Single.png');
    this.load.image('obj_desk',
      'assets/images/school/Objects/Big Desk.png');
    this.load.image('obj_board',
      'assets/images/school/Objects/Chalk Board.png');
    this.load.image('obj_door',
      'assets/images/school/Objects/Wooden Door.png');
  }

  create() {
    // ── Create player animations ──────────────────────────────────────────────
    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('player_idle', {
        start: 0, end: 4
      }),
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('player_run', {
        start: 0, end: 8
      }),
      frameRate: 12,
      repeat: -1
    });

    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNumbers('player_jump', {
        start: 0, end: 11
      }),
      frameRate: 12,
      repeat: 0
    });

    this.anims.create({
      key: 'dash',
      frames: this.anims.generateFrameNumbers('player_dash', {
        start: 0, end: 12
      }),
      frameRate: 16,
      repeat: 0
    });

    this.anims.create({
      key: 'attack',
      frames: this.anims.generateFrameNumbers('player_attack', {
        start: 0, end: 8
      }),
      frameRate: 16,
      repeat: 0
    });

    this.anims.create({
      key: 'hurt',
      frames: this.anims.generateFrameNumbers('player_hurt', {
        start: 0, end: 3
      }),
      frameRate: 10,
      repeat: 0
    });

    this.anims.create({
      key: 'death',
      frames: this.anims.generateFrameNumbers('player_death', {
        start: 0, end: 7
      }),
      frameRate: 10,
      repeat: 0
    });

    // Go to menu
    this.scene.start('MenuScene');
  }
}