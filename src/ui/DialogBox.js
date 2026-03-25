export default class DialogBox {

  /**
   * A reusable dialog box for displaying story text.
   * Call show() to display lines one at a time.
   * The box auto-advances on click or Z key.
   */
  constructor(scene) {
    this.scene = scene;
    this.isOpen = false;
    this.lines = [];
    this.currentLine = 0;
    this.onComplete = null;

    const W = 960;
    const H = 540;

    // ── Box background ───────────────────────────────────────────────────────
    this.bg = scene.add.graphics();
    this.bg.fillStyle(0x000000, 0.85);
    this.bg.fillRect(40, H - 160, W - 80, 130);
    this.bg.lineStyle(2, 0xff0000, 0.8);
    this.bg.strokeRect(40, H - 160, W - 80, 130);
    this.bg.setScrollFactor(0).setDepth(200).setVisible(false);

    // ── Speaker name label ───────────────────────────────────────────────────
    this.nameTag = scene.add.text(60, H - 170, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ff4444',
      backgroundColor: '#000000',
      padding: { x: 6, y: 3 },
    }).setScrollFactor(0).setDepth(201).setVisible(false);

    // ── Dialog text ──────────────────────────────────────────────────────────
    this.text = scene.add.text(60, H - 145, '', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffffff',
      wordWrap: { width: W - 140 },
      lineSpacing: 6,
    }).setScrollFactor(0).setDepth(201).setVisible(false);

    // ── Advance prompt ───────────────────────────────────────────────────────
    this.prompt = scene.add.text(W - 60, H - 45, '[ Z / CLICK ]', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#555555',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(201).setVisible(false);

    // Pulsing prompt animation
    scene.tweens.add({
      targets: this.prompt,
      alpha: 0.2,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // ── Input listeners ──────────────────────────────────────────────────────
    this.zKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    scene.input.on('pointerdown', () => {
      if (this.isOpen) this.advance();
    });
  }

  // ---------------------------------------------------------------------------
  // SHOW — call this to display a dialog sequence
  // lines: array of strings
  // speaker: optional name shown above box
  // onComplete: callback when all lines are done
  // ---------------------------------------------------------------------------
  show(lines, speaker = '', onComplete = null) {
    this.lines = lines;
    this.currentLine = 0;
    this.onComplete = onComplete;
    this.isOpen = true;

    this.nameTag.setText(speaker).setVisible(speaker !== '');
    this.bg.setVisible(true);
    this.text.setVisible(true);
    this.prompt.setVisible(true);

    this._showLine();
  }

  // ---------------------------------------------------------------------------
  // ADVANCE — move to next line or close
  // ---------------------------------------------------------------------------
  advance() {
    if (!this.isOpen) return;

    // If still typing, skip to full text
    if (this.isTyping) {
      this.isTyping = false;
      if (this.typeTimer) this.typeTimer.remove();
      this.text.setText(this.lines[this.currentLine]);
      return;
    }

    this.currentLine++;
    if (this.currentLine < this.lines.length) {
      this._showLine();
    } else {
      this._close();
    }
  }

  // ---------------------------------------------------------------------------
  // UPDATE — call this every frame from the scene
  // ---------------------------------------------------------------------------
  update() {
    if (Phaser.Input.Keyboard.JustDown(this.zKey) && this.isOpen) {
      this.advance();
    }
  }

  // ---------------------------------------------------------------------------
  // INTERNAL
  // ---------------------------------------------------------------------------
  _showLine() {
    const line = this.lines[this.currentLine];
    this.text.setText('');
    this.isTyping = true;

    // Typewriter effect
    let i = 0;
    this.typeTimer = this.scene.time.addEvent({
      delay: 30,
      repeat: line.length - 1,
      callback: () => {
        this.text.setText(line.substring(0, i + 1));
        i++;
        if (i >= line.length) {
          this.isTyping = false;
        }
      }
    });
  }

  _close() {
    this.isOpen = false;
    this.bg.setVisible(false);
    this.text.setVisible(false);
    this.nameTag.setVisible(false);
    this.prompt.setVisible(false);
    if (this.onComplete) this.onComplete();
  }

  destroy() {
    [this.bg, this.nameTag, this.text, this.prompt].forEach(o => o.destroy());
  }
}