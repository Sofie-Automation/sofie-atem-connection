import { AtemState } from '../state/index.js'
import { ProtocolVersion } from '../enums/index.js'
import { BasicWritableCommand, DeserializedCommand } from './CommandBase.js'
import { assertNever, padToMultiple } from '../lib/atemUtil.js'

export enum CameraControlDataType {
	BOOL = 0x00,
	SINT8 = 0x01,
	SINT16 = 0x02,
	SINT32 = 0x03,
	SINT64 = 0x04,
	STRING = 0x05,
	FLOAT = 0x80,
}

export interface CameraControlPacket {
	type: CameraControlDataType

	boolData: boolean[]
	numberData: number[]
	bigintData: bigint[]
	stringData: string

	relative: boolean
}

export interface CameraControlPacket2 {
	type: CameraControlDataType

	boolData: boolean[]
	numberData: number[]
	bigintData: bigint[]
	stringData: string

	periodicFlushEnabled: boolean
}

export class CameraControlCommand extends BasicWritableCommand<CameraControlPacket> {
	public static readonly rawName = 'CCmd'
	public static readonly minimumVersion = ProtocolVersion.V7_2

	public readonly source: number
	public readonly category: number
	public readonly parameter: number

	constructor(source: number, category: number, parameter: number, props: CameraControlPacket) {
		super(props)

		this.source = source
		this.category = category
		this.parameter = parameter
	}

	public serialize(): Buffer {
		const headerSize = 16
		const header8BitPos = 6
		const header16BitPos = 8
		const header32BitPos = 10
		const header64BitPos = 12

		let buffer: Buffer

		switch (this.properties.type) {
			case CameraControlDataType.BOOL: {
				buffer = Buffer.alloc(headerSize + padToMultiple(this.properties.boolData.length, 8))
				buffer.writeUint16BE(this.properties.boolData.length, header8BitPos)

				let offset = headerSize
				for (let i = 0; i < this.properties.boolData.length; i++) {
					buffer.writeInt8(this.properties.boolData[i] ? 1 : 0, offset)
					offset++
				}

				break
			}
			case CameraControlDataType.SINT8: {
				buffer = Buffer.alloc(headerSize + padToMultiple(this.properties.numberData.length, 8))
				buffer.writeUint16BE(this.properties.numberData.length, header8BitPos)

				let offset = headerSize
				for (let i = 0; i < this.properties.numberData.length; i++) {
					buffer.writeInt8(this.properties.numberData[i], offset)
					offset++
				}

				break
			}
			case CameraControlDataType.SINT16: {
				buffer = Buffer.alloc(headerSize + padToMultiple(this.properties.numberData.length * 2, 8))
				buffer.writeUint16BE(this.properties.numberData.length, header16BitPos)

				let offset = headerSize
				for (let i = 0; i < this.properties.numberData.length; i++) {
					buffer.writeInt16BE(this.properties.numberData[i], offset)
					offset += 2
				}

				break
			}
			case CameraControlDataType.SINT32: {
				buffer = Buffer.alloc(headerSize + padToMultiple(this.properties.numberData.length * 4, 8))
				buffer.writeUint16BE(this.properties.numberData.length, header32BitPos)

				let offset = headerSize
				for (let i = 0; i < this.properties.numberData.length; i++) {
					buffer.writeInt32BE(this.properties.numberData[i], offset)
					offset += 4
				}

				break
			}
			case CameraControlDataType.SINT64: {
				buffer = Buffer.alloc(headerSize + padToMultiple(this.properties.bigintData.length * 8, 8))
				buffer.writeUint16BE(this.properties.bigintData.length, header64BitPos)

				let offset = headerSize
				for (let i = 0; i < this.properties.bigintData.length; i++) {
					buffer.writeBigInt64BE(this.properties.bigintData[i], offset)
					offset += 8
				}

				break
			}
			case CameraControlDataType.STRING: {
				buffer = Buffer.alloc(headerSize + padToMultiple(this.properties.stringData.length, 8))
				buffer.writeUint16BE(this.properties.stringData.length, header8BitPos)

				buffer.write(this.properties.stringData, headerSize)

				break
			}
			case CameraControlDataType.FLOAT: {
				buffer = Buffer.alloc(headerSize + padToMultiple(this.properties.numberData.length * 2, 8))
				buffer.writeUint16BE(this.properties.numberData.length, header16BitPos)

				let offset = headerSize
				for (const value of this.properties.numberData) {
					// Values are encoded as 5.11 fixed point floats
					buffer.writeInt16BE(value * 2048, offset)
					offset += 2
				}

				break
			}
			default:
				assertNever(this.properties.type)
				throw new Error(`Invalid CameraControlDataType: ${this.properties.type}`)
		}

		// add common properties
		buffer.writeUInt8(this.source, 0)
		buffer.writeUInt8(this.category, 1)
		buffer.writeUInt8(this.parameter, 2)
		buffer.writeUInt8(this.properties.relative ? 1 : 0, 3)
		buffer.writeUInt8(this.properties.type, 4)

		return buffer
	}
}

