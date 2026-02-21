import { FairlightAudioMasterChannelPropertiesState } from '../../state/fairlight.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { DeserializedCommand, WritableCommand } from '../CommandBase.js'

export interface FairlightMixerMasterCommandProperties extends FairlightAudioMasterChannelPropertiesState {
	equalizerEnabled: boolean
	equalizerGain: number

	makeUpGain: number
}

export class FairlightMixerMasterCommand extends WritableCommand<FairlightMixerMasterCommandProperties> {
	public static MaskFlags = {
		equalizerEnabled: 1 << 0,
		equalizerGain: 1 << 1,
		makeUpGain: 1 << 2,
		faderGain: 1 << 3,
		followFadeToBlack: 1 << 4,
	}

	public static readonly rawName = 'CFMP'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(20)
		buffer.writeUInt8(this.flag, 0)

		buffer.writeUInt8(this.properties.equalizerEnabled ? 1 : 0, 1)
		buffer.writeInt32BE(this.properties.equalizerGain || 0, 4)
		buffer.writeInt32BE(this.properties.makeUpGain || 0, 8)
		buffer.writeInt32BE(this.properties.faderGain || 0, 12)
		buffer.writeUInt8(this.properties.followFadeToBlack ? 1 : 0, 16)
		return buffer
	}
}

export class FairlightMixerMasterUpdateCommand extends DeserializedCommand<
	FairlightMixerMasterCommandProperties & { bandCount: number }
> {
	public static readonly rawName = 'FAMP'

	public static deserialize(rawCommand: Buffer): FairlightMixerMasterUpdateCommand {
		const properties = {
			bandCount: rawCommand.readUInt8(0),
			equalizerEnabled: rawCommand.readUInt8(1) > 0,
			equalizerGain: rawCommand.readInt32BE(4),
			makeUpGain: rawCommand.readInt32BE(8),
			faderGain: rawCommand.readInt32BE(12),
			followFadeToBlack: rawCommand.readUInt8(16) > 0,
		}

		return new FairlightMixerMasterUpdateCommand(properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.fairlight) {
			throw new InvalidIdError('Fairlight')
		}

		state.fairlight.master = {
			properties: {
				faderGain: this.properties.faderGain,
				followFadeToBlack: this.properties.followFadeToBlack,
			},
			dynamics: {
				...state.fairlight.master?.dynamics,
				makeUpGain: this.properties.makeUpGain,
			},
			equalizer: {
				...state.fairlight.master?.equalizer,
				enabled: this.properties.equalizerEnabled,
				gain: this.properties.equalizerGain,
				bands: state.fairlight.master?.equalizer?.bands ?? new Array(this.properties.bandCount).fill(undefined), // Assume bands number doesnt change
			},
		}

		return `fairlight.master`
	}
}
