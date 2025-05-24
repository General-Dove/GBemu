export class Display {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 160;
    this.canvas.height = 144;

    this.ctx = this.canvas.getContext("2d");
    this.imageData = this.ctx.createImageData(160, 144);

    this.frameBuffer = new Uint8ClampedArray(160 * 144 * 4);

    this.clear();

    this.palette = [
      [155, 188, 15], // Lightest green
      [139, 172, 15], // Light green
      [48, 98, 48], // Dark green
      [15, 56, 15], // Darkest green
    ];
  }

  drawScanline(memory, line) {
    // Check LCD and background enable bits
    const lcdc = memory.readByte(0xff40);

    // Get scroll positions and addresses
    const scrollX = memory.readByte(0xff43);
    const scrollY = memory.readByte(0xff42);
    const bgTileMap = lcdc & 0x08 ? 0x9c00 : 0x9800;
    const useSignedAddressing = !(lcdc & 0x10);
    const bgp = memory.readByte(0xff47);

    // Draw one line of pixels
    for (let x = 0; x < 160; x++) {
      // Get background map coordinates with scroll
      const bgX = (x + scrollX) & 0xff;
      const bgY = (line + scrollY) & 0xff;

      // Get tile coordinates
      const tileX = bgX >> 3;
      const tileY = bgY >> 3;

      // Get pixel position within tile
      const pixelX = bgX & 7;
      const pixelY = bgY & 7;

      // Get tile index
      const mapOffset = (tileY & 0x1f) * 32 + (tileX & 0x1f);
      const tileIndex = memory.readByte(bgTileMap + mapOffset);

      // Get tile data
      let tileAddress;
      if (useSignedAddressing) {
        // Convert to signed value (-128 to 127)
        const signedIndex = tileIndex & 0x80 ? tileIndex - 256 : tileIndex;
        tileAddress = 0x9000 + signedIndex * 16;
      } else {
        tileAddress = 0x8000 + tileIndex * 16;
      }

      // Get color from tile data
      const byteIndex = pixelY * 2;
      const byte1 = memory.readByte(tileAddress + byteIndex);
      const byte2 = memory.readByte(tileAddress + byteIndex + 1);
      const mask = 1 << (7 - pixelX);
      const colorNum = (byte2 & mask ? 2 : 0) | (byte1 & mask ? 1 : 0);

      // Apply background palette
      const paletteColor = (bgp >> (colorNum * 2)) & 0x03;
      const color = this.palette[paletteColor];

      // Set pixel in framebuffer
      const idx = (line * 160 + x) * 4;
      this.frameBuffer[idx] = color[0];
      this.frameBuffer[idx + 1] = color[1];
      this.frameBuffer[idx + 2] = color[2];
      this.frameBuffer[idx + 3] = 255;
    }
  }

  drawSpriteScanline(memory, line) {
    // Process sprites in reverse order for priority
    for (let i = 39; i >= 0; i--) {
      const baseAddr = 0xfe00 + i * 4;
      const y = memory.readByte(baseAddr) - 16;
      const x = memory.readByte(baseAddr + 1) - 8;
      const tileIndex = memory.readByte(baseAddr + 2);
      const attributes = memory.readByte(baseAddr + 3);

      // Check if sprite intersects with this scanline
      if (y <= line && y + 8 > line) {
        const palette =
          attributes & 0x10 ? memory.readByte(0xff49) : memory.readByte(0xff48);
        const xFlip = attributes & 0x20;
        const yFlip = attributes & 0x40;

        const tileData = memory.getTileData(tileIndex, false);
        const tileY = yFlip ? 7 - (line - y) : line - y;

        for (let tileX = 0; tileX < 8; tileX++) {
          if (x + tileX >= 0 && x + tileX < 160) {
            const pixelX = xFlip ? 7 - tileX : tileX;
            const byteIndex = tileY * 2;
            const mask = 1 << (7 - pixelX);
            const colorNum =
              (tileData[byteIndex + 1] & mask ? 2 : 0) |
              (tileData[byteIndex] & mask ? 1 : 0);

            // Skip transparent pixels
            if (colorNum === 0) continue;

            const paletteColor = (palette >> (colorNum * 2)) & 0x03;
            const color = this.palette[paletteColor];

            const idx = (line * 160 + x + tileX) * 4;
            this.frameBuffer[idx] = color[0];
            this.frameBuffer[idx + 1] = color[1];
            this.frameBuffer[idx + 2] = color[2];
            this.frameBuffer[idx + 3] = 255;
          }
        }
      }
    }
  }

  clear() {
    this.frameBuffer.fill(255);
  }

  render() {
    this.imageData.data.set(this.frameBuffer);
    this.ctx.putImageData(this.imageData, 0, 0);
  }

  getCanvas() {
    return this.canvas;
  }
}