export class CameraControlUpdateCommand extends DeserializedCommand<CameraControlPacket2> {
	public static readonly rawName = 'CCdP'
	public static readonly minimumVersion = ProtocolVersion.V7_2

	public readonly source: number
	public readonly category: number
	public readonly parameter: number

	constructor(source: number, category: number, parameter: number, props: CameraControlPacket2) {
		super(props)

		this.source = source
		this.category = category
		this.parameter = parameter
	}

	public static deserialize(rawCommand: Buffer): CameraControlUpdateCommand {
		const source = rawCommand.readUint8(0)
		const category = rawCommand.readUint8(1)
		const parameter = rawCommand.readUint8(2)
		const type = rawCommand.readUint8(3) as CameraControlDataType

		const headerSize = 16
		const count8Bit = rawCommand.readUint16BE(4)
		const count16Bit = rawCommand.readUint16BE(6)
		const count32Bit = rawCommand.readUint16BE(8)
		const count64Bit = rawCommand.readUint16BE(10)

		const props: CameraControlPacket2 = {
			type,
			boolData: [],
			numberData: [],
			bigintData: [],
			stringData: '',

			periodicFlushEnabled: rawCommand.readUint8(12) > 0,
		}

		let offset = headerSize
		switch (type) {
			case CameraControlDataType.BOOL: {
				for (let i = 0; i < count8Bit; i++) {
					props.boolData.push(rawCommand.readInt8(offset) > 0)
					offset += 1
				}
				break
			}
			case CameraControlDataType.SINT8: {
				for (let i = 0; i < count8Bit; i++) {
					props.numberData.push(rawCommand.readInt8(offset))
					offset += 1
				}
				break
			}
			case CameraControlDataType.SINT16: {
				for (let i = 0; i < count16Bit; i++) {
					props.numberData.push(rawCommand.readInt16BE(offset))
					offset += 2
				}
				break
			}
			case CameraControlDataType.SINT32: {
				for (let i = 0; i < count32Bit; i++) {
					props.numberData.push(rawCommand.readInt32BE(offset))
					offset += 4
				}
				break
			}
			case CameraControlDataType.SINT64: {
				for (let i = 0; i < count64Bit; i++) {
					props.bigintData.push(rawCommand.readBigInt64BE(offset))
					offset += 8
				}
				break
			}
			case CameraControlDataType.STRING: {
				props.stringData = rawCommand.toString(undefined, offset, offset + count8Bit)
				break
			}
			case CameraControlDataType.FLOAT: {
				for (let i = 0; i < count16Bit; i++) {
					const decodedValue = rawCommand.readInt16BE(offset)

					// Values are encoded as 5.11 fixed point floats
					props.numberData.push(decodedValue / 2048)
					offset += 2
				}
				break
			}
			default:
				assertNever(type)
				throw new Error(`Invalid CameraControlDataType: ${type}`)
		}

		return new CameraControlUpdateCommand(source, category, parameter, props)
	}

	public applyToState(_state: AtemState): string | string[] {
		// TODO: future
		return []
	}
}
