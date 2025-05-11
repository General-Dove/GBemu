export class Memory {
  constructor() {
    //64kb of ROM (0x0000 - 0x10000)
    this.rom = new Uint8Array(65536);
    this.rom.fill(0);
  }

  readByte(address) {
    if (address < 0 || address >= this.rom.length) {
      throw new Error(`Memory address out of bounds: ${address}`);
    }

    return this.rom[address];
  }

  writeByte(address, value) {
    if (address < 0 || address >= this.rom.length) {
      throw new Error(`Memory address out of bounds: ${address}`);
    }

    this.rom[address] = value;
  }

  readWord(address) {
    return (this.readByte(address + 1) << 8) | this.readByte(address);
  }

  writeWord(address, value) {
    this.writeByte(address, value & 0xff);
    this.writeByte(address + 1, (value >> 8) & 0xff);
  }
}

export default Memory;
