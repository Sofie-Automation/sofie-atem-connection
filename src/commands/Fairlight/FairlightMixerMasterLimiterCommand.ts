import { FairlightAudioLimiterState } from '../../state/fairlight.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { OmitReadonly } from '../../lib/types.js'

export class FairlightMixerMasterLimiterCommand extends WritableCommand<OmitReadonly<FairlightAudioLimiterState>> {
	public static MaskFlags = {
		limiterEnabled: 1 << 0,
		threshold: 1 << 1,
		attack: 1 << 2,
		hold: 1 << 3,
		release: 1 << 4,
	}

	public static readonly rawName = 'CMLP'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(20)
		buffer.writeUInt8(this.flag, 0)

		buffer.writeUInt8(this.properties.limiterEnabled ? 1 : 0, 1)
		buffer.writeInt32BE(this.properties.threshold || 0, 4)
		buffer.writeInt32BE(this.properties.attack || 0, 8)
		buffer.writeInt32BE(this.properties.hold || 0, 12)
		buffer.writeInt32BE(this.properties.release || 0, 16)

		return buffer
	}
}

export class FairlightMixerMasterLimiterUpdateCommand extends DeserializedCommand<FairlightAudioLimiterState> {
	public static readonly rawName = 'AMLP'

	public static deserialize(rawCommand: Buffer): FairlightMixerMasterLimiterUpdateCommand {
		const properties = {
			limiterEnabled: rawCommand.readUInt8(0) > 0,
			threshold: rawCommand.readInt32BE(4),
			attack: rawCommand.readInt32BE(8),
			hold: rawCommand.readInt32BE(12),
			release: rawCommand.readInt32BE(16),
		}

		return new FairlightMixerMasterLimiterUpdateCommand(properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.fairlight) {
			throw new InvalidIdError('Fairlight')
		}

		if (!state.fairlight.master) {
			throw new InvalidIdError('Fairlight.Master')
		}

		if (!state.fairlight.master.dynamics) {
			state.fairlight.master.dynamics = {}
		}

		state.fairlight.master.dynamics.limiter = this.properties

		return `fairlight.master.dynamics.limiter`
	}
}
