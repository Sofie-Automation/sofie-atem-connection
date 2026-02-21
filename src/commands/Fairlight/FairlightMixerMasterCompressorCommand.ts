import { FairlightAudioCompressorState } from '../../state/fairlight.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { OmitReadonly } from '../../lib/types.js'

export class FairlightMixerMasterCompressorCommand extends WritableCommand<
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

	public static readonly rawName = 'CMCP'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(24)
		buffer.writeUInt8(this.flag, 0)

		buffer.writeUInt8(this.properties.compressorEnabled ? 1 : 0, 1)
		buffer.writeInt32BE(this.properties.threshold || 0, 4)
		buffer.writeInt16BE(this.properties.ratio || 0, 8)
		buffer.writeInt32BE(this.properties.attack || 0, 12)
		buffer.writeInt32BE(this.properties.hold || 0, 16)
		buffer.writeInt32BE(this.properties.release || 0, 20)

		return buffer
	}
}

export class FairlightMixerMasterCompressorUpdateCommand extends DeserializedCommand<FairlightAudioCompressorState> {
	public static readonly rawName = 'MOCP'

	public static deserialize(rawCommand: Buffer): FairlightMixerMasterCompressorUpdateCommand {
		const properties = {
			compressorEnabled: rawCommand.readUInt8(0) > 0,
			threshold: rawCommand.readInt32BE(4),
			ratio: rawCommand.readInt16BE(8),
			attack: rawCommand.readInt32BE(12),
			hold: rawCommand.readInt32BE(16),
			release: rawCommand.readInt32BE(20),
		}

		return new FairlightMixerMasterCompressorUpdateCommand(properties)
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

		state.fairlight.master.dynamics.compressor = this.properties

		return `fairlight.master.dynamics.compressor`
	}
}
