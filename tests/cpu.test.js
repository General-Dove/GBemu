import { default as CPU } from "../src/cpu.js";
import { default as Memory } from "../src/memory.js";

describe("CPU - Decode Instructions", () => {
  let cpu;
  let memory;

  beforeEach(() => {
    memory = new Memory();
    cpu = new CPU(memory);
    cpu.reset(); // Reset CPU state before each test
  });

  describe("Test decoding opcodes", () => {
    test("Opcode output given unprefixed specific code", () => {
      memory.writeByte(0xC000, 0x02);
      cpu.registers.PC = 0xC000;
      const instruction = cpu.decodeInstruction(memory.readByte(cpu.registers.PC));

      expect(instruction.mnemonic).toBe("LD");
    });
  });

  describe("Test decoding opcodes", () => {
    test("Opcode output given prefix specific code", () => {
      memory.writeByte(0xC000, 0xcb);
      memory.writeByte(0xC001, 0x5a);
      cpu.registers.PC = 0xC000;
      const instruction = cpu.decodeInstruction(memory.readByte(cpu.registers.PC));

      expect(instruction.mnemonic).toBe("BIT");
    });
  });

  describe("Test decoding opcodes", () => {
    test("Second opcode output given prefix specific code", () => {
      memory.writeByte(0xC000, 0xcb);
      memory.writeByte(0xC001, 0xcb);
      cpu.registers.PC = 0xC000;
      const instruction = cpu.decodeInstruction(memory.readByte(cpu.registers.PC));

      expect(instruction.mnemonic).toBe("SET");
    });
  });
}),
  describe("CPU - ADD Instructions", () => {
    let cpu;
    let memory;

    beforeEach(() => {
      memory = new Memory();
      cpu = new CPU(memory);
      cpu.reset(); // Reset CPU state before each test
    });

    describe("ADD 8-bit Operation", () => {
      test("ADD A, B should add register B to A", () => {
        cpu.registers.A = 0x3a;
        cpu.registers.B = 0xc6;
        cpu.registers.PC = 0xC000;

        memory.writeByte(cpu.registers.PC, 0x80);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x00);
        expect(cpu.getFlag("Z")).toBe(true); // Zero flag should be set
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(true); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(true); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xC001);
        expect(cpu.clock).toBe(4);
      });
    });

    describe("ADD 16-bit Operation", () => {
      test("ADD BC, HL should add BC to HL", () => {
        cpu.registers.H = 0x06;
        cpu.registers.L = 0x05;
        cpu.registers.B = 0x8a;
        cpu.registers.C = 0x23;
        cpu.registers.PC = 0xC000;

        memory.writeByte(cpu.registers.PC, 0x09);

        cpu.executeInstruction();

        expect(cpu.registers.H).toBe(0x90);
        expect(cpu.registers.L).toBe(0x28); // 0x23 + 0x05 = 0x28
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(true); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(false); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xC001);
        expect(cpu.clock).toBe(8);
      });
    });
  }),
  describe("CPU - LD Instructions", () => {
    let cpu;
    let memory;

    beforeEach(() => {
      memory = new Memory();
      cpu = new CPU(memory);
      cpu.reset(); // Reset CPU state before each test
    });

    describe("LD B, A", () => {
      test("LD should load the value in register on the right into register on the left", () => {
        cpu.registers.A = 0x8a;
        cpu.registers.B = 0x23;
        cpu.registers.PC = 0xC000;

        memory.writeByte(cpu.registers.PC, 0x47);

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0x8a);
        expect(cpu.registers.PC).toBe(0xC001);
        expect(cpu.clock).toBe(4);
      });
    });

    describe("LD HL+, A", () => {
      test("LD HL+, A should load A into memory at HL and increment HL", () => {
        cpu.registers.H = 0x8a;
        cpu.registers.L = 0x23;
        cpu.registers.A = 0x5a;
        cpu.registers.PC = 0xC000;

        memory.writeByte(cpu.registers.PC, 0x22);

        cpu.executeInstruction();

        expect(memory.readByte(0x8a23)).toBe(0x5a); // Memory at HL should be 0x5A
        expect(cpu.registers.H).toBe(0x8a);
        expect(cpu.registers.L).toBe(0x24); // HL should be incremented to 0x8A24
        expect(cpu.registers.PC).toBe(0xC001);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("LD A, HL-", () => {
      test("LD A, HL- should load HL into memory at A and decrement HL", () => {
        cpu.registers.H = 0x8a;
        cpu.registers.L = 0x23;
        cpu.registers.A = 0x5a;

        memory.writeByte(0x8a23, 0x42);
        cpu.registers.PC = 0xC000;

        memory.writeByte(cpu.registers.PC, 0x3a);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x42); // Memory at A should be value held at 0x5A
        expect(cpu.registers.H).toBe(0x8a);
        expect(cpu.registers.L).toBe(0x22); // HL should be decremented to 0x8A23
        expect(cpu.registers.PC).toBe(0xC001);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("LD r16, n16", () => {
      test("LD r16, n16 should load n16 into memory at r16(BC in this case)", () => {
        memory.writeByte(0xC000, 0x01);
        memory.writeByte(0xC001, 0x34);
        memory.writeByte(0xC002, 0x12);

        cpu.registers.PC = 0xC000;

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0x12);
        expect(cpu.registers.C).toBe(0x34);
        expect(cpu.registers.PC).toBe(0xC003);
        expect(cpu.clock).toBe(12);
      });
    });

    describe("LD HL, n8", () => {
      test("LD HL, n8 should load n8 into memory at HL", () => {
        memory.writeByte(0xC000, 0x36);
        memory.writeByte(0xC001, 0x52);

        cpu.registers.H = 0xC5;
        cpu.registers.L = 0x12;
        const address = (cpu.registers.H << 8 | cpu.registers.L);

        cpu.registers.PC = 0xC000;

        cpu.executeInstruction();

        expect(memory.readByte(address)).toBe(0x52);
        expect(cpu.registers.PC).toBe(0xC002);
        expect(cpu.clock).toBe(12);
      });
    });

    describe("LD r8, n8", () => {
      test("LD r8, n8 should load n8 into memory at given 8-bit register", () => {
        memory.writeByte(0xC000, 0x06);
        memory.writeByte(0xC001, 0x52);

        cpu.registers.B = 0x55;

        cpu.registers.PC = 0xC000;

        cpu.executeInstruction();

        expect(memory.readByte(cpu.registers.B)).toBe(0x52);
        expect(cpu.registers.PC).toBe(0xC002);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("LD HL, r8", () => {
      test("LD HL, r8 should load value of some register(r8) into memory at HL", () => {
        memory.writeByte(0xC000, 0x77);

        cpu.registers.H = 0x55;
        cpu.registers.L = 0x12;
        cpu.registers.A = 0x55;

        memory.writeByte(cpu.registers.A, 0x45);
        const address = (cpu.registers.H << 8 | cpu.registers.L);

        cpu.registers.PC = 0xC000;

        cpu.executeInstruction();

        expect(memory.readByte(address)).toBe(0x45);
        expect(cpu.registers.PC).toBe(0xC001);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("LD a16, SP", () => {
      test("LD a16, SP should load value of SP into memory at address indicated by next two bytes", () => {
        memory.writeByte(0xC000, 0x08);
        memory.writeByte(0x0001, 0x34);
        memory.writeByte(0x0002, 0x12);

        cpu.registers.SP = 0x8042;
        cpu.registers.PC = 0xC000;

        cpu.executeInstruction();

        expect(memory.readByte(0x1234)).toBe(0x42);
        expect(memory.readByte(0x12)).toBe(0x80);
        expect(cpu.registers.PC).toBe(0xC003);
        expect(cpu.clock).toBe(20);
      });
    });

    describe("LD a16, A", () => {
      test("LD a16, A should load value of A into memory at address indicated by next two bytes", () => {
        memory.writeByte(0xC000, 0xEA);
        memory.writeByte(0xC001, 0x34);
        memory.writeByte(0xC002, 0x12);

        cpu.registers.A = 0x42;
        cpu.registers.PC = 0xC000;

        cpu.executeInstruction();

        expect(memory.readByte(0x1234)).toBe(0x42);
        expect(cpu.registers.PC).toBe(0xC003);
        expect(cpu.clock).toBe(16);
      });
    });
  });
