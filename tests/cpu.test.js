import { default as CPU } from '../src/cpu.js';
import { default as Memory } from '../src/memory.js';

describe('CPU - ADD Instructions', () => {
    let cpu;
    let rom;

    beforeEach(() => {
        rom= new Memory();
        cpu = new CPU(rom);
        cpu.reset(); // Reset CPU state before each test
    })

    describe('ADD A, r8', () => {
        test('ADD A, B should add register B to A', () => {
            cpu.registers.A = 0x3A
            cpu.registers.B = 0xC6

            cpu.ADD([
                {name: 'A', immediate: true},
                {name: 'B', immediate: true}
            ])

            expect(cpu.registers.A).toBe(0x00)
            expect(cpu.getFlag('Z')).toBe(true) // Zero flag should be set
            expect(cpu.getFlag('N')).toBe(false) // Subtract flag should be reset
            expect(cpu.getFlag('H')).toBe(true) // Half carry flag should be set
            expect(cpu.getFlag('C')).toBe(true) // Carry flag should be set
        })
    })

    describe('ADD HL, rr (16-but operation)', () => {
        test('ADD HL, BC should add BC to HL', () => {
            cpu.registers.H = 0x8A
            cpu.registers.L = 0x23
            cpu.registers.B = 0x06
            cpu.registers.C = 0x05

            cpu.ADD([
                {name: 'HL', immediate: true},
                {name: 'BC', immediate: true}
            ])

            expect(cpu.registers.H).toBe(0x90)
            expect(cpu.registers.L).toBe(0x28) // 0x23 + 0x05 = 0x28
            expect(cpu.getFlag('N')).toBe(false) // Subtract flag should be reset
            expect(cpu.getFlag('H')).toBe(true) // Half carry flag should be set
            expect(cpu.getFlag('C')).toBe(false) // Carry flag should be set
        })
    })
})