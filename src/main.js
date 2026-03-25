import GameConfig from './config/GameConfig.js';
import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/Start.js';
import Act1Scene from './scenes/Act1Scene.js';
import Act2Scene from './scenes/Act2Scene.js';
import Act3Scene from './scenes/Act3Scene.js';
import GameOverScene from './scenes/GameOverScene.js';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: GameConfig.width,
  height: GameConfig.height,
  parent: 'game',
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 500 },
      debug: false
    }
  },
  scene: [
    BootScene,
    MenuScene,
    Act1Scene,
    Act2Scene,
    Act3Scene,
    GameOverScene
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
});
            