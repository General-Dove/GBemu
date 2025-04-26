import opcodes from './opcodes.json'

class CPU {
    constructor(memory) {
        //registers
        this.registers = {
            A: 0x00, //accumulator
            F: 0x00, //flags
            B: 0x00,
            C: 0x00,
            D: 0x00,
            E: 0x00,
            H: 0x00,
            L: 0x00,
            SP: 0x00, //stack pointer
            PC: 0x00, //program counter(pointer)
        }

        this.clock = 0

        this.memory = memory
    }

    reset() {
        //reset registers and clock
        this.registers = {
            A: 0x01,
            F: 0xB0,
            B: 0x00,
            C: 0x13,
            D: 0x00,
            E: 0xD8,
            H: 0x01,
            L: 0x4D,
            SP: 0xFFFE,
            PC: 0x0100,
        }

        this.clock = 0
    }

    //execute a single instruction
    executeInstruction() {
        //read opcode from memory at current PC
        const opcode = this.memory.readByte(this.registers.PC)
        //get instruction data from opcodes.json
        const instruction = this.decodeInstruction(opcode)

        if (!instruction) {
            throw new Error(`Unknown opcode: 0x${opcode.toString(16)}`)
        }

        //update PC and clock
        this.registers.PC += instruction.bytes
        this.clock += instruction.cycles[0]

        //Execute the instruction based on mnemonic
        switch (instruction.mnemonic) {
            //no operation
            case 'NOP': break
            //copy value in register on right into register on left
            case 'LD': this.LD(instruction.operands); break
            //increment value in register by 1
            case 'INC': this.INC(instruction.operands[0]); break
            //decrement value in register by 1
            case 'DEC': this.DEC(instruction.operands[0]); break
            //add value from register to A
            case 'ADD': this.ADD(instruction.operands); break
            //subtract value from register to A
            case 'SUB': this.SUB(instruction.operands); break
            //set A to bitwise AND between value from register to A
            case 'AND': this.AND(instruction.operands); break
            //set A to bitwise OR between value from register to A
            case 'OR': this.OR(instruction.operands); break
            //set A to bitwise XOR between value from register to A
            case 'XOR': this.XOR(instruction.operands); break
            //jump to address
            case 'JP': this.JP(instruction.operands); break
            //add value from register & carry flag to A
            case 'ADC': this.ADC(instruction.operands); break
            //subtract value from register & carry flag to A
            case 'SBC': this.SBC(instruction.operands); break
            //compare value from register to A
            case 'CP': this.CP(instruction.operands); break
            //push register into the stack
            case 'PUSH': this.PUSH(instruction.operands); break
            //pop register from the stack
            case 'POP': this.POP(instruction.operands); break
            //call address
            case 'CALL': this.CALL(instruction.operands); break
            //return from subroutine if condition is met
            case 'RET': this.RET(instruction.operands); break
            //call address(shorter and faster equivalent to CALL for suitable values)
            case 'RST': this.RST(instruction.operands); break
            //relative jump to address
            case 'JR': this.JR(instruction.operands); break
            //rotate register A left
            case 'RLCA': this.RLCA(); break
            //rotate register A right
            case 'RRCA': this.RRCA(); break
            //rotate register A left, through the carry flag
            case 'RLA': this.RLA(); break
            //rotate register A right, through the carry flag
            case 'RRA': this.RRA(); break
            //decimal adjust accumulator
            case 'DAA': this.DAA(); break
            //complement accumulator(bitwise NOT)
            case 'CPL': this.CPL(); break
            //set carry flag
            case 'SCF': this.SCF(); break
            //complement carry flag
            case 'CCF': this.CCF(); break
            //enter CPU low-power consumption mode until an interrupt occurs
            case 'HALT': this.HALT(); break
            //enter CPU very low power mode
            case 'STOP': this.STOP(); break
            //disable interrupts by clearing the IME flag
            case 'DI': this.DI(); break
            //enable interrupts by setting the IME flag 
            case 'EI': this.EI(); break
            //special byte that indicates extended set of instructions
            case 'PREFIX': this.handleCBPrefix(); break
            //swap the upper 4 bits in register and the lower 4 ones
            case 'SWAP': this.SWAP(instruction.operands); break
            //test specified bit in register, set the flag if bit not set
            case 'BIT': this.BIT(instruction.operands); break
            //set specified bit in register to 0(bit 0 is the rightmost, bit 7 is the leftmost)
            case 'RES': this.RES(instruction.operands); break
            //set specified bit in register to 1(bit 0 is the rightmost, bit 7 is the leftmost)
            case 'SET': this.SET(instruction.operands); break
            //rotate register left
            case 'RLC': this.RLC(instruction.operands); break
            //rotate register right
            case 'RRC': this.RRC(instruction.operands); break
            //rotate byte left through the carry flag
            case 'RL': this.RL(instruction.operands); break
            //rotate byte right through the carry flag
            case 'RR': this.RR(instruction.operands); break
            //shift left arithmetically register
            case 'SLA': this.SLA(instruction.operands); break
            //shift right arithmetically register
            case 'SRA': this.SRA(instruction.operands); break
            //shift left logically register
            case 'SRL': this.SRL(instruction.operands); break
            //default case, throw error if no instruction
            default:
                throw new Error (`Unimplemented instruction: ${instruction.mnemonic}`)
        }
    }
    //helper methods for flag operations
    setFlag(flag, value) {
        switch (flag) {
            case 'Z':
                this.registers.F = value ? this.registers.F | 0x80 : this.registers.F & 0x7F
                break

            case 'N':
                this.registers.F = value ? this.registers.F | 0x40 : this.registers.F & 0xBF
                break

            case 'H':
                this.registers.F = value ? this.registers.F | 0x20 : this.registers.F & 0xDF
                break

            case 'C':
                this.registers.F = value ? this.registers.F | 0x10 : this.registers.F & 0xEF
                break

        }
    }

