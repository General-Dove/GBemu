export class Memory {
  constructor() {
    // ROM bank 0 (0x0000 - 0x3FFF)
    this.rom0 = new Uint8Array(0x4000);
    // Switchable ROM bank (0x4000 - 0x7FFF)
    this.romx = new Uint8Array(0x4000);
    // VRAM (0x8000 - 0x9FFF)
    this.vram = new Uint8Array(0x2000);
    // External RAM (0xA000 - 0xBFFF)
    this.eram = new Uint8Array(0x2000);
    // Work RAM (0xC000 - 0xDFFF)
    this.wram = new Uint8Array(0x2000);
    // Sprite Attribute Memory (0xFE00 - 0xFE9F)
    this.oam = new Uint8Array(0xa0);
    // I/O Registers (0xFF00 - 0xFF7F)
    this.io = new Uint8Array(0x80);
    // High RAM (0xFF80 - 0xFFFE)
    this.hram = new Uint8Array(0x7f);
    // Interrupt Enable Register (0xFFFF)
    this.ie = 0;
  }

  readByte(address) {
    address = address & 0xffff;

    // Map address to correct memory region
    if (address < 0x4000) {
      return this.rom0[address];
    } else if (address < 0x8000) {
      return this.romx[address - 0x4000];
    } else if (address < 0xa000) {
      return this.vram[address - 0x8000];
    } else if (address < 0xc000) {
      return this.eram[address - 0xa000];
    } else if (address < 0xd000) {
      return this.wram[address - 0xc000];
    } else if (address < 0xfe00) {
      return this.wram[address - 0xe000];
    } else if (address < 0xfea0) {
      return this.oam[address - 0xfe00];
    } else if (address < 0xff00) {
      return 0xff;
    } else if (address < 0xff80) {
      return this.io[address - 0xff00];
    } else if (address < 0xffff) {
      return this.hram[address - 0xff80];
    } else {
      return this.ie;
    }
  }

  writeByte(address, value) {
    address = address & 0xffff;
    value = value & 0xff;

    if (address < 0x8000) {
      return;
    } else if (address < 0xa000) {
      this.vram[address - 0x8000] = value;
    } else if (address < 0xc000) {
      this.eram[address - 0xa000] = value;
    } else if (address < 0xe000) {
      this.wram[address - 0xc000] = value;
    } else if (address < 0xfe00) {
      this.wram[address - 0xe000] = value;
    } else if (address < 0xfea0) {
      this.oam[address - 0xfe00] = value;
    } else if (address < 0xff00) {
      return;
    } else if (address < 0xff80) {
      this.io[address - 0xff00] = value;
    } else if (address < 0xffff) {
      this.hram[address - 0xff80] = value;
    } else {
      this.ie = value;
    }
  }

  getTileData(tileIndex, useSignedAddressing = false) {
    // Calculate base address for tile data
    let baseAddress;
    if (useSignedAddressing) {
      // Convert to signed value (-128 to 127)
      const signedIndex = tileIndex & 0x80 ? -(256 - tileIndex) : tileIndex;
      baseAddress = 0x9000 + signedIndex * 16;
    } else {
      baseAddress = 0x8000 + tileIndex * 16;
    }

    // Read tile data directly from VRAM
    const tileData = new Uint8Array(16);
    const vramAddr = baseAddress - 0x8000;

    for (let i = 0; i < 16; i++) {
      // Check reading is within VRAM bounds
      if (vramAddr + i >= 0 && vramAddr + i < 0x2000) {
        tileData[i] = this.vram[vramAddr + i];
      }
    }

    return tileData;
  }

  getBackgroundMapAddress() {
    return this.io[0x40] & 0x08 ? 0x9c00 : 0x9800;
  }

  getTileDataAddress() {
    return this.io[0x40] & 0x10 ? 0x8000 : 0x8800;
  }

  verifyROMData() {
    // Check Nintendo logo data (should be present in every valid ROM)
    const logoStart = 0x104;
    const expectedLogo = [
      0xce, 0xed, 0x66, 0x66, 0xcc, 0x0d, 0x00, 0x0b, 0x03, 0x73, 0x00, 0x83,
      0x00, 0x0c, 0x00, 0x0d,
    ];

    const logoValid = expectedLogo.every(
      (byte, i) => this.rom0[logoStart + i] === byte
    );

    console.log({
      logoValid,
      firstTileData: Array.from(this.vram.slice(0, 16)).map((b) =>
        b.toString(16)
      ),
      lcdcValue: this.io[0x40].toString(16),
      bgpValue: this.io[0x47].toString(16),
    });
    return logoValid;
  }

  loadROM(data) {
    try {
      const romData = new Uint8Array(data);

      // Log ROM header information
      const title = new TextDecoder()
        .decode(romData.slice(0x134, 0x143))
        .replace(/\0+$/, "");
      const cartridgeType = romData[0x147];
      const romSize = romData[0x148];

      console.log("ROM Info:", {
        title,
        cartridgeType: `0x${cartridgeType.toString(16)}`,
        romSize: `${32 << romSize}KB`,
      });

      // Clear all memory
      this.vram.fill(0);
      this.eram.fill(0);
      this.wram.fill(0);
      this.oam.fill(0);
      this.io.fill(0);
      this.hram.fill(0);

      // Load ROM bank 0
      for (let i = 0; i < 0x4000; i++) {
        this.rom0[i] = romData[i] || 0;
      }

      // Load ROM bank 1
      for (let i = 0; i < 0x4000; i++) {
        this.romx[i] = romData[i + 0x4000] || 0;
      }

      // Decode and load Nintendo logo tile data into VRAM
      const logoStart = 0x104;
      for (let tileIndex = 0; tileIndex < 8; tileIndex++) {
        // Nintendo logo is 8 tiles
        const srcOffset = logoStart + tileIndex * 16;
        const destOffset = tileIndex * 16;

        // Each tile is 16 bytes (8 rows * 2 bytes per row)
        for (let byteIndex = 0; byteIndex < 16; byteIndex++) {
          this.vram[destOffset + byteIndex] = romData[srcOffset + byteIndex];
        }
      }
      // Load tiles into VRAM at correct location (0x8800-0x97FF for background)
      const tileDataStart = 0x8800 - 0x8000; // Offset in VRAM
      for (let i = 0; i < 256; i++) {
        // Load 256 tiles
        const tileOffset = tileDataStart + i * 16;
        for (let j = 0; j < 16; j++) {
          this.vram[tileOffset + j] = romData[i * 16 + j] || 0;
        }
      }

      // Set up background tile map (0x9800-0x9BFF)
      const mapStart = 0x9800 - 0x8000; // Offset in VRAM
      for (let i = 0; i < 32 * 32; i++) {
        this.vram[mapStart + i] = i & 0xff; // Sequential tile references
      }

      // Initialize critical PPU registers
      this.io[0x40] = 0x91; // Enable LCD and background
      this.io[0x41] = 0x00; // STAT
      this.io[0x42] = 0x00; // SCY
      this.io[0x43] = 0x00; // SCX
      this.io[0x44] = 0x00; // LY
      this.io[0x45] = 0x00; // LYX
      this.io[0x47] = 0xe4; // BGP - Background palette
      this.io[0x48] = 0xff; // OBP0
      this.io[0x49] = 0xff; // OBP1
      this.io[0x4a] = 0x00; // WY
      this.io[0x4b] = 0x00; // WX

      // Add detailed debug logging
      console.log("ROM Load Debug:", {
        logoTiles: Array.from(this.vram.slice(0, 16 * 8)) // Show all 8 logo tiles
          .map((b) => b.toString(16).padStart(2, "0"))
          .reduce((acc, val, i) => {
            const tileIndex = Math.floor(i / 16);
            if (!acc[tileIndex]) acc[tileIndex] = [];
            acc[tileIndex].push(val);
            return acc;
          }, []),
        lcdcValue: "0x" + this.io[0x40].toString(16),
        bgpValue: "0x" + this.io[0x47].toString(16),
        tileMapStart: this.getBackgroundMapAddress().toString(16),
        tileDataStart: this.getTileDataAddress().toString(16),
      });

      // Add debug output to verify tile data
      const firstTile = Array.from(this.vram.slice(0, 16)).map((b) =>
        b.toString(16).padStart(2, "0")
      );
      console.log("First tile data:", firstTile);
      console.log("LCDC value:", this.io[0x40].toString(16));
      console.log("BGP value:", this.io[0x47].toString(16));

      console.log(`Loaded ROM, size: ${romData.length}`);
    } catch (error) {
      console.error("Failed to load ROM:", error);
      throw error;
    }
  }
}
