import { CPU } from "./cpu.js";
import { Memory } from "./memory.js";
import { Display } from "./display.js";

export class GameBoy {
  constructor() {
    this.memory = new Memory();
    this.cpu = new CPU(this.memory);
    this.display = new Display();
    this.cpu.reset();

    this.ppuMode = 2;
    this.ppuLine = 0;
    this.ppuCycles = 0;

    this.memory.writeByte(0xff40, 0x91);
    this.memory.writeByte(0xff41, 0x85);
    this.memory.writeByte(0xff44, 0x00);

    if (typeof document !== "undefined") {
      document.body.appendChild(this.display.getCanvas());
    }
  }

  runFrame() {
    const CYCLES_PER_FRAME = 70224;
    let cyclesThisFrame = 0;

    while (cyclesThisFrame < CYCLES_PER_FRAME) {
      // Check if LCD is enabled
      if (this.memory.readByte(0xff40) & 0x80) {
        const previousCycles = this.cpu.clock;
        this.cpu.executeInstruction();
        const cyclesElapsed = this.cpu.clock - previousCycles;
        cyclesThisFrame += cyclesElapsed;

        this.updateGraphics(cyclesElapsed);
      } else {
        // LCD disabled - skip graphics updates
        cyclesThisFrame += this.cpu.executeInstruction();
      }
    }

    this.display.render();
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
            this.display.render();
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

  debugRenderTile(tileData) {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(8, 8);

    for (let y = 0; y < 8; y++) {
      const low = tileData[y * 2];
      const high = tileData[y * 2 + 1];

      for (let x = 0; x < 8; x++) {
        const mask = 1 << (7 - x);
        const colorNum = (high & mask ? 2 : 0) | (low & mask ? 1 : 0);
        const color = this.palette[colorNum];

        const idx = (y * 8 + x) * 4;
        imageData.data[idx] = color[0];
        imageData.data[idx + 1] = color[1];
        imageData.data[idx + 2] = color[2];
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  
  start() {
    // Debug checks
    if (!this.memory.verifyROMData()) {
      console.error("ROM data appears invalid");
      return;
    }

    // Show tile debug
    this.display.debugShowTiles(this.memory);

    const frameTime = 1000 / 60;

    console.log("Starting emulator...");

    setInterval(() => {
      this.runFrame();
    }, frameTime);
  }
}
