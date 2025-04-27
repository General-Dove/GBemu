export class Memory {
    constructor() {
        //32kb of ROM (0x0000 - 0x7FFF)
        this.rom = new Uint8Array(32768)
        this.rom.fill(0)
    }

    readByte(address) {
        return this.rom[address]
    }

    writeByte(address, value) {
        this.rom[address] = value
    }

    readWord(address) {
        return (this.readByte(address + 1) << 8) | this.readByte(address)
    }

    writeWord(address, value) {
        this.writeByte(address, value & 0xFF)
        this.writeByte(address + 1, (value >> 8) & 0xFF)
    }
}

export default Memory