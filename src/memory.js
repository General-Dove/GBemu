export class Memory {
    constructor() {
        this.memory = new Uint8Array(65536) // 64KB of memory
        this.memory.fill(0)
    }

    readByte(address) {
        return this.memory[address]
    }

    writeByte(address, value) {
        this.memory[address] = value
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