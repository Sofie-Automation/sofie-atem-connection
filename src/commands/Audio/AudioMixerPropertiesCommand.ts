import { BasicWritableCommand, DeserializedCommand } from '../CommandBase.js'
import { AtemState, InvalidIdError } from '../../state/index.js'

export class AudioMixerPropertiesCommand extends BasicWritableCommand<{ audioFollowVideo: boolean }> {
	public static readonly rawName = 'CAMP'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(1 << 0, 0) // Mask
		buffer.writeUInt8(this.properties.audioFollowVideo ? 1 : 0, 1)
		return buffer
	}
}

export class AudioMixerPropertiesUpdateCommand extends DeserializedCommand<{ audioFollowVideo: boolean }> {
	public static readonly rawName = 'AMPP'

	public static deserialize(rawCommand: Buffer): AudioMixerPropertiesUpdateCommand {
		const audioFollowVideo = rawCommand.readUInt8(0) > 0

		return new AudioMixerPropertiesUpdateCommand({ audioFollowVideo })
	}

	public applyToState(state: AtemState): string {
		if (!state.audio) {
			throw new InvalidIdError('Classic Audio')
		}

		state.audio.audioFollowVideoCrossfadeTransitionEnabled = this.properties.audioFollowVideo
		return `audio.audioFollowVideoCrossfadeTransitionEnabled`
	}
}
