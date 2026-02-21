import { FairlightAudioCompressorState } from '../../state/fairlight.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { OmitReadonly } from '../../lib/types.js'

export class FairlightMixerSourceCompressorCommand extends WritableCommand<
	OmitReadonly<FairlightAudioCompressorState>
> {
	public static MaskFlags = {
		compressorEnabled: 1 << 0,
		threshold: 1 << 1,
		ratio: 1 << 2,
		attack: 1 << 3,
		hold: 1 << 4,
		release: 1 << 5,
	}

	public static readonly rawName = 'CICP'

	public readonly index: number
	public readonly source: bigint

	constructor(index: number, source: bigint) {
		super()

		this.index = index
		this.source = source
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(40)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt16BE(this.index, 2)
		buffer.writeBigInt64BE(this.source, 8)

		buffer.writeUInt8(this.properties.compressorEnabled ? 1 : 0, 16)
		buffer.writeInt32BE(this.properties.threshold || 0, 20)
		buffer.writeInt16BE(this.properties.ratio || 0, 24)
		buffer.writeInt32BE(this.properties.attack || 0, 28)
		buffer.writeInt32BE(this.properties.hold || 0, 32)
		buffer.writeInt32BE(this.properties.release || 0, 36)

		return buffer
	}
}

export class FairlightMixerSourceCompressorUpdateCommand extends DeserializedCommand<FairlightAudioCompressorState> {
	public static readonly rawName = 'AICP'

	public readonly index: number
	public readonly source: bigint

	constructor(index: number, source: bigint, props: FairlightAudioCompressorState) {
		super(props)

		this.index = index
		this.source = source
	}

	public static deserialize(rawCommand: Buffer): FairlightMixerSourceCompressorUpdateCommand {
		const index = rawCommand.readUInt16BE(0)
		const source = rawCommand.readBigInt64BE(8)
		const properties = {
			compressorEnabled: rawCommand.readUInt8(16) > 0,
			threshold: rawCommand.readInt32BE(20),
			ratio: rawCommand.readInt16BE(24),
			attack: rawCommand.readInt32BE(28),
			hold: rawCommand.readInt32BE(32),
			release: rawCommand.readInt32BE(36),
		}

		return new FairlightMixerSourceCompressorUpdateCommand(index, source, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.fairlight) {
			throw new InvalidIdError('Fairlight')
		}

		const input = state.fairlight.inputs[this.index]
		if (!input) {
			throw new InvalidIdError('Fairlight.Inputs', this.index)
		}
		const sourceIdStr = this.source.toString()
		const source = input.sources[sourceIdStr] || {}
		input.sources[sourceIdStr] = source

		if (!source.dynamics) {
			source.dynamics = {}
		}

		source.dynamics.compressor = this.properties

		return `fairlight.inputs.${this.index}.sources.${sourceIdStr}.dynamics.compressor`
	}
}
