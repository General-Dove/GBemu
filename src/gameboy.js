import { CPU } from './cpu.js';
import { Memory } from './memory.js';

class GameBoy {
    constructor(romPath) {
        this.memory = new Memory();
        this.memory.loadROM(romPath);
        this.cpu = new CPU(this.memory);
        this.cpu.reset();
    }

    runFrame() {
        const CYCLES_PER_FRAME = 70224;
        let cyclesThisFrame = 0;

        while (cyclesThisFrame < CYCLES_PER_FRAME) {
            const previousCycles = this.cpu.clock;
            this.cpu.executeInstruction();
            cyclesThisFrame += this.cpu.clock - previousCycles;
        }
    }

    start() {
        const frameTime = 1000 / 60;

        console.log("Starting emulator...");

        setInterval(() => {
            this.runFrame();
        }, frameTime);
    }
}

const romPath = process.argv[2];
if (!romPath) {
    throw new Error("Please provide ROM file path as argument");
}

try {
    const gameboy = new GameBoy(romPath);

    console.log('Initial state:');
    console.log(`PC: 0x${gameboy.cpu.registers.PC.toString(16)}`);
    console.log(`Memory at PC: 0x${gameboy.memory.readByte(gameboy.cpu.registers.PC).toString(16)}`);

    gameboy.start();
} catch (error) {
    console.error("Failed to start emulation:", error.message);
    process.exit(1);
}