    getFlag(flag) {
        switch(flag) {
            case 'Z': return (this.registers.F & 0x80) !== 0
            case 'N': return (this.registers.F & 0x40) !== 0
            case 'H': return (this.registers.F & 0x20) !== 0
            case 'C': return (this.registers.F & 0x10) !== 0
        }
    }

    //decode instruction from opcodes.json
    decodeInstruction(opcode) {
        const opcodeHex = `0x${opcode.toString(16).toUpperCase().padStart(2, '0')}`
        return opcode.unprefixed[opcodeHex]
    }

    //add instructions
    ADD(operands) {
        const [dest, source] = operands

        //handle 16-bit operations
        if (dest.name === 'HL') {
            const hl = (this.registers.H << 8) | this.registers.L
            let value

            switch (source.name) {
                case 'BC':
                    value = (this.registers.B << 8) | this.registers.C
                    break
                case 'DE':
                    value = (this.registers.D << 8) | this.registers.E
                    break
                case 'HL':
                    value = (this.registers.H << 8) | this.registers.L
                    break
                case 'SP':
                    if (source.e8) {
                        const e8 = this.memory.readByte(this.registers.PC - 1)
                        const signedE8 = (e8 & 0x80) ? e8 - 256 : e8
                        value = (this.registers.SP + signedE8) & 0xFFFF

                        this.setFlag('Z', false) //zero flag
                        this.setFlag('N', false) // subtract flag
                        this.setFlag('H', (this.registers.SP & 0xF) + (e8 & 0xF) > 0xF) // half flag
                        this.setFlag('C', (this.registers.SP & 0xFF) + (e8 & 0xFF) > 0xFF) // carry flag
                    }
                    else {
                        value = this.registers.SP
                    }
                    break
                default:
                    throw new Error(`Invalid source for ADD HL: ${source.name}`)
            }

            const result = (hl + value) & 0xFFFF
            this.registers.H = (result >> 8) & 0xFF
            this.registers.L = result & 0xFF

            if (!source.e8) {
            this.setFlag('Z', false) //zero flag
            this.setFlag('N', false) // subtract flag
            this.setFlag('H', (hl & 0xFFF) + (value & 0xFFF) > 0xFFF) // half flag
            this.setFlag('C', (hl + value) > 0xFFFF) // carry flag
            }
            return
        }

        //handle SP + e8 operations
        if (dest.name === 'SP') {
            const e8 = this.memory.readByte(this.registers.PC - 1)
            const signedE8 = (e8 & 0x80) ? e8 - 256 : e8
            const result = (this.registers.SP + signedE8) & 0xFFFF

            this.setFlag('Z', false) //zero flag
            this.setFlag('N', false) // subtract flag
            this.setFlag('H', (this.registers.SP & 0xF) + (e8 & 0xF) > 0xF) // half flag
            this.setFlag('C', (this.registers.SP & 0xFF) + (e8 & 0xFF) > 0xFF) // carry flag

            this.registers.SP = result
            return
        }

        if (dest.name !== 'A') {
            throw new Error('8-bit ADD operations are only supported for register A')
        }
        //handle 8-bit operations
        let value
        if (source.name === 'n8') {
            value = this.memory.readByte(this.registers.PC - 1)
        }
        else {
            value = source.immediate ?
                this.registers[source.name] :
                this.memory.readByte(this.getAddress(source))
        }

        const result = (this.registers[dest.name] + value) & 0xFF

        this.setFlag('Z', result === 0) //zero flag
        this.setFlag('N', false) // subtract flag
        this.setFlag('H', (this.registers[dest.name] & 0xF) + (value & 0xF) > 0xF) // half flag
        this.setFlag('C', (this.registers[dest.name] + value > 0xFF)) // carry flag

        this.registers[dest.name] = result

        this.clock += dest.name === 'HL' ? 8 :
                    dest.name === 'SP' ? 16 :
                    source.immediate ? 8 : 4
    }

    //load instructions
    LD(operands) {
        const [dest, source] = operands

        //handle 16-bit operations
        if (source.name === 'n16') {
            const value = this.memory.readByte(this.registers.PC - 2)
            switch (dest.name) {
                case 'BC':
                    this.registers.B = (value >> 8) & 0xFF
                    this.registers.C = value & 0xFF
                    break
                case 'DE':
                    this.registers.D = (value >> 8) & 0xFF
                    this.registers.E = value & 0xFF
                    break
                case 'HL':
                    this.registers.H = (value >> 8) & 0xFF
                    this.registers.L = value & 0xFF
                    break
                case 'SP':
                    this.registers.SP = value
                    break
            }
        }

        //handle 8-bit operations
        const value = source.immediate ?
            this.registers[source.name] :
            this.memory.readByte(this.getAddress(source))

        if (dest.immediate) {
            this.registers[dest.name] = value
        }
        else {
            const address = this.getAddress(dest)
            this.memory.writeByte(address, value)
        }
    }

}

export default CPU