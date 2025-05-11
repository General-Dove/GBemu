import opcodes from "./opcodes.json" with { type: "json" };
import { Memory } from "./memory.js";

export class CPU {
  constructor(rom) {
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

    this.rom = rom;
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
    const opcode = this.rom.readByte(this.registers.PC);
    // Get instruction data from opcodes.json
    const instruction = this.decodeInstruction(opcode);

    if (!instruction) {
      throw new Error(`Unknown opcode: 0x${opcode.toString(16)}`);
    }

    // Update PC and clock
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

    if (opcodeHex === '0xCB') {
        const nextByte = this.rom.readByte(this.registers.PC + 1);
        opcodeHex = `0x${nextByte.toString(16).toUpperCase().padStart(2, "0")}`;
        return opcodes.cbprefixed[opcodeHex];
    }
    
    return opcodes.unprefixed[opcodeHex];
  }

  getAddress(operand) {
    switch (operand.name) {
      case "BC":
        return (this.registers.B << 8) | this.registers.C;
      case "DE":
        return (this.registers.D << 8) | this.registers.E;
      case "HL":
        return (this.registers.H << 8) | this.registers.L;
      case "n16":
        return this.rom.readWord(this.registers.PC - 2);
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
    if (dest.name === "HL") {
      const hl = (this.registers.H << 8) | this.registers.L;
      let value;

      switch (source.name) {
        case "BC":
          value = (this.registers.B << 8) | this.registers.C;
          break;
        case "DE":
          value = (this.registers.D << 8) | this.registers.E;
          break;
        case "HL":
          value = (this.registers.H << 8) | this.registers.L;
          break;
        case "SP":
          if (source.e8) {
            const e8 = this.rom.readByte(this.registers.PC - 1);
            const signedE8 = e8 & 0x80 ? e8 - 256 : e8;
            value = (this.registers.SP + signedE8) & 0xffff;

            this.setFlag("Z", false); // Zero flag
            this.setFlag("N", false); // Subtract flag
            this.setFlag("H", (this.registers.SP & 0xf) + (e8 & 0xf) > 0xf); // Half flag
            this.setFlag("C", (this.registers.SP & 0xff) + (e8 & 0xff) > 0xff); // Carry flag
          } else {
            value = this.registers.SP;
          }
          break;
        default:
          throw new Error(`Invalid source for ADD HL: ${source.name}`);
      }

      const result = (hl + value) & 0xffff;
      this.registers.H = (result >> 8) & 0xff;
      this.registers.L = result & 0xff;

      this.setFlag("Z", false); // Zero flag
      this.setFlag("N", false); // Subtract flag
      this.setFlag("H", (hl & 0xfff) + (value & 0xfff) > 0xfff); // Half flag
      this.setFlag("C", hl + value > 0xffff); // Carry flag

      return;
    }

    // Handle SP + e8 operations
    if (dest.name === "SP") {
      const e8 = this.rom.readByte(this.registers.PC - 1);
      const signedE8 = e8 & 0x80 ? e8 - 256 : e8;
      const result = (this.registers.SP + signedE8) & 0xffff;

      this.setFlag("Z", false); // Zero flag
      this.setFlag("N", false); // Subtract flag
      this.setFlag("H", (this.registers.SP & 0xf) + (e8 & 0xf) > 0xf); // Half flag
      this.setFlag("C", (this.registers.SP & 0xff) + (e8 & 0xff) > 0xff); // Carry flag

      this.registers.SP = result;
      return;
    }

    if (dest.name !== "A") {
      throw new Error("8-bit ADD operations are only supported for register A");
    }
    // Handle 8-bit operations
    let value;
    if (source.name === "n8") {
      value = this.rom.readByte(this.registers.PC - 1);
    } else {
      value = source.immediate
        ? this.registers[source.name]
        : this.rom.readByte(this.getAddress(source));
    }

    const result = (this.registers[dest.name] + value) & 0xff;

    this.setFlag("Z", result === 0); // Zero flag
    this.setFlag("N", false); // Subtract flag
    this.setFlag("H", (this.registers[dest.name] & 0xf) + (value & 0xf) > 0xf); // Half flag
    this.setFlag("C", this.registers[dest.name] + value > 0xff); // Carry flag

    this.registers[dest.name] = result;
  }

  // Load instructions
  LD(operands) {
    const [dest, source] = operands;

    // Handle 16-bit operations
      if (source.name === "n16") {
        const lowByte = this.rom.readByte(this.registers.PC - 2);
        const highByte = this.rom.readByte(this.registers.PC - 1);

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
            this.registers.SP = (highByte << 8 | lowByte);
            break;
          default:
            throw new Error(`Invalid destination for LD n16: ${dest.name}`);
        }

      return;
    }

    // Handle SP special cases
    if (dest.name === "SP") {
      if (source.name === "HL") {
        this.registers.SP = (this.registers.H << 8) | this.registers.L;

        return;
      }
    }

    // Handle HL special cases
    if (dest.name === "HL" && source.name === "SP") {
      const e8 = this.rom.readByte(this.registers.PC - 1);
      const signedE8 = e8 & 0x80 ? e8 - 256 : e8;
      const result = (this.registers.SP + signedE8) & 0xffff;

      this.registers.H = (result >> 8) & 0xff;
      this.registers.L = result & 0xff;

      this.setFlag("Z", false); // Zero flag
      this.setFlag("N", false); // Subtract flag
      this.setFlag("H", (this.registers.SP & 0xf) + (e8 & 0xf) > 0xf); // Half flag
      this.setFlag("C", (this.registers.SP & 0xff) + (e8 & 0xff) > 0xff); // Carry flag

      return;
    }

    // Handle 8-bit operations
    if (source.name === "n8" || dest.name === "n8") {
      if (source.name === "n8") {
        const value = this.rom.readByte(this.registers.PC - 1);
        if (dest.immediate) {
          this.registers[dest.name] = value;
        } else {
          this.rom.writeByte(this.getAddress(dest), value);
        }

        return;
      } else {
        const value = this.registers[source.name];
        this.rom.writeByte(this.getAddress(dest), value);

        return;
      }
    }

    // Handle incremental/decremental cases
    if (dest.name === "HL" && source.name === "A" && dest.increment) {
      const address = (this.registers.H << 8) | this.registers.L;
      this.rom.writeByte(address, this.registers.A);

      const newValue = (address + 1) & 0xffff;
      this.registers.H = (newValue >> 8) & 0xff;
      this.registers.L = newValue & 0xff;

      return;
    }

    if (dest.name === "HL" && dest.decrement) {
      const address = (this.registers.H << 8) | this.registers.L;
      this.rom.writeByte(address, this.registers.A);

      const newValue = (address - 1) & 0xffff;
      this.registers.H = (newValue >> 8) & 0xff;
      this.registers.L = newValue & 0xff;

      return;
    }

    if (source.name === "HL" && source.increment) {
      const address = (this.registers.H << 8) | this.registers.L;
      this.registers.A = this.rom.readByte(address);

      const newValue = (address + 1) & 0xffff;
      this.registers.H = (newValue >> 8) & 0xff;
      this.registers.L = newValue & 0xff;

      return;
    }

    if (source.name === "HL" && source.decrement) {
      const address = (this.registers.H << 8) | this.registers.L;
      this.registers.A = this.rom.readByte(address);

      const newValue = (address - 1) & 0xffff;
      this.registers.H = (newValue >> 8) & 0xff;
      this.registers.L = newValue & 0xff;

      return;
    }
  }
}

export default CPU;
