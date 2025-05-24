import { CPU } from "./cpu.js";
import { Memory } from "./memory.js";
import { Display } from "./display.js";

export class GameBoy {
  constructor() {
    this.memory = new Memory();
    this.cpu = new CPU(this.memory);
    this.display = new Display();

    this.cpu.reset();
    this.ppuMode = 0;
    this.ppuLine = 0;
    this.ppuCycles = 0;
    this.prevPpuMode = 0;
    this.prevLyEqualsLyc = false;

    if (typeof document !== "undefined") {
      document.body.appendChild(this.display.getCanvas());
    }
  }

  runFrame() {
    const CYCLES_PER_FRAME = 70224;
    let cyclesThisFrame = 0;

    while (cyclesThisFrame < CYCLES_PER_FRAME) {
      const stepCycles = 4;

      let cpuCycles = this.cpu.executeInstruction();
      if (!cpuCycles || cpuCycles < stepCycles) cpuCycles = stepCycles;

      this.updateGraphics(cpuCycles);

      cyclesThisFrame += cpuCycles;
    }

    this.display.render();
    this.frameCount++;
  }

  updateGraphics(cycles) {
    this.ppuCycles += cycles;

    switch (this.ppuMode) {
      case 2: // OAM Search
        if (this.ppuCycles >= 80) {
          this.ppuCycles -= 80;
          this.ppuMode = 3;
          // Update STAT register mode bits
          this.updateStatMode(3);
        }
        break;

      case 3: // Pixel Transfer
        if (this.ppuCycles >= 172) {
          this.ppuCycles -= 172;
          this.ppuMode = 0;
          this.updateStatMode(0);

          if (this.ppuLine < 144) {
            this.renderScanline(this.ppuLine);
          }
        }
        break;

      case 0: // HBlank
        if (this.ppuCycles >= 204) {
          this.ppuCycles -= 204;
          this.ppuLine++;

          if (this.ppuLine === 144) {
            this.ppuMode = 1;
            this.updateStatMode(1);
            // VBlank interrupt
            this.memory.writeByte(0xff0f, this.memory.readByte(0xff0f) | 0x01);
          } else {
            this.ppuMode = 2;
            this.updateStatMode(2);
          }
        }
        break;

      case 1: // VBlank
        if (this.ppuCycles >= 456) {
          this.ppuCycles -= 456;
          this.ppuLine++;

          if (this.ppuLine > 153) {
            this.ppuMode = 2;
            this.updateStatMode(2);
            this.ppuLine = 0;
          }
        }
        break;
    }

    // Update LY register
    this.memory.writeByte(0xff44, this.ppuLine);

    // --- LCD STAT Interrupt Logic ---
    const stat = this.memory.readByte(0xff41);
    const ly = this.ppuLine;
    const lyc = this.memory.readByte(0xff45);

    // Only request LY=LYC interrupt on transition
    const lyEqualsLyc = ly === lyc;
    if (lyEqualsLyc && !this.prevLyEqualsLyc && stat & 0x40) {
      this.memory.writeByte(0xff0f, this.memory.readByte(0xff0f) | 0x2);
    }

    // Update previous state
    this.prevPpuMode = this.ppuMode;
    this.prevLyEqualsLyc = lyEqualsLyc;
  }

  updateStatMode(mode) {
    let stat = this.memory.readByte(0xff41);
    stat = (stat & 0xfc) | (mode & 0x03);
    this.memory.writeByte(0xff41, stat);
  }

  renderScanline(line) {
    if (this.memory.readByte(0xff40) & 0x80) {
      this.display.drawScanline(this.memory, line);
      this.display.drawSpriteScanline(this.memory, line);
    }
  }

  start() {
    // Debug checks
    if (!this.memory.verifyROMData()) {
      console.error("ROM data appears invalid");
      return;
    }

    console.log("Starting emulator...");

    // Disable LCD initially
    this.memory.writeByte(0xff40, 0x00);

    // Fill background map with alternating tile indices for a checkerboard
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const addr = 0x9800 + y * 32 + x;
        this.memory.writeByte(addr, (x + y) % 2); // Use tile 0 and tile 1
      }
    }

    // Define tile 0 (checkerboard) at 0x8000
    for (let i = 0; i < 8; i++) {
      // Alternate 0xFF and 0x00 for checkerboard
      const byte = i % 2 === 0 ? 0xff : 0x00;
      // Each tile row is 2 bytes: low and high bitplanes
      // Set both bitplanes to the same for solid color
      this.memory.writeByte(0x8000 + i * 2, byte);
      this.memory.writeByte(0x8000 + i * 2 + 1, byte);
    }

    // Define tile 1 (inverse checkerboard) at 0x8010
    for (let i = 0; i < 8; i++) {
      const byte = i % 2 === 0 ? 0x00 : 0xff;
      this.memory.writeByte(0x8010 + i * 2, byte);
      this.memory.writeByte(0x8010 + i * 2 + 1, byte);
    }

    // Wait a few frames for initialization
    let initFrames = 0;
    const initLoop = () => {
      this.runFrame();
      initFrames++;

      if (initFrames >= 3) {
        // Enable LCD and background
        this.memory.writeByte(0xff40, 0x91);
        // Start normal execution
        requestAnimationFrame(() => this.update());
      } else {
        requestAnimationFrame(initLoop);
      }
    };

    requestAnimationFrame(initLoop);
  }

  update() {
    this.runFrame();
    requestAnimationFrame(() => this.update());
  }
}
