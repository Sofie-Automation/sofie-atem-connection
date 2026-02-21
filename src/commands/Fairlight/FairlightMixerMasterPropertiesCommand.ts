import { AtemState, InvalidIdError } from '../../state/index.js'
import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { OmitReadonly } from '../../lib/types.js'

export class FairlightMixerMasterPropertiesCommand extends WritableCommand<
	OmitReadonly<{ audioFollowVideo: boolean }>
> {
	public static MaskFlags = {
		audioFollowVideo: 1 << 0,
	}

	public static readonly rawName = 'CMPP'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.flag, 0)

		buffer.writeUInt8(this.properties.audioFollowVideo ? 1 : 0, 1)
		return buffer
	}
}

export class FairlightMixerMasterPropertiesUpdateCommand extends DeserializedCommand<{ audioFollowVideo: boolean }> {
	public static readonly rawName = 'FMPP'

	public static deserialize(rawCommand: Buffer): FairlightMixerMasterPropertiesUpdateCommand {
		const audioFollowVideo = rawCommand.readUInt8(0) > 0

		return new FairlightMixerMasterPropertiesUpdateCommand({ audioFollowVideo })
	}

	public applyToState(state: AtemState): string {
		if (!state.fairlight) {
			throw new InvalidIdError('Fairlight')
		}

		state.fairlight.audioFollowVideoCrossfadeTransitionEnabled = this.properties.audioFollowVideo

		return `fairlight.audioFollowVideoCrossfadeTransitionEnabled`
	}
}
