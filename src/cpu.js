import opcodes from "./opcodes.json" with { type: "json" };
import { Memory } from "./memory.js";

export class CPU {
  constructor(memory) {
    // Registers
    this.registers = {
      A: 0x00, // Accumulator
      F: 0x00, // Flags
      B: 0x00,
      C: 0x00,
      D: 0x00,
      E: 0x00,
      H: 0x00,
      L: 0x00,
      SP: 0x00, // Stack pointer
      PC: 0x00, // Program counter(pointer)
    };

    this.clock = 0;

    this.memory = memory;
  }

  reset() {
    // Reset registers and clock
    this.registers = {
      A: 0x01,
      F: 0xb0,
      B: 0x00,
      C: 0x13,
      D: 0x00,
      E: 0xd8,
      H: 0x01,
      L: 0x4d,
      SP: 0xfffe,
      PC: 0x0100,
    };

    this.clock = 0;
  }

  // Execute a single instruction
  executeInstruction() {
    // Read opcode from memory at current PC
    const opcode = this.memory.readByte(this.registers.PC);

    // Get instruction data from opcodes.json
    const instruction = this.decodeInstruction(opcode);

    if (!instruction) {
      throw new Error(`Unknown opcode: 0x${opcode.toString(16)}`);
    }

    // Update PC and clock
    const oldPC = this.registers.PC;
    this.registers.PC += instruction.bytes;
    this.clock += instruction.cycles[0];

    // Execute the instruction based on mnemonic
    switch (instruction.mnemonic) {
      // No operation
      case "NOP":
        break;
      // Copy value in register on right into register on left
      case "LD":
        this.LD(instruction.operands);
        break;
      // Increment value in register by 1
      case "INC":
        this.INC(instruction.operands[0]);
        break;
      // Decrement value in register by 1
      case "DEC":
        this.DEC(instruction.operands[0]);
        break;
      // Add value from register to A
      case "ADD":
        this.ADD(instruction.operands);
        break;
      // Subtract value from register to A
      case "SUB":
        this.SUB(instruction.operands);
        break;
      // Set A to bitwise AND between value from register to A
      case "AND":
        this.AND(instruction.operands);
        break;
      // Set A to bitwise OR between value from register to A
      case "OR":
        this.OR(instruction.operands);
        break;
      // Set A to bitwise XOR between value from register to A
      case "XOR":
        this.XOR(instruction.operands);
        break;
      // Jump to address
      case "JP":
        this.JP(instruction.operands);
        break;
      // Add value from register & carry flag to A
      case "ADC":
        this.ADC(instruction.operands);
        break;
      // Subtract value from register & carry flag to A
      case "SBC":
        this.SBC(instruction.operands);
        break;
      // Compare value from register to A
      case "CP":
        this.CP(instruction.operands);
        break;
      // Push register into the stack
      case "PUSH":
        this.PUSH(instruction.operands);
        break;
      // Pop register from the stack
      case "POP":
        this.POP(instruction.operands);
        break;
      // Call address
      case "CALL":
        this.CALL(instruction.operands);
        break;
      // Return from subroutine if condition is met
      case "RET":
        this.RET(instruction.operands);
        break;
      // Call address(shorter and faster equivalent to CALL for suitable values)
      case "RST":
        this.RST(instruction.operands);
        break;
      // Relative jump to address
      case "JR":
        this.JR(instruction.operands);
        break;
      // Rotate register A left
      case "RLCA":
        this.RLCA();
        break;
      // Rotate register A right
      case "RRCA":
        this.RRCA();
        break;
      // Rotate register A left, through the carry flag
      case "RLA":
        this.RLA();
        break;
      // Rotate register A right, through the carry flag
      case "RRA":
        this.RRA();
        break;
      // Decimal adjust accumulator
      case "DAA":
        this.DAA();
        break;
      // Complement accumulator(bitwise NOT)
      case "CPL":
        this.CPL();
        break;
      // Set carry flag
      case "SCF":
        this.SCF();
        break;
      // Complement carry flag
      case "CCF":
        this.CCF();
        break;
      // Enter CPU low-power consumption mode until an interrupt occurs
      case "HALT":
        this.HALT();
        break;
      // Enter CPU very low power mode
      case "STOP":
        this.STOP();
        break;
      // Disable interrupts by clearing the IME flag
      case "DI":
        this.DI();
        break;
      // Enable interrupts by setting the IME flag
      case "EI":
        this.EI();
        break;
      // Special byte that indicates extended set of instructions
      case "PREFIX":
        this.handleCBPrefix();
        break;
      // Swap the upper 4 bits in register and the lower 4 ones
      case "SWAP":
        this.SWAP(instruction.operands);
        break;
      // Test specified bit in register, set the flag if bit not set
      case "BIT":
        this.BIT(instruction.operands);
        break;
      // Set specified bit in register to 0(bit 0 is the rightmost, bit 7 is the leftmost)
      case "RES":
        this.RES(instruction.operands);
        break;
      // Set specified bit in register to 1(bit 0 is the rightmost, bit 7 is the leftmost)
      case "SET":
        this.SET(instruction.operands);
        break;
      // Rotate register left
      case "RLC":
        this.RLC(instruction.operands);
        break;
      // Rotate register right
      case "RRC":
        this.RRC(instruction.operands);
        break;
      // Rotate byte left through the carry flag
      case "RL":
        this.RL(instruction.operands);
        break;
      // Rotate byte right through the carry flag
      case "RR":
        this.RR(instruction.operands);
        break;
      // Shift left arithmetically register
      case "SLA":
        this.SLA(instruction.operands);
        break;
      // Shift right arithmetically register
      case "SRA":
        this.SRA(instruction.operands);
        break;
      // Shift left logically register
      case "SRL":
        this.SRL(instruction.operands);
        break;
      // RETI instruction
      case "RETI":
        this.RETI(instruction.operands);
        break;
      // LDH instruction
      case "LDH":
        this.LDH(instruction.operands);
        break;
      // Default case, throw error if no instruction
      default:
        throw new Error(`Unimplemented instruction: ${instruction.mnemonic}`);
    }
  }
  // Helper methods for flag operations
  setFlag(flag, value) {
    switch (flag) {
      case "Z":
        this.registers.F = value
          ? this.registers.F | 0x80
          : this.registers.F & 0x7f;
        break;

      case "N":
        this.registers.F = value
          ? this.registers.F | 0x40
          : this.registers.F & 0xbf;
        break;

      case "H":
        this.registers.F = value
          ? this.registers.F | 0x20
          : this.registers.F & 0xdf;
        break;

      case "C":
        this.registers.F = value
          ? this.registers.F | 0x10
          : this.registers.F & 0xef;
        break;
    }
  }

