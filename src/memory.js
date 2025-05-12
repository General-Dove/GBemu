import fs from "fs";

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

   loadROM(filepath) {
    try {
      const romData = fs.readFileSync(filepath);
      
      console.log("First 16 bytes of ROM: ");
      for (let i = 0; i < 16; i++) {
        console.log(`0x${i.toString(16).padStart(2, "0")}: 0x${romData[i].toString(16).padStart(2, "0")}`);
      }

      for (let i = 0; i < 0x4000 && i < romData.length; i++) {
        this.rom0[i] = romData[i];
      }

      for (let i = 0; i < 0x4000 && (i + 0x4000) < romData.length; i++) {
        this.romx[i] = romData[i + 0x4000];
      }

      console.log(`Loaded ROM: ${filepath}, size: ${romData.length}`);
      console.log("Verifying memory at 0x100:");
      console.log(`0x100: 0x${this.readByte(0x100).toString(16).padStart(2, "0")}`);
      console.log(`0x101: 0x${this.readByte(0x100).toString(16).padStart(2, "0")}`);
      console.log(`0x102: 0x${this.readByte(0x100).toString(16).padStart(2, "0")}`);
    } catch (error) {
      throw new Error(`Failed to load ROM: ${error.message}`);
    }
  }
}

export default Memory;
