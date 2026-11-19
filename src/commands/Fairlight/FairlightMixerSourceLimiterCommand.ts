import { FairlightAudioLimiterState } from '../../state/fairlight.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { OmitReadonly } from '../../lib/types.js'

export class FairlightMixerSourceLimiterCommand extends WritableCommand<OmitReadonly<FairlightAudioLimiterState>> {
	public static MaskFlags = {
		limiterEnabled: 1 << 0,
		threshold: 1 << 1,
		attack: 1 << 2,
		hold: 1 << 3,
		release: 1 << 4,
	}

	public static readonly rawName = 'CILP'

	public readonly index: number
	public readonly source: bigint

	constructor(index: number, source: bigint) {
		super()

		this.index = index
		this.source = source
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(36)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt16BE(this.index, 2)
		buffer.writeBigInt64BE(this.source, 8)

		buffer.writeUInt8(this.properties.limiterEnabled ? 1 : 0, 16)
		buffer.writeInt32BE(this.properties.threshold || 0, 20)
		buffer.writeInt32BE(this.properties.attack || 0, 24)
		buffer.writeInt32BE(this.properties.hold || 0, 28)
		buffer.writeInt32BE(this.properties.release || 0, 32)

		return buffer
	}
}

export class FairlightMixerSourceLimiterUpdateCommand extends DeserializedCommand<FairlightAudioLimiterState> {
	public static readonly rawName = 'AILP'

	public readonly index: number
	public readonly source: bigint

	constructor(index: number, source: bigint, props: FairlightAudioLimiterState) {
		super(props)

		this.index = index
		this.source = source
	}

	public static deserialize(rawCommand: Buffer): FairlightMixerSourceLimiterUpdateCommand {
		const index = rawCommand.readUInt16BE(0)
		const source = rawCommand.readBigInt64BE(8)
		const properties = {
			limiterEnabled: rawCommand.readUInt8(16) > 0,
			threshold: rawCommand.readInt32BE(20),
			attack: rawCommand.readInt32BE(24),
			hold: rawCommand.readInt32BE(28),
			release: rawCommand.readInt32BE(32),
		}

		return new FairlightMixerSourceLimiterUpdateCommand(index, source, properties)
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

		source.dynamics.limiter = this.properties

		return `fairlight.inputs.${this.index}.sources.${sourceIdStr}.dynamics.limiter`
	}
}
