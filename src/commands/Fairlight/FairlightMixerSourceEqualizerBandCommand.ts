import { FairlightAudioEqualizerBandState } from '../../state/fairlight.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { OmitReadonly } from '../../lib/types.js'
import * as AtemUtil from '../../lib/atemUtil.js'

export class FairlightMixerSourceEqualizerBandCommand extends WritableCommand<
	OmitReadonly<FairlightAudioEqualizerBandState>
> {
	public static MaskFlags = {
		bandEnabled: 1 << 0,
		shape: 1 << 1,
		frequencyRange: 1 << 2,
		frequency: 1 << 3,
		gain: 1 << 4,
		qFactor: 1 << 5,
	}

	public static readonly rawName = 'CEBP'

	public readonly index: number
	public readonly source: bigint
	public readonly band: number

	public constructor(index: number, source: bigint, band: number) {
		super()

		this.index = index
		this.source = source
		this.band = band
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(32)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt16BE(this.index, 2)
		buffer.writeBigInt64BE(this.source, 8)

		buffer.writeUInt8(this.band, 16)
		buffer.writeUInt8(this.properties.bandEnabled ? 1 : 0, 17)
		buffer.writeUInt8(this.properties.shape || 0, 18)
		buffer.writeUInt8(this.properties.frequencyRange || 0, 19)
		buffer.writeUInt32BE(this.properties.frequency || 0, 20)
		buffer.writeInt32BE(this.properties.gain || 0, 24)
		buffer.writeInt16BE(this.properties.qFactor || 0, 28)

		return buffer
	}
}

export class FairlightMixerSourceEqualizerBandUpdateCommand extends DeserializedCommand<FairlightAudioEqualizerBandState> {
	public static readonly rawName = 'AEBP'

	public readonly index: number
	public readonly source: bigint
	public readonly band: number

	constructor(index: number, source: bigint, band: number, properties: FairlightAudioEqualizerBandState) {
		super(properties)

		this.index = index
		this.source = source
		this.band = band
	}

	public static deserialize(rawCommand: Buffer): FairlightMixerSourceEqualizerBandUpdateCommand {
		const index = rawCommand.readUInt16BE(0)
		const source = rawCommand.readBigInt64BE(8)
		const band = rawCommand.readUInt8(16)
		const properties = {
			bandEnabled: rawCommand.readUInt8(17) > 0,
			supportedShapes: AtemUtil.getComponents(rawCommand.readUInt8(18)),
			shape: rawCommand.readUInt8(19),
			supportedFrequencyRanges: AtemUtil.getComponents(rawCommand.readUInt8(20)),
			frequencyRange: rawCommand.readUInt8(21),
			frequency: rawCommand.readUInt32BE(24),
			gain: rawCommand.readInt32BE(28),
			qFactor: rawCommand.readInt16BE(32),
		}

		return new FairlightMixerSourceEqualizerBandUpdateCommand(index, source, band, properties)
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

		if (!source.equalizer) {
			throw new InvalidIdError('Fairlight.Inputs.Source.Equalizer', this.index, sourceIdStr)
		}
		if (this.band >= source.equalizer.bands.length) {
			throw new InvalidIdError('Fairlight.Master.Equalizer', this.band)
		}

		source.equalizer.bands[this.band] = this.properties

		return `fairlight.inputs.${this.index}.sources.${sourceIdStr}.equalizer.bands.${this.band}`
	}
}
