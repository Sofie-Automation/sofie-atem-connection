import { WritableCommand, DeserializedCommand } from './CommandBase.js'
import { AtemState, ColorGeneratorState } from '../state/index.js'

export class ColorGeneratorCommand extends WritableCommand<ColorGeneratorState> {
	public static MaskFlags = {
		hue: 1 << 0,
		saturation: 1 << 1,
		luma: 1 << 2,
	}

	public static readonly rawName = 'CClV'

	public readonly index: number

	constructor(index: number) {
		super()

		this.index = index
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.index, 1)
		buffer.writeUInt16BE(this.properties.hue || 0, 2)
		buffer.writeUInt16BE(this.properties.saturation || 0, 4)
		buffer.writeUInt16BE(this.properties.luma || 0, 6)
		return buffer
	}
}

export class ColorGeneratorUpdateCommand extends DeserializedCommand<ColorGeneratorState> {
	public static readonly rawName = 'ColV'

	public readonly index: number

	constructor(index: number, properties: ColorGeneratorState) {
		super(properties)

		this.index = index
	}

	public static deserialize(rawCommand: Buffer): ColorGeneratorUpdateCommand {
		const auxBus = rawCommand.readUInt8(0)
		const properties = {
			hue: rawCommand.readUInt16BE(2),
			saturation: rawCommand.readUInt16BE(4),
			luma: rawCommand.readUInt16BE(6),
		}

		return new ColorGeneratorUpdateCommand(auxBus, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.colorGenerators) state.colorGenerators = {}

		state.colorGenerators[this.index] = this.properties
		return `colorGenerators.${this.index}`
	}
}
