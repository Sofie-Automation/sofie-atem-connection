import { FairlightAudioEqualizerBandState } from '../../state/fairlight.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { OmitReadonly } from '../../lib/types.js'
import * as AtemUtil from '../../lib/atemUtil.js'

export class FairlightMixerMasterEqualizerBandCommand extends WritableCommand<
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

	public static readonly rawName = 'CMBP'

	public readonly band: number

	public constructor(band: number) {
		super()

		this.band = band
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(20)
		buffer.writeUInt8(this.flag, 0)

		buffer.writeUInt8(this.band, 1)
		buffer.writeUInt8(this.properties.bandEnabled ? 1 : 0, 2)
		buffer.writeUInt8(this.properties.shape || 0, 3)
		buffer.writeUInt8(this.properties.frequencyRange || 0, 4)
		buffer.writeUInt32BE(this.properties.frequency || 0, 8)
		buffer.writeInt32BE(this.properties.gain || 0, 12)
		buffer.writeInt16BE(this.properties.qFactor || 0, 16)

		return buffer
	}
}

export class FairlightMixerMasterEqualizerBandUpdateCommand extends DeserializedCommand<FairlightAudioEqualizerBandState> {
	public static readonly rawName = 'AMBP'

	public readonly band: number

	constructor(band: number, properties: FairlightAudioEqualizerBandState) {
		super(properties)

		this.band = band
	}

	public static deserialize(rawCommand: Buffer): FairlightMixerMasterEqualizerBandUpdateCommand {
		const band = rawCommand.readUInt8(0)
		const properties = {
			bandEnabled: rawCommand.readUInt8(1) > 0,
			supportedShapes: AtemUtil.getComponents(rawCommand.readUInt8(2)),
			shape: rawCommand.readUInt8(3),
			supportedFrequencyRanges: AtemUtil.getComponents(rawCommand.readUInt8(4)),
			frequencyRange: rawCommand.readUInt8(5),
			frequency: rawCommand.readUInt32BE(8),
			gain: rawCommand.readInt32BE(12),
			qFactor: rawCommand.readInt16BE(16),
		}

		return new FairlightMixerMasterEqualizerBandUpdateCommand(band, properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.fairlight) {
			throw new InvalidIdError('Fairlight')
		}

		if (!state.fairlight.master) {
			throw new InvalidIdError('Fairlight.Master')
		}
		if (!state.fairlight.master.equalizer) {
			throw new InvalidIdError('Fairlight.Master.Equalizer')
		}
		if (this.band >= state.fairlight.master.equalizer.bands.length) {
			throw new InvalidIdError('Fairlight.Master.Equalizer', this.band)
		}

		state.fairlight.master.equalizer.bands[this.band] = this.properties

		return `fairlight.master.equalizer.bands.${this.band}`
	}
}