  getFlag(flag) {
    switch (flag) {
      case "Z":
        return (this.registers.F & 0x80) !== 0;
      case "N":
        return (this.registers.F & 0x40) !== 0;
      case "H":
        return (this.registers.F & 0x20) !== 0;
      case "C":
        return (this.registers.F & 0x10) !== 0;
    }
  }

  // Decode instruction from opcodes.json
  decodeInstruction(opcode) {
    let opcodeHex = `0x${opcode.toString(16).toUpperCase().padStart(2, "0")}`;
    console.log(`Decode opcode: ${opcodeHex}`);

    // Decode intstruction from prefixed opcodes
    if (opcodeHex === "0xCB") {
      const nextByte = this.memory.readByte(this.registers.PC + 1);
      const nextOpcodeHex = `0x${nextByte
        .toString(16)
        .toUpperCase()
        .padStart(2, "0")}`;
      return opcodes.cbprefixed[nextOpcodeHex];
    }

    return opcodes.unprefixed[opcodeHex];
  }

  // Get address of 16-bit registers
  getAddress(operand) {
    switch (operand.name) {
      case "BC":
        return (this.registers.B << 8) | this.registers.C;
      case "DE":
        return (this.registers.D << 8) | this.registers.E;
      case "HL":
        return (this.registers.H << 8) | this.registers.L;
      default:
        throw new Error(
          `Invalid operand for address calculation: ${operand.name}`
        );
    }
  }

