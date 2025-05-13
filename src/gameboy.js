import { CPU } from './cpu.js';
import { Memory } from './memory.js';
import { Display } from './display.js';

export class GameBoy {
    constructor() {
        this.memory = new Memory();
        this.cpu = new CPU(this.memory);
        this.display = new Display();
        this.cpu.reset();

        this.ppuMode = 2;
        this.ppuLine = 0;
        this.ppuCycles = 0;

        if (typeof document !== 'undefined') {
            document.body.appendChild(this.display.getCanvas());
        }
    }

    runFrame() {
        const CYCLES_PER_FRAME = 70224;
        let cyclesThisFrame = 0;

        while (cyclesThisFrame < CYCLES_PER_FRAME) {
            const previousCycles = this.cpu.clock;
            this.cpu.executeInstruction();
            const cyclesElapsed = this.cpu.clock - previousCycles;
            cyclesThisFrame += cyclesElapsed;

            this.updateGraphics(cyclesElapsed);
        }

        this.display.render();
    }

    updateGraphics(cycles) {
        this.ppuCycles += cycles;

        switch (this.ppuMode) {
            case 2: 
                if (this.ppuCycles >= 80) {
                    this.ppuCycles -= 80;
                    this.ppuMode = 3;
                }
            break;

            case 3:
                if (this.ppuCycles >= 172) {
                    this.ppuCycles -= 172;
                    this.ppuMode = 0;

                    this.renderScanline(this.ppuLine);
                }
            break;

            case 0:
                if (this.ppuCycles >= 204) {
                    this.ppuCycles -= 204;
                    this.ppuLine++;

                    if (this.ppuLine === 144) {
                        this.ppuMode = 1;

                        this.display.render();
                    } else {
                        this.ppuMode = 2;
                    }
                }
            break;

            case 1:
                if (this.ppuCycles >= 456) {
                    this.ppuCycles -= 456;
                    this.ppuLine++;

                    if (this.ppuLine > 153) {
                        this.ppuMode = 2;
                        this.ppuLine = 0;
                    }
                }

            break;
        }
    }

    renderScanline(line) {
        if (this.memory.readByte(0xFF40) & 0x80) {
            this.display.drawBackground(this.memory);
            this.display.drawSprites(this.memory);
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