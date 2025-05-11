import { default as CPU } from "../src/cpu.js";
import { default as Memory } from "../src/memory.js";

describe("CPU - Decode Instructions", () => {
  let cpu;
  let rom;

  beforeEach(() => {
    rom = new Memory();
    cpu = new CPU(rom);
    cpu.reset(); // Reset CPU state before each test
  });

  describe("Test decoding opcodes", () => {
    test("Opcode output given unprefixed specific code", () => {
      rom.writeByte(0x0000, 0x02);
      cpu.registers.PC = 0x0000;
      const instruction = cpu.decodeInstruction(rom.readByte(cpu.registers.PC));

      expect(instruction.mnemonic).toBe("LD");
    });
  });

  describe("Test decoding opcodes", () => {
    test("Opcode output given prefix specific code", () => {
      rom.writeByte(0x0000, 0xcb);
      rom.writeByte(0x0001, 0x5a);
      cpu.registers.PC = 0x0000;
      const instruction = cpu.decodeInstruction(rom.readByte(cpu.registers.PC));

      expect(instruction.mnemonic).toBe("BIT");
    });
  });

  describe("Test decoding opcodes", () => {
    test("Second opcode output given prefix specific code", () => {
      rom.writeByte(0x0000, 0xcb);
      rom.writeByte(0x0001, 0xcb);
      cpu.registers.PC = 0x0000;
      const instruction = cpu.decodeInstruction(rom.readByte(cpu.registers.PC));

      expect(instruction.mnemonic).toBe("SET");
    });
  });
}),
  describe("CPU - ADD Instructions", () => {
    let cpu;
    let rom;

    beforeEach(() => {
      rom = new Memory();
      cpu = new CPU(rom);
      cpu.reset(); // Reset CPU state before each test
    });

    describe("ADD 8-bit Operation", () => {
      test("ADD A, B should add register B to A", () => {
        cpu.registers.A = 0x3a;
        cpu.registers.B = 0xc6;
        cpu.registers.PC = 0x0000;

        rom.writeByte(cpu.registers.PC, 0x80);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x00);
        expect(cpu.getFlag("Z")).toBe(true); // Zero flag should be set
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(true); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(true); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0x0001);
        expect(cpu.clock).toBe(4);
      });
    });

    describe("ADD 16-bit Operation", () => {
      test("ADD BC, HL should add BC to HL", () => {
        cpu.registers.H = 0x06;
        cpu.registers.L = 0x05;
        cpu.registers.B = 0x8a;
        cpu.registers.C = 0x23;
        cpu.registers.PC = 0x0000;

        rom.writeByte(cpu.registers.PC, 0x09);

        cpu.executeInstruction();

        expect(cpu.registers.H).toBe(0x90);
        expect(cpu.registers.L).toBe(0x28); // 0x23 + 0x05 = 0x28
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(true); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(false); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0x0001);
        expect(cpu.clock).toBe(8);
      });
    });
  }),
  describe("CPU - LD Instructions", () => {
    let cpu;
    let rom;

    beforeEach(() => {
      rom = new Memory();
      cpu = new CPU(rom);
      cpu.reset(); // Reset CPU state before each test
    });

    describe("LD B, A", () => {
      test("LD should load the value in register on the right into register on the left", () => {
        cpu.registers.A = 0x8a;
        cpu.registers.B = 0x23;
        cpu.registers.PC = 0x0000;

        rom.writeByte(cpu.registers.PC, 0x47);

        cpu.executeInstruction();

        expect((cpu.registers.A = "0x23"));
        expect(cpu.registers.PC).toBe(0x0001);
        expect(cpu.clock).toBe(4);
      });
    });

    describe("LD HL+, A", () => {
      test("LD HL+, A should load A into memory at HL and increment HL", () => {
        cpu.registers.H = 0x8a;
        cpu.registers.L = 0x23;
        cpu.registers.A = 0x5a;
        cpu.registers.PC = 0x0000;

        rom.writeByte(cpu.registers.PC, 0x22);

        cpu.executeInstruction();

        expect(rom.readByte(0x8a23)).toBe(0x5a); // Memory at HL should be 0x5A
        expect(cpu.registers.H).toBe(0x8a);
        expect(cpu.registers.L).toBe(0x24); // HL should be incremented to 0x8A24
        expect(cpu.registers.PC).toBe(0x0001);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("LD A, HL-", () => {
      test("LD A, HL- should load HL into memory at A and decrement HL", () => {
        cpu.registers.H = 0x8a;
        cpu.registers.L = 0x23;
        cpu.registers.A = 0x5a;

        rom.writeByte(0x8a23, 0x42);
        cpu.registers.PC = 0x0000;

        rom.writeByte(cpu.registers.PC, 0x3a);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x42); // Memory at A should be value held at 0x5A
        expect(cpu.registers.H).toBe(0x8a);
        expect(cpu.registers.L).toBe(0x22); // HL should be decremented to 0x8A23
        expect(cpu.registers.PC).toBe(0x0001);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("LD r16, n16", () => {
      test("LD r16, n16 should load n16 into memory at r16(BC in this case)", () => {
        rom.writeByte(0x0000, 0x01);
        rom.writeByte(0x0001, 0x34);
        rom.writeByte(0x0002, 0x12);

        cpu.registers.PC = 0x0000;

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0x12);
        expect(cpu.registers.C).toBe(0x34);
        expect(cpu.registers.PC).toBe(0x0003);
        expect(cpu.clock).toBe(12);
      });
    });
  });
