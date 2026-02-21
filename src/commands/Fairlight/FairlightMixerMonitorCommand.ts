import { FairlightAudioMonitorChannel } from '../../state/fairlight.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { DeserializedCommand, WritableCommand } from '../CommandBase.js'
import { OmitReadonly } from '../../lib/types.js'

export class FairlightMixerMonitorCommand extends WritableCommand<OmitReadonly<FairlightAudioMonitorChannel>> {
	public static MaskFlags = {
		gain: 1 << 0,
		inputMasterGain: 1 << 1,
		inputMasterMuted: 1 << 2,
		inputTalkbackGain: 1 << 3,
		inputTalkbackMuted: 1 << 4,
		inputSidetoneGain: 1 << 7,
	}

	public static readonly rawName = 'CFMH'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(36)
		buffer.writeUInt8(this.flag, 0)

		buffer.writeInt32BE(this.properties.gain || 0, 4)
		buffer.writeInt32BE(this.properties.inputMasterGain || 0, 8)
		buffer.writeUInt8(this.properties.inputMasterMuted ? 0 : 1, 12)
		buffer.writeInt32BE(this.properties.inputTalkbackGain || 0, 16)
		buffer.writeUInt8(this.properties.inputTalkbackMuted ? 0 : 1, 20)
		buffer.writeInt32BE(this.properties.inputSidetoneGain || 0, 32)
		return buffer
	}
}

export class FairlightMixerMonitorUpdateCommand extends DeserializedCommand<FairlightAudioMonitorChannel> {
	public static readonly rawName = 'FMHP'

	public static deserialize(rawCommand: Buffer): FairlightMixerMonitorUpdateCommand {
		const properties = {
			gain: rawCommand.readInt32BE(0),
			inputMasterGain: rawCommand.readInt32BE(4),
			inputMasterMuted: rawCommand.readUInt8(8) === 0,
			inputTalkbackGain: rawCommand.readInt32BE(12),
			inputTalkbackMuted: rawCommand.readUInt8(16) === 0,
			inputSidetoneGain: rawCommand.readInt32BE(28),
		}

		return new FairlightMixerMonitorUpdateCommand(properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.fairlight) {
			throw new InvalidIdError('Fairlight')
		}

		state.fairlight.monitor = {
			...this.properties,
		}

		return `fairlight.monitor`
	}
}
