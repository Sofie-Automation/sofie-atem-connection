import { WritableCommand, DeserializedCommand } from '../CommandBase.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { Util } from '../../index.js'
import { AudioMasterChannel } from '../../state/audio.js'

export class AudioMixerMasterCommand extends WritableCommand<AudioMasterChannel> {
	public static MaskFlags = {
		gain: 1 << 0,
		balance: 1 << 1,
		followFadeToBlack: 1 << 2,
	}
	public static readonly rawName = 'CAMM'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt16BE(Util.DecibelToUInt16BE(this.properties.gain || 0), 2)
		buffer.writeInt16BE(Util.BalanceToInt(this.properties.balance || 0), 4)
		buffer.writeUInt8(this.properties.followFadeToBlack ? 0x01 : 0x00, 6) // Note: I never got this one to work
		return buffer
	}
}

export class AudioMixerMasterUpdateCommand extends DeserializedCommand<AudioMasterChannel> {
	public static readonly rawName = 'AMMO'

	public static deserialize(rawCommand: Buffer): AudioMixerMasterUpdateCommand {
		const properties = {
			gain: Util.UInt16BEToDecibel(rawCommand.readUInt16BE(0)),
			balance: Util.IntToBalance(rawCommand.readInt16BE(2)),
			followFadeToBlack: rawCommand.readInt8(4) === 1,
		}

		return new AudioMixerMasterUpdateCommand(properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.audio) {
			throw new InvalidIdError('Classic Audio')
		}

		state.audio.master = {
			...state.audio.master,
			...this.properties,
		}
		return `audio.master`
	}
}
