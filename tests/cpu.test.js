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
      memory.writeByte(0xc000, 0x02);
      cpu.registers.PC = 0xc000;
      const instruction = cpu.decodeInstruction(
        memory.readByte(cpu.registers.PC)
      );

      expect(instruction.mnemonic).toBe("LD");
    });
  });

  describe("Test decoding opcodes", () => {
    test("Opcode output given prefix specific code", () => {
      memory.writeByte(0xc000, 0xcb);
      memory.writeByte(0xc001, 0x5a);
      cpu.registers.PC = 0xc000;
      const instruction = cpu.decodeInstruction(
        memory.readByte(cpu.registers.PC)
      );

      expect(instruction.mnemonic).toBe("BIT");
    });
  });

  describe("Test decoding opcodes", () => {
    test("Second opcode output given prefix specific code", () => {
      memory.writeByte(0xc000, 0xcb);
      memory.writeByte(0xc001, 0xcb);
      cpu.registers.PC = 0xc000;
      const instruction = cpu.decodeInstruction(
        memory.readByte(cpu.registers.PC)
      );

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
        cpu.registers.PC = 0xc000;

        memory.writeByte(cpu.registers.PC, 0x80);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x00);
        expect(cpu.getFlag("Z")).toBe(true); // Zero flag should be set
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(true); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(true); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(4);
      });
    });

    describe("ADD 8-bit Operation", () => {
      test("ADD A, HL should add register HL to A", () => {
        cpu.registers.A = 0x3a;
        cpu.registers.H = 0xc6;
        cpu.registers.L = 0x44;
        cpu.registers.PC = 0xc000;

        memory.writeByte(cpu.registers.PC, 0x86);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x7e);
        expect(cpu.getFlag("Z")).toBe(false); // Zero flag should be set
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(false); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(true); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("ADD 16-bit Operation", () => {
      test("ADD BC, HL should add BC to HL", () => {
        cpu.registers.H = 0x06;
        cpu.registers.L = 0x05;
        cpu.registers.B = 0x8a;
        cpu.registers.C = 0x23;
        cpu.registers.PC = 0xc000;

        memory.writeByte(cpu.registers.PC, 0x09);

        cpu.executeInstruction();

        expect(cpu.registers.H).toBe(0x90);
        expect(cpu.registers.L).toBe(0x28); // 0x23 + 0x05 = 0x28
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(true); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(false); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("ADD 16-bit Operation", () => {
      test("ADD SP, HL should add SP to HL", () => {
        cpu.registers.H = 0xc6;
        cpu.registers.L = 0x05;
        cpu.registers.SP = 0x8a23;
        cpu.registers.PC = 0xc000;

        memory.writeByte(cpu.registers.PC, 0x39);

        cpu.executeInstruction();

        expect(cpu.registers.H).toBe(0x50);
        expect(cpu.registers.L).toBe(0x28); // 0x23 + 0x05 = 0x28
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(true); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(true); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xc001);
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

    describe("LD 8-bit operation", () => {
      test("LD should load the value in register on the right into register on the left", () => {
        cpu.registers.A = 0x8a;
        cpu.registers.B = 0x23;
        cpu.registers.PC = 0xc000;

        memory.writeByte(cpu.registers.PC, 0x47);

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0x8a);
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(4);
      });
    });

    describe("LD + increment/decrement operation", () => {
      test("LD HL+, A should load A into memory at HL and increment HL", () => {
        cpu.registers.H = 0x8a;
        cpu.registers.L = 0x23;
        cpu.registers.A = 0x5a;
        cpu.registers.PC = 0xc000;

        memory.writeByte(cpu.registers.PC, 0x22);

        cpu.executeInstruction();

        expect(memory.readByte(0x8a23)).toBe(0x5a); // Memory at HL should be 0x5A
        expect(cpu.registers.H).toBe(0x8a);
        expect(cpu.registers.L).toBe(0x24); // HL should be incremented to 0x8A24
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("LD + increment/decrement operation", () => {
      test("LD A, HL- should load HL into memory at A and decrement HL", () => {
        cpu.registers.H = 0x8a;
        cpu.registers.L = 0x23;
        cpu.registers.A = 0x5a;

        memory.writeByte(0x8a23, 0x42);
        cpu.registers.PC = 0xc000;

        memory.writeByte(cpu.registers.PC, 0x3a);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x42); // Memory at A should be value held at 0x5A
        expect(cpu.registers.H).toBe(0x8a);
        expect(cpu.registers.L).toBe(0x22); // HL should be decremented to 0x8A23
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("LD 16-bit operation", () => {
      test("LD r16, n16 should load n16 into memory at r16(BC in this case)", () => {
        memory.writeByte(0xc000, 0x01);
        memory.writeByte(0xc001, 0x34);
        memory.writeByte(0xc002, 0x12);

        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0x12);
        expect(cpu.registers.C).toBe(0x34);
        expect(cpu.registers.PC).toBe(0xc003);
        expect(cpu.clock).toBe(12);
      });
    });

    describe("LD 8-bit operation", () => {
      test("LD HL, n8 should load n8 into memory at HL", () => {
        memory.writeByte(0xc000, 0x36);
        memory.writeByte(0xc001, 0x52);

        cpu.registers.H = 0xc5;
        cpu.registers.L = 0x12;
        const address = (cpu.registers.H << 8) | cpu.registers.L;

        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(memory.readByte(address)).toBe(0x52);
        expect(cpu.registers.PC).toBe(0xc002);
        expect(cpu.clock).toBe(12);
      });
    });

    describe("LD 8-bit operation", () => {
      test("LD r8, n8 should load n8 into memory at given 8-bit register", () => {
        memory.writeByte(0xc000, 0x06);
        memory.writeByte(0xc001, 0x52);

        cpu.registers.B = 0xc5;

        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0x52);
        expect(cpu.registers.PC).toBe(0xc002);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("LD 8-bit operation", () => {
      test("LD HL, r8 should load value of some register(r8) into memory at HL", () => {
        memory.writeByte(0xc000, 0x77);

        cpu.registers.H = 0xc5;
        cpu.registers.L = 0x12;
        cpu.registers.A = 0x45;

        const address = (cpu.registers.H << 8) | cpu.registers.L;

        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(memory.readByte(address)).toBe(0x45);
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("LD 16-bit operation", () => {
      test("LD a16, SP should load value of SP into memory at address indicated by next two bytes", () => {
        memory.writeByte(0xc000, 0x08);
        memory.writeByte(0xc001, 0x34);
        memory.writeByte(0xc002, 0xc2);

        cpu.registers.SP = 0xc042;
        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(memory.readByte(0xc234)).toBe(0x42);
        expect(memory.readByte(0xc235)).toBe(0xc0);
        expect(cpu.registers.PC).toBe(0xc003);
        expect(cpu.clock).toBe(20);
      });
    });

    describe("LD 8-bit operation", () => {
      test("LD a16, A should load value of A into memory at address indicated by next two bytes", () => {
        memory.writeByte(0xc000, 0xea);
        memory.writeByte(0xc001, 0x34);
        memory.writeByte(0xc002, 0xc2);

        cpu.registers.A = 0x42;
        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(memory.readByte(0xc234)).toBe(0x42);
        expect(cpu.registers.PC).toBe(0xc003);
        expect(cpu.clock).toBe(16);
      });
    });
  }),
  describe("CPU - INC Instructions", () => {
    let cpu;
    let memory;

    beforeEach(() => {
      memory = new Memory();
      cpu = new CPU(memory);
      cpu.reset(); // Reset CPU state before each test
    });

    describe("INC 8-bit register", () => {
      test("INC register B by 1", () => {
        memory.writeByte(0xc000, 0x04);

        cpu.registers.B = 0x42;
        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0x43);
        expect(cpu.getFlag("Z")).toBe(false);
        expect(cpu.getFlag("N")).toBe(false);
        expect(cpu.getFlag("H")).toBe(false);
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(4);
      });
    });

    describe("INC 8-bit register", () => {
      test("INC register B by 1, half carry flag true", () => {
        memory.writeByte(0xc000, 0x04);

        cpu.registers.B = 0xff;
        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0x00);
        expect(cpu.getFlag("Z")).toBe(true);
        expect(cpu.getFlag("N")).toBe(false);
        expect(cpu.getFlag("H")).toBe(true);
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(4);
      });
    });

    describe("INC 16-bit register", () => {
      test("INC register BC by 1", () => {
        memory.writeByte(0xc000, 0x03);

        cpu.registers.B = 0x55;
        cpu.registers.C = 0x90;
        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0x55);
        expect(cpu.registers.C).toBe(0x91);
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("INC 16-bit register", () => {
      test("INC register BC by 1, with a carry over", () => {
        memory.writeByte(0xc000, 0x03);

        cpu.registers.B = 0x55;
        cpu.registers.C = 0xff;
        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0x56);
        expect(cpu.registers.C).toBe(0x00);
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(8);
      });
    });
  }),
  describe("CPU - DEC Instructions", () => {
    let cpu;
    let memory;

    beforeEach(() => {
      memory = new Memory();
      cpu = new CPU(memory);
      cpu.reset(); // Reset CPU state before each test
    });

    describe("DEC 8-bit register", () => {
      test("DEC register B by 1", () => {
        memory.writeByte(0xc000, 0x05);

        cpu.registers.B = 0x42;
        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0x41);
        expect(cpu.getFlag("Z")).toBe(false);
        expect(cpu.getFlag("N")).toBe(true);
        expect(cpu.getFlag("H")).toBe(false);
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(4);
      });
    });

    describe("DEC 8-bit register", () => {
      test("DEC register B by 1, half carry flag true", () => {
        memory.writeByte(0xc000, 0x05);

        cpu.registers.B = 0x00;
        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0xff);
        expect(cpu.getFlag("Z")).toBe(false);
        expect(cpu.getFlag("N")).toBe(true);
        expect(cpu.getFlag("H")).toBe(true);
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(4);
      });
    });

    describe("DEC 16-bit register", () => {
      test("DEC register BC by 1", () => {
        memory.writeByte(0xc000, 0x0b);

        cpu.registers.B = 0x55;
        cpu.registers.C = 0x90;
        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0x55);
        expect(cpu.registers.C).toBe(0x8f);
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("DEC 16-bit register", () => {
      test("DEC register BC by 1, with a carry over", () => {
        memory.writeByte(0xc000, 0x0b);

        cpu.registers.B = 0x55;
        cpu.registers.C = 0x00;
        cpu.registers.PC = 0xc000;

        cpu.executeInstruction();

        expect(cpu.registers.B).toBe(0x54);
        expect(cpu.registers.C).toBe(0xff);
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(8);
      });
    });
  }),
  describe("CPU - SUB Instructions", () => {
    let cpu;
    let memory;

    beforeEach(() => {
      memory = new Memory();
      cpu = new CPU(memory);
      cpu.reset(); // Reset CPU state before each test
    });

    describe("SUB 8-bit Operation", () => {
      test("SUB A, B should subtract register B from A", () => {
        cpu.registers.A = 0x3a;
        cpu.registers.B = 0xc6;
        cpu.registers.PC = 0xc000;

        memory.writeByte(cpu.registers.PC, 0x90);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x74);
        expect(cpu.getFlag("Z")).toBe(false); // Zero flag should be set
        expect(cpu.getFlag("N")).toBe(true); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(false); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(true); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(4);
      });
    });

    describe("SUB 8-bit Operation", () => {
      test("SUB A, HL should subtract register HL from A", () => {
        cpu.registers.A = 0x3a;
        cpu.registers.H = 0xc6;
        cpu.registers.L = 0x44;
        cpu.registers.PC = 0xc000;

        memory.writeByte(cpu.registers.PC, 0x96);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0xf6);
        expect(cpu.getFlag("Z")).toBe(false); // Zero flag should be set
        expect(cpu.getFlag("N")).toBe(true); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(false); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(true); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(8);
      });
    });
  }),
  describe("CPU - AND Instructions", () => {
    let cpu;
    let memory;

    beforeEach(() => {
      memory = new Memory();
      cpu = new CPU(memory);
      cpu.reset(); // Reset CPU state before each test
    });

    describe("AND Bitwise Operation", () => {
      test("AND A, n8 should set A to the bitwise AND between the value in n8 and A", () => {
        cpu.registers.A = 0x3a;
        cpu.registers.PC = 0xc000;

        memory.writeByte(0xc001, 0x69);
        memory.writeByte(cpu.registers.PC, 0xe6);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x28);
        expect(cpu.getFlag("Z")).toBe(false); // Zero flag should be set
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(true); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(false); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xc002);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("AND Bitwise Operation", () => {
      test("AND A, HL should set A to the bitwise AND between the value in HL and A", () => {
        cpu.registers.A = 0x3a;
        cpu.registers.H = 0xc3;
        cpu.registers.L = 0x62;
        cpu.registers.PC = 0xc000;

        memory.writeByte(0xc362, 0x69);
        memory.writeByte(cpu.registers.PC, 0xa6);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x28);
        expect(cpu.getFlag("Z")).toBe(false); // Zero flag should be set
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(true); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(false); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(8);
      });
    });
  }),
  describe("CPU - OR Instructions", () => {
    let cpu;
    let memory;

    beforeEach(() => {
      memory = new Memory();
      cpu = new CPU(memory);
      cpu.reset(); // Reset CPU state before each test
    });

    describe("OR Bitwise Operation", () => {
      test("OR A, n8 should set A to the bitwise OR between the value in n8 and A", () => {
        cpu.registers.A = 0x3a;
        cpu.registers.PC = 0xc000;

        memory.writeByte(0xc001, 0x69);
        memory.writeByte(cpu.registers.PC, 0xF6);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x7B);
        expect(cpu.getFlag("Z")).toBe(false); // Zero flag should be set
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(false); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(false); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xc002);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("OR Bitwise Operation", () => {
      test("OR A, HL should set A to the bitwise OR between the value in HL and A", () => {
        cpu.registers.A = 0x3a;
        cpu.registers.H = 0xc3;
        cpu.registers.L = 0x62;
        cpu.registers.PC = 0xc000;

        memory.writeByte(0xc362, 0x69);
        memory.writeByte(cpu.registers.PC, 0xB6);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x7B);
        expect(cpu.getFlag("Z")).toBe(false); // Zero flag should be set
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(false); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(false); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(8);
      });
    });
  }),
  describe("CPU - XOR Instructions", () => {
    let cpu;
    let memory;

    beforeEach(() => {
      memory = new Memory();
      cpu = new CPU(memory);
      cpu.reset(); // Reset CPU state before each test
    });

    describe("XOR Bitwise Operation", () => {
      test("XOR A, n8 should set A to the bitwise XOR between the value in n8 and A", () => {
        cpu.registers.A = 0x3a;
        cpu.registers.PC = 0xc000;

        memory.writeByte(0xc001, 0x69);
        memory.writeByte(cpu.registers.PC, 0xEE);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x53);
        expect(cpu.getFlag("Z")).toBe(false); // Zero flag should be set
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(false); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(false); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xc002);
        expect(cpu.clock).toBe(8);
      });
    });

    describe("XOR Bitwise Operation", () => {
      test("XOR A, HL should set A to the bitwise XOR between the value in HL and A", () => {
        cpu.registers.A = 0x3a;
        cpu.registers.H = 0xc3;
        cpu.registers.L = 0x62;
        cpu.registers.PC = 0xc000;

        memory.writeByte(0xc362, 0x69);
        memory.writeByte(cpu.registers.PC, 0xAE);

        cpu.executeInstruction();

        expect(cpu.registers.A).toBe(0x53);
        expect(cpu.getFlag("Z")).toBe(false); // Zero flag should be set
        expect(cpu.getFlag("N")).toBe(false); // Subtract flag should be reset
        expect(cpu.getFlag("H")).toBe(false); // Half carry flag should be set
        expect(cpu.getFlag("C")).toBe(false); // Carry flag should be set
        expect(cpu.registers.PC).toBe(0xc001);
        expect(cpu.clock).toBe(8);
      });
    });
  }),
  describe("CPU - XOR Instructions", () => {
    let cpu;
    let memory;

    beforeEach(() => {
      memory = new Memory();
      cpu = new CPU(memory);
      cpu.reset(); // Reset CPU state before each test
    });

    describe("JP(jump) Operation", () => {
      test("JP HL should set current PC to address of value held by HL", () => {
        cpu.registers.H = 0xc3;
        cpu.registers.L = 0x62;
        cpu.registers.PC = 0xc000;

        memory.writeByte(0xc362, 0x69);
        memory.writeByte(cpu.registers.PC, 0xE9);

        cpu.executeInstruction();

        expect(cpu.registers.PC).toBe(0x69);
        expect(cpu.clock).toBe(4);
      });
    });

    describe("JP(jump) Operation", () => {
      test("JP a16 should set current PC to address of a16", () => {
        cpu.registers.PC = 0xc000;

        memory.writeByte(0xc001, 0x69);
        memory.writeByte(0xc002, 0x45);
        memory.writeByte(cpu.registers.PC, 0xC3);

        cpu.executeInstruction();

        expect(cpu.registers.PC).toBe(0x4569);
        expect(cpu.clock).toBe(16);
      });
    });

    describe("JP(jump) Operation", () => {
      test("JP NZ, a16 should set current PC to address of a16 only if the Z flag is not set", () => {
        cpu.registers.PC = 0xc000;

        memory.writeByte(0xc001, 0x69);
        memory.writeByte(0xc002, 0x45);
        memory.writeByte(cpu.registers.PC, 0xC2);

        cpu.executeInstruction();

        expect(cpu.getFlag("Z")).toBe(true);
        expect(cpu.registers.PC).toBe(0xc003);
        expect(cpu.clock).toBe(12);
      });
    });

  });