  // Add instructions
  ADD(operands) {
    const [dest, source] = operands;

    // Handle 16-bit operations
    switch (dest.name) {
      case "HL": {
        switch (source.name) {
          case "HL": {
            const hl = (this.registers.H << 8) | this.registers.L;
            const value = (this.registers.H << 8) | this.registers.L;
            let result = (hl + value) & 0xffff;
            this.registers.H = (result >> 8) & 0xff;
            this.registers.L = result & 0xff;

            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (hl & 0xfff) + (value & 0xfff) > 0xfff); // Half flag
            this.setFlag("C", hl + value > 0xffff); // Carry flag
            break;
          }
          case "BC": {
            const hl = (this.registers.H << 8) | this.registers.L;
            const value = (this.registers.B << 8) | this.registers.C;
            let result = (hl + value) & 0xffff;
            this.registers.H = (result >> 8) & 0xff;
            this.registers.L = result & 0xff;

            this.setFlag("N", 0); // Subtract flag
            this.setFlag("H", (hl & 0xfff) + (value & 0xfff) > 0xfff); // Half flag
            this.setFlag("C", hl + value > 0xffff); // Carry flag
            break;
          }
          case "DE": {
            const hl = (this.registers.H << 8) | this.registers.L;
            const value = (this.registers.D << 8) | this.registers.E;
            let result = (hl + value) & 0xffff;
            this.registers.H = (result >> 8) & 0xff;
            this.registers.L = result & 0xff;

            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (hl & 0xfff) + (value & 0xfff) > 0xfff); // Half flag
            this.setFlag("C", hl + value > 0xffff); // Carry flag
            break;
          }
          case "HL": {
            const hl = (this.registers.H << 8) | this.registers.L;
            const value = (this.registers.H << 8) | this.registers.L;
            let result = (hl + value) & 0xffff;
            this.registers.H = (result >> 8) & 0xff;
            this.registers.L = result & 0xff;

            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (hl & 0xfff) + (value & 0xfff) > 0xfff); // Half flag
            this.setFlag("C", hl + value > 0xffff); // Carry flag
            break;
          }
          case "SP": {
            const hl = (this.registers.H << 8) | this.registers.L;
            const value = this.registers.SP;
            let result = (hl + value) & 0xffff;
            this.registers.H = (result >> 8) & 0xff;
            this.registers.L = result & 0xff;

            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (hl & 0xfff) + (value & 0xfff) > 0xfff); // Half flag
            this.setFlag("C", hl + value > 0xffff); // Carry flag
            break;
          }
          default:
            throw new Error(`Invalid source for ADD HL: ${source.name}`);
        }
        break;
      }

      // Handle SP + e8 operations
      case "SP": {
        const e8 = this.memory.readByte(this.registers.PC - 1);
        const signedE8 = e8 & 0x80 ? e8 - 256 : e8;
        const result = (this.registers.SP + signedE8) & 0xffff;

        this.setFlag("Z", false); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", (this.registers.SP & 0xf) + (e8 & 0xf) > 0xf); // Half flag
        this.setFlag("C", (this.registers.SP & 0xff) + (e8 & 0xff) > 0xff); // Carry flag

        this.registers.SP = result;
        break;
      }

      // Handle 8-bit operations
      case "A": {
        switch (source.name) {
          case "n8": {
            const value = this.memory.readByte(this.registers.PC - 1);
            const result = (this.registers.A + value) & 0xff;

            this.setFlag("Z", result === 0); // Zero flag
            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (this.registers.A & 0xf) + (value & 0xf) > 0xf); // Half flag
            this.setFlag("C", this.registers.A + value > 0xff); // Carry flag
            this.registers.A = result;
            break;
          }
          case "A": {
            const value = this.registers.A;
            const result = (this.registers.A + value) & 0xff;

            this.setFlag("Z", result === 0); // Zero flag
            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (this.registers.A & 0xf) + (value & 0xf) > 0xf); // Half flag
            this.setFlag("C", this.registers.A + value > 0xff); // Carry flag
            this.registers.A = result;
            break;
          }
          case "B": {
            const value = this.registers.B;
            const result = (this.registers.A + value) & 0xff;

            this.setFlag("Z", result === 0); // Zero flag
            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (this.registers.A & 0xf) + (value & 0xf) > 0xf); // Half flag
            this.setFlag("C", this.registers.A + value > 0xff); // Carry flag
            this.registers.A = result;
            break;
          }

          case "C": {
            const value = this.registers.C;
            const result = (this.registers.A + value) & 0xff;
            this.setFlag("Z", result === 0); // Zero flag
            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (this.registers.A & 0xf) + (value & 0xf) > 0xf); // Half flag
            this.setFlag("C", this.registers.A + value > 0xff); // Carry flag
            this.registers.A = result;
            break;
          }

          case "D": {
            const value = this.registers.D;
            const result = (this.registers.A + value) & 0xff;
            this.setFlag("Z", result === 0); // Zero flag
            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (this.registers.A & 0xf) + (value & 0xf) > 0xf); // Half flag
            this.setFlag("C", this.registers.A + value > 0xff); // Carry flag
            this.registers.A = result;
            break;
          }

          case "E": {
            const value = this.registers.E;
            const result = (this.registers.A + value) & 0xff;
            this.setFlag("Z", result === 0); // Zero flag
            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (this.registers.A & 0xf) + (value & 0xf) > 0xf); // Half flag
            this.setFlag("C", this.registers.A + value > 0xff); // Carry flag
            this.registers.A = result;
            break;
          }

          case "H": {
            const value = this.registers.H;
            const result = (this.registers.A + value) & 0xff;
            this.setFlag("Z", result === 0); // Zero flag
            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (this.registers.A & 0xf) + (value & 0xf) > 0xf); // Half flag
            this.setFlag("C", this.registers.A + value > 0xff); // Carry flag
            this.registers.A = result;
            break;
          }

          case "L": {
            const value = this.registers.L;
            const result = (this.registers.A + value) & 0xff;
            this.setFlag("Z", result === 0); // Zero flag
            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (this.registers.A & 0xf) + (value & 0xf) > 0xf); // Half flag
            this.setFlag("C", this.registers.A + value > 0xff); // Carry flag
            this.registers.A = result;
            break;
          }

          case "HL": {
            const value = this.getAddress(source);
            const result = (this.registers.A + value) & 0xff;
            this.setFlag("Z", result === 0); // Zero flag
            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (this.registers.A & 0xf) + (value & 0xf) > 0xf); // Half flag
            this.setFlag("C", this.registers.A + value > 0xff); // Carry flag
            this.registers.A = result;
            break;
          }
        }
        break;
      }
    }
  }

  // Load instructions
  LD(operands) {
    const [dest, source] = operands;

    switch (source.name) {
      // Handle source 16-bit operations
      case "n16":
        const lowByte = this.memory.readByte(this.registers.PC - 2);
        const highByte = this.memory.readByte(this.registers.PC - 1);

        switch (dest.name) {
          case "BC":
            this.registers.B = highByte;
            this.registers.C = lowByte;
            break;
          case "DE":
            this.registers.D = highByte;
            this.registers.E = lowByte;
            break;
          case "HL":
            this.registers.H = highByte;
            this.registers.L = lowByte;
            break;
          case "SP":
            this.registers.SP = (highByte << 8) | lowByte;
            break;
          default:
            throw new Error(`Invalid destination for LD n16: ${dest.name}`);
        }
        break;

      // Handle source 8-bit operations
      case "n8":
        const value = this.memory.readByte(this.registers.PC - 1);

        if (dest.immediate) {
          this.registers[dest.name] = value;
        } else {
          const address = this.getAddress(dest);
          this.memory.writeByte(address, value);
        }
        break;

      // Handle source register A operations
      case "A":
        if (dest.name === "HL") {
          if (dest.increment) {
            const address = this.getAddress(dest);
            this.memory.writeByte(address, this.registers.A);

            const newValue = (address + 1) & 0xffff;
            this.registers.H = (newValue >> 8) & 0xff;
            this.registers.L = newValue & 0xff;
            return;
          } else if (dest.decrement) {
            const address = this.getAddress(dest);
            this.memory.writeByte(address, this.registers.A);

            const newValue = (address - 1) & 0xffff;
            this.registers.H = (newValue >> 8) & 0xff;
            this.registers.L = newValue & 0xff;
            return;
          } else {
            const address = this.getAddress(dest);
            this.memory.writeByte(address, this.registers.A);
            return;
          }
        } else if (dest.name === "DE" || dest.name === "BC") {
          const address = this.getAddress(dest);
          this.memory.writeByte(address, this.registers.A);
          return;
        } else if (dest.name === "a16") {
          const lowByteAddress = this.memory.readByte(this.registers.PC - 2);
          const highByteAddress = this.memory.readByte(this.registers.PC - 1);
          const address = (highByteAddress << 8) | lowByteAddress;
          this.memory.writeByte(address, this.registers.A);
          return;
        } else {
          this.registers[dest.name] = this.registers.A;
          return;
        }

      // Handle source register B operations
      case "B":
        if (dest.name === "HL" || dest.name === "BC" || dest.name === "DE") {
          const address = this.getAddress(dest);
          const value = this.memory.readByte(this.registers.B);
          this.memory.writeByte(address, value);
          return;
        } else {
          this.registers[dest.name] = this.registers.B;
          return;
        }

      // Handle source register C operations
      case "C":
        if (dest.name === "HL" || dest.name === "BC" || dest.name === "DE") {
          const address = this.getAddress(dest);
          const value = this.memory.readByte(this.registers.C);
          this.memory.writeByte(address, value);
          return;
        } else {
          this.registers[dest.name] = this.registers.C;
          return;
        }

      // Handle source register D operations
      case "D":
        if (dest.name === "HL" || dest.name === "BC" || dest.name === "DE") {
          const address = this.getAddress(dest);
          const value = this.memory.readByte(this.registers.D);
          this.memory.writeByte(address, value);
          return;
        } else {
          this.registers[dest.name] = this.registers.D;
          return;
        }

      // Handle source register E operations
      case "E":
        if (dest.name === "HL" || dest.name === "BC" || dest.name === "DE") {
          const address = this.getAddress(dest);
          const value = this.memory.readByte(this.registers.E);
          this.memory.writeByte(address, value);
          return;
        } else {
          this.registers[dest.name] = this.registers.E;
          return;
        }

      // Handle source register H operations
      case "H":
        if (dest.name === "HL" || dest.name === "BC" || dest.name === "DE") {
          const address = this.getAddress(dest);
          const value = this.memory.readByte(this.registers.H);
          this.memory.writeByte(address, value);
          return;
        } else {
          this.registers[dest.name] = this.registers.H;
          return;
        }

      // Handle source register L operations
      case "L":
        if (dest.name === "HL" || dest.name === "BC" || dest.name === "DE") {
          const address = this.getAddress(dest);
          const value = this.memory.readByte(this.registers.L);
          this.memory.writeByte(address, value);
          return;
        } else {
          this.registers[dest.name] = this.registers.L;
          return;
        }

      // Handle source register HL operations
      case "HL":
        // Handle SP special cases
        if (dest.name === "SP") {
          this.registers.SP = (this.registers.H << 8) | this.registers.L;
          return;
        }

        if (source.increment) {
          const address = (this.registers.H << 8) | this.registers.L;
          this.registers.A = this.memory.readByte(address);

          const newValue = (address + 1) & 0xffff;
          this.registers.H = (newValue >> 8) & 0xff;
          this.registers.L = newValue & 0xff;

          return;
        }

        if (source.decrement) {
          const address = (this.registers.H << 8) | this.registers.L;
          this.registers.A = this.memory.readByte(address);

          const newValue = (address - 1) & 0xffff;
          this.registers.H = (newValue >> 8) & 0xff;
          this.registers.L = newValue & 0xff;

          return;
        }
        break;

      // Handle source register SP operations
      case "SP":
        // Handle HL special cases
        if (dest.name === "HL") {
          const e8 = this.memory.readByte(this.registers.PC - 1);
          const signedE8 = e8 & 0x80 ? e8 - 256 : e8;
          const result = (this.registers.SP + signedE8) & 0xffff;

          this.registers.H = (result >> 8) & 0xff;
          this.registers.L = result & 0xff;

          this.setFlag("Z", false); // Zero flag
          this.setFlag("N", false); // Subtract flag
          this.setFlag("H", (this.registers.SP & 0xf) + (e8 & 0xf) > 0xf); // Half flag
          this.setFlag("C", (this.registers.SP & 0xff) + (e8 & 0xff) > 0xff); // Carry flag

          return;
        } else if (dest.name === "a16") {
          const lowByteAddress = this.memory.readByte(this.registers.PC - 2);
          const highByteAddress = this.memory.readByte(this.registers.PC - 1);
          const address = (highByteAddress << 8) | lowByteAddress;
          this.memory.writeByte(address, this.registers.SP & 0xff);
          this.memory.writeByte(address + 1, (this.registers.SP >> 8) & 0xff);
          return;
        }
        break;

      default:
        break;
    }
  }

  // INC (increment) instructions
  INC(operands) {
    const source = operands;
    switch (source.name) {
      // Handle 16-bit operations
      case "BC": {
        this.registers.C = (this.registers.C + 1) & 0xff;
        if (this.registers.C === 0) {
          this.registers.B = (this.registers.B + 1) & 0xff;
        }
        break;
      }
      case "DE": {
        this.registers.E = (this.registers.E + 1) & 0xff;
        if (this.registers.E === 0) {
          this.registers.D = (this.registers.D + 1) & 0xff;
        }
        break;
      }
      case "HL": {
        this.registers.L = (this.registers.L + 1) & 0xff;
        if (this.registers.L === 0) {
          this.registers.H = (this.registers.H + 1) & 0xff;
        }
        break;
      }
      case "SP": {
        this.registers.SP = (this.registers.SP + 1) & 0xffff;
        break;
      }
      // Handle 8-bit operations
      case "B": {
        const oldValue = this.registers.B;
        this.registers.B = (this.registers.B + 1) & 0xff;

        this.setFlag("Z", this.registers.B === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) === 0xf); // Half flag
        break;
      }
      case "C": {
        const oldValue = this.registers.C;
        this.registers.C += 1 & 0xff;

        this.setFlag("Z", this.registers.C === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) === 0xf); // Half flag
        break;
      }
      case "D": {
        const oldValue = this.registers.D;
        this.registers.D += 1 & 0xff;

        this.setFlag("Z", this.registers.D === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) === 0xf); // Half flag
        break;
      }
      case "E": {
        const oldValue = this.registers.E;
        this.registers.E += 1 & 0xff;

        this.setFlag("Z", this.registers.E === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) === 0xf); // Half flag
        break;
      }
      case "H": {
        const oldValue = this.registers.H;
        this.registers.H += 1 & 0xff;

        this.setFlag("Z", this.registers.H === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) === 0xf); // Half flag
        break;
      }
      case "L": {
        const oldValue = this.registers.L;
        this.registers.L += 1 & 0xff;

        this.setFlag("Z", this.registers.L === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) === 0xf); // Half flag
        break;
      }
    }
  }

  // DEC (decrement) instruction
  DEC(operands) {
    const source = operands;
    switch (source.name) {
      // Handle 16-bit operations
      case "BC": {
        this.registers.C = (this.registers.C - 1) & 0xff;
        if (this.registers.C === 0xff) {
          this.registers.B = (this.registers.B - 1) & 0xff;
        }
        break;
      }
      case "DE": {
        this.registers.E = (this.registers.E - 1) & 0xff;
        if (this.registers.E === 0xff) {
          this.registers.D = (this.registers.D - 1) & 0xff;
        }
        break;
      }
      case "HL": {
        this.registers.L = (this.registers.L - 1) & 0xff;
        if (this.registers.L === 0xff) {
          this.registers.H = (this.registers.H - 1) & 0xff;
        }
        break;
      }
      case "SP": {
        this.registers.SP = (this.registers.SP - 1) & 0xffff;
        break;
      }
      // Handle 8-bit operations
      case "B": {
        const oldValue = this.registers.B;
        this.registers.B = (this.registers.B - 1) & 0xff;

        this.setFlag("Z", this.registers.B === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) === 0x00); // Half flag
        break;
      }
      case "C": {
        const oldValue = this.registers.C;
        this.registers.B = (this.registers.C - 1) & 0xff;

        this.setFlag("Z", this.registers.C === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) === 0x00); // Half flag
        break;
      }
      case "D": {
        const oldValue = this.registers.D;
        this.registers.B = (this.registers.D - 1) & 0xff;

        this.setFlag("Z", this.registers.D === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) === 0x00); // Half flag
        break;
      }
      case "E": {
        const oldValue = this.registers.E;
        this.registers.B = (this.registers.E - 1) & 0xff;

        this.setFlag("Z", this.registers.E === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) === 0x00); // Half flag
        break;
      }
      case "H": {
        const oldValue = this.registers.H;
        this.registers.B = (this.registers.H - 1) & 0xff;

        this.setFlag("Z", this.registers.H === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) === 0x00); // Half flag
        break;
      }
      case "L": {
        const oldValue = this.registers.L;
        this.registers.B = (this.registers.L - 1) & 0xff;

        this.setFlag("Z", this.registers.L === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) === 0x00); // Half flag
        break;
      }
    }
  }

  JP(operands) {
    const [source, dest] = operands;

    switch (source.name) {
      case "NZ": {
        const lowByteAddress = this.memory.readByte(this.registers.PC - 2);
        const highByteAddress = this.memory.readByte(this.registers.PC - 1);
        const address = (highByteAddress << 8) | lowByteAddress;

        if (!this.getFlag("Z")) {
          this.registers.PC = address;
        } else {
          this.clock -= 4;
        }
        break;
      }

      case "a16": {
        const lowByteAddress = this.memory.readByte(this.registers.PC - 2);
        const highByteAddress = this.memory.readByte(this.registers.PC - 1);
        const address = (highByteAddress << 8) | lowByteAddress;

        this.registers.PC = address;
        break;
      }
      
      case "Z": {
        const lowByteAddress = this.memory.readByte(this.registers.PC - 2);
        const highByteAddress = this.memory.readByte(this.registers.PC - 1);
        const address = (highByteAddress << 8) | lowByteAddress;

        if (this.getFlag("Z")) {
          this.registers.PC = address;
        } else {
          this.clock -= 4;
        }
        break;
      }

      case "NC": {
        const lowByteAddress = this.memory.readByte(this.registers.PC - 2);
        const highByteAddress = this.memory.readByte(this.registers.PC - 1);
        const address = (highByteAddress << 8) | lowByteAddress;

        if (!this.getFlag("C")) {
          this.registers.PC = address;
        } else {
          this.clock -= 4;
        }
        break;
      }

      case "C": {
        const lowByteAddress = this.memory.readByte(this.registers.PC - 2);
        const highByteAddress = this.memory.readByte(this.registers.PC - 1);
        const address = (highByteAddress << 8) | lowByteAddress;

        if (this.getFlag("C")) {
          this.registers.PC = address;
        } else {
          this.clock -= 4;
        }
        break;
      }

      case "HL": {
        const address = this.getAddress(source);
        const value = this.memory.readByte(address);

        this.registers.PC = value;
        break;
      }
    }
  }

  ADC(operands) {}

  CALL(operands) {}

  RETI(operands) {}

  SBC(operands) {}

  CP(operands) {}

  PUSH(operands) {}

  JR(operands) {}

  // SUB (subtract) instructions
  SUB(operands) {
    const [dest, source] = operands;

    switch (source.name) {
      case "n8": {
        const value = this.memory.readByte(this.registers.PC - 1);
        const oldValue = this.registers.A;
        const result = (this.registers.A - value) & 0xff;

        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) < (value & 0xf)); // Half flag
        this.setFlag("C", value > this.registers.A); // Carry flag
        this.registers.A = result;
        break;
      }
      case "A": {
        const value = this.registers.A;
        const result = (this.registers.A - value) & 0xff;

        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (value & 0xf) < (value & 0xf)); // Half flag
        this.setFlag("C", value > this.registers.A); // Carry flag
        this.registers.A = result;
        break;
      }
      case "B": {
        const value = this.registers.B;
        const oldValue = this.registers.A;
        const result = (this.registers.A - value) & 0xff;

        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) < (value & 0xf)); // Half flag
        this.setFlag("C", value > this.registers.A); // Carry flag
        this.registers.A = result;
        break;
      }

      case "C": {
        const value = this.registers.C;
        const oldValue = this.registers.A;
        const result = (this.registers.A - value) & 0xff;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) < (value & 0xf)); // Half flag
        this.setFlag("C", value > this.registers.A); // Carry flag
        this.registers.A = result;
        break;
      }

      case "D": {
        const value = this.registers.D;
        const oldValue = this.registers.A;
        const result = (this.registers.A - value) & 0xff;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) < (value & 0xf)); // Half flag
        this.setFlag("C", value > this.registers.A); // Carry flag
        this.registers.A = result;
        break;
      }

      case "E": {
        const value = this.registers.E;
        const oldValue = this.registers.A;
        const result = (this.registers.A - value) & 0xff;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) < (value & 0xf)); // Half flag
        this.setFlag("C", value > this.registers.A); // Carry flag
        this.registers.A = result;
        break;
      }

      case "H": {
        const value = this.registers.H;
        const oldValue = this.registers.A;
        const result = (this.registers.A - value) & 0xff;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) < (value & 0xf)); // Half flag
        this.setFlag("C", value > this.registers.A); // Carry flag
        this.registers.A = result;
        break;
      }

      case "L": {
        const value = this.registers.L;
        const oldValue = this.registers.A;
        const result = (this.registers.A - value) & 0xff;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) < (value & 0xf)); // Half flag
        this.setFlag("C", value > this.registers.A); // Carry flag
        this.registers.A = result;
        break;
      }

      case "HL": {
        const value = this.getAddress(source);
        const oldValue = this.registers.A;
        const result = (this.registers.A - value) & 0xff;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", true); // Subtract flag
        this.setFlag("H", (oldValue & 0xf) < (value & 0xf)); // Half flag
        this.setFlag("C", value > this.registers.A); // Carry flag
        this.registers.A = result;
        break;
      }
    }
  }

  RRA(operands) {}

  RET(operands) {}

  OR(operands) {
    const [dest, source] = operands;

    switch (source.name) {
      case "n8": {
        const value = this.memory.readByte(this.registers.PC - 1);
        const result = this.registers.A | value;

        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }
      case "A": {
        const value = this.registers.A;
        const result = this.registers.A | value;

        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }
      case "B": {
        const value = this.registers.B;
        const result = this.registers.A | value;

        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "C": {
        const value = this.registers.C;
        const result = this.registers.A | value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "D": {
        const value = this.registers.D;
        const result = this.registers.A | value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "E": {
        const value = this.registers.E;
        const result = this.registers.A | value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "H": {
        const value = this.registers.H;
        const result = this.registers.A | value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "L": {
        const value = this.registers.L;
        const result = this.registers.A | value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "HL": {
        const address = this.getAddress(source);
        const value = this.memory.readByte(address);
        const result = this.registers.A | value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }
    }
  }

  POP(operands) {}

  LDH(operands) {}

  XOR(operands) {
    const [dest, source] = operands;

    switch (source.name) {
      case "n8": {
        const value = this.memory.readByte(this.registers.PC - 1);
        const result = this.registers.A ^ value;

        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }
      case "A": {
        const value = this.registers.A;
        const result = this.registers.A ^ value;

        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }
      case "B": {
        const value = this.registers.B;
        const result = this.registers.A ^ value;

        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "C": {
        const value = this.registers.C;
        const result = this.registers.A ^ value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "D": {
        const value = this.registers.D;
        const result = this.registers.A ^ value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "E": {
        const value = this.registers.E;
        const result = this.registers.A ^ value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "H": {
        const value = this.registers.H;
        const result = this.registers.A ^ value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "L": {
        const value = this.registers.L;
        const result = this.registers.A ^ value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "HL": {
        const address = this.getAddress(source);
        const value = this.memory.readByte(address);
        const result = this.registers.A ^ value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", false); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }
    }
  }

  SRL(operands) {}

  RR(operands) {}

  SWAP(operands) {}

  AND(operands) {
    const [dest, source] = operands;

    switch (source.name) {
      case "n8": {
        const value = this.memory.readByte(this.registers.PC - 1);
        const result = this.registers.A & value;

        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", true); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }
      case "A": {
        const value = this.registers.A;
        const result = this.registers.A & value;

        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", true); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }
      case "B": {
        const value = this.registers.B;
        const result = this.registers.A & value;

        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", true); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "C": {
        const value = this.registers.C;
        const result = this.registers.A & value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", true); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "D": {
        const value = this.registers.D;
        const result = this.registers.A & value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", true); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "E": {
        const value = this.registers.E;
        const result = this.registers.A & value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", true); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "H": {
        const value = this.registers.H;
        const result = this.registers.A & value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", true); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "L": {
        const value = this.registers.L;
        const result = this.registers.A & value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", true); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }

      case "HL": {
        const address = this.getAddress(source);
        const value = this.memory.readByte(address);
        const result = this.registers.A & value;
        this.setFlag("Z", result === 0); // Zero flag
        this.setFlag("N", false); // Subtract flag
        this.setFlag("H", true); // Half flag
        this.setFlag("C", false); // Carry flag
        this.registers.A = result;
        break;
      }
    }
  }

  RST(operands) {}

  CPL(operands) {}

  DI(operands) {}

  BIT(operands) {}

  RL(operands) {}

  RLCA(operands) {}

  STOP(operands) {}

  RES(operands) {}

  RLC(operands) {}

  EI(operands) {}

  CCF(operands) {}

  RRCA(operands) {}

  SCF(operands) {}

  HALT(operands) {}

  DAA(operands) {}

  RLA(operands) {}

  SET(operands) {}

  RRC(operands) {}
}

export default CPU;
