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
            [48, 98, 48],   // Dark green
            [15, 56, 15]    // Darkest green
        ];
    }

    drawTile(tileData, x, y) {
        for (let tileY = 0; tileY < 8; tileY++) {
            const low = tileData[tileY * 2];
            const high = tileData[tileY * 2 + 1];

            for (let tileX = 0; tileX < 8; tileX++) {
                const mask = 1 << (7 - tileX);
                const colorNum = ((high & mask) ? 2 : 0) +((low & mask) ? 1 : 0);
                const color = this.palette[colorNum];

                const pixelX = x + tileX;
                const pixelY = y + tileY;

                if (pixelX >= 0 && pixelX < 160 && pixelY >= 0 && pixelY < 144) {
                    const idx = (pixelY * 160 + pixelX) * 4;
                    this.frameBuffer[idx] = color[0];
                    this.frameBuffer[idx + 1] = color[1];
                    this.frameBuffer[idx + 2] = color[2];
                    this.frameBuffer[idx + 3] = 255;
                }
            }
        }
    }

    drawBackground(memory) {
        // Check LCD and background enable bits
        const lcdc = memory.readByte(0xFF40);
        if (!(lcdc & 0x80) || !(lcdc & 0x01)) return;

        // Get scroll positions and addresses
        const scrollX = memory.readByte(0xFF43);
        const scrollY = memory.readByte(0xFF42);
        const bgTileMap = (lcdc & 0x08) ? 0x9C00 : 0x9800;
        const useSignedAddressing = !(lcdc & 0x10);
        const bgp = memory.readByte(0xFF47);

        // Clear framebuffer first
        this.clear();

        // Draw background tile by tile
        for (let tileY = 0; tileY < 19; tileY++) {
            for (let tileX = 0; tileX < 21; tileX++) {
                // Get visible title position including scroll
                const mapX = (tileX + (scrollX >> 3)) & 0x1F;
                const mapY = (tileY + (scrollY >> 3)) & 0x1F;

                // Get tile index from background map
                const tileIndex = memory.readByte(bgTileMap + (mapY * 32) + mapX);

                // Get tile data
                const tileData = memory.getTileData(tileIndex, useSignedAddressing);

                // Get pixel position within tile
                const screenX = (tileX * 8) - (scrollX & 7);
                const screenY = (tileY * 8) - (scrollY & 7);

                // Draw each pixel of the tile
                for (let y = 0; y < 8; y++) {
                    const low = tileData[y * 2];
                    const high = tileData[y * 2 + 1];

                    for (let x = 0; x < 8; x++) {
                        const colorBit = 7 - x;
                        const colorNum = ((high >> colorBit) & 1) << 1 | ((low >> colorBit) & 1);
                        const paletteColor = (bgp >> (colorNum * 2)) & 0x03;
                        const color = this.palette[paletteColor];

                        const pixelX = screenX + x;
                        const pixelY = screenY + y;

                        // Draw visible pixels
                        if (pixelX >= 0 && pixelX < 160 && pixelY >= 0 && pixelY < 144) {
                            const idx = (pixelY * 160 + pixelX) * 4;
                            this.frameBuffer[idx] = color[0];
                            this.frameBuffer[idx + 1] = color[1];
                            this.frameBuffer[idx + 2] = color[2];
                            this.frameBuffer[idx + 3] = 255;
                        }
                    }
                }
            }   
        }
    }

    drawSprites(memory) {
        for (let i = 0; i < 40; i++) {
            const baseAddr = 0xFE00 + i * 4;
            const y = memory.readByte(baseAddr) - 16;
            const x = memory.readByte(baseAddr + 1) - 8;
            const tileIndex = memory.readByte(baseAddr + 2);
            const attributes = memory.readByte(baseAddr + 3);

            if (x < -7 || x > 160 || y < -7 || y > 144) {
                continue;
            }

            const tileData = new Uint8Array(16);
            for (let j = 0; j < 16; j++) {
                tileData[j] = memory.readByte(0x8000 + tileIndex * 16 + j);
            }

            this.drawTile(tileData, x, y);
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