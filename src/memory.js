
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
    this.oam = new Uint8Array(0xA0);
    // I/O Registers (0xFF00 - 0xFF7F)
    this.io = new Uint8Array(0x80);
    // High RAM (0xFF80 - 0xFFFE)
    this.hram = new Uint8Array(0x7F);
    // Interrupt Enable Register (0xFFFF)
    this.ie = 0;
  }

  readByte(address) {
    address = address & 0xFFFF;

    // Map address to correct memory region
    if (address < 0x4000) {
      return this.rom0[address];
    } else if (address < 0x8000) {
      return this.romx[address - 0x4000];
    } else if (address < 0xA000) {
      return this.vram[address - 0x8000];
    } else if (address < 0xC000) {
      return this.eram[address - 0xA000];
    } else if (address < 0xD000) {
      return this.wram[address - 0xC000];
    } else if (address < 0xFE00) {
      return this.wram[address - 0xE000];
    } else if (address < 0xFEA0) {
      return this.oam[address - 0xFE00];
    } else if (address < 0xFF00) {
      return 0xFF;
    } else if (address < 0xFF80) {
      return this.io[address - 0xFF00];
    } else if (address < 0xFFFF) {
      return this.hram[address - 0xFF80];
    } else {
      return this.ie;
    }
  }

  writeByte(address, value) {
    address = address & 0xFFFF;
    value = value & 0xFF;

    if (address < 0x8000) {
      return;
    } else if (address < 0xA000) {
      this.vram[address - 0x8000] = value;
    } else if (address < 0xC000) {
      this.eram[address - 0xA000] = value;
    } else if (address < 0xE000) {
      this.wram[address - 0xC000] = value;
    } else if (address < 0xFE00) {
      this.wram[address - 0xE000] = value;
    } else if (address < 0xFEA0) {
      this.oam[address - 0xFE00] = value;
    } else if (address < 0xFF00) {
      return;
    } else if (address < 0xFF80) {
      this.io[address - 0xFF00] = value;
    } else if (address < 0xFFFF) {
      this.hram[address - 0xFF80] = value;
    } else {
      this.ie = value;
    }
  }

  getTileData(tileIndex, useSignedAddressing = false) {
    let baseAddress;
    if (useSignedAddressing) {
      const signedIndex = (tileIndex & 0x80) ?  -(256 - tileIndex) : tileIndex;
      baseAddress = 0x9000 + (signedIndex * 16);
    } else {
      baseAddress = 0x8000 + (tileIndex * 16);
    }

    const tileData = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      tileData[i] = this.readByte(baseAddress + i);
    }

    return tileData;
  }

  getBackgroundMapAddress() {
    return (this.io[0x40] & 0x08) ? 0x9C00 : 0x9800;
  }

  getTileDataAddress() {
    return (this.io[0x40] & 0x10) ? 0x8000 : 0x8800;
  }

   loadROM(data) {
    try {
      const romData = new Uint8Array(data);

      // Clear all memory
      this.vram.fill(0);
      this.eram.fill(0);
      this.wram.fill(0);
      this.oam.fill(0);
      this.io.fill(0);
      this.hram.fill(0);

      // Load ROM bank 0
      for (let i = 0; i < 0x4000 && i < romData.length; i++) {
        this.rom0[i] = romData[i];
      }

      // Load ROM bank 1
      for (let i = 0; i < 0x4000 && (i + 0x4000) < romData.length; i++) {
        this.romx[i] = romData[i + 0x4000];
      }

      // Nintendo logo area in VRAM
      for (let i = 0; i < 48; i++) {
        this.vram[i] = romData[0x104 + i];
      }

      // Initialize critical PPU registers
      this.io[0x40] = 0x91; // Enable LCD and background
      this.io[0x41] = 0x00; // STAT
      this.io[0x42] = 0x00; // SCY
      this.io[0x43] = 0x00; // SCX
      this.io[0x47] = 0xFC; // BGP - Background palette
      this.io[0x48] = 0xFF; // OBP0
      this.io[0x49] = 0xFF; // OBP1

      console.log(`Loaded ROM, size: ${romData.length}`);

    } catch (error) {
      console.error("Failed to load ROM:", error);
      throw error;
    }
  }
}
