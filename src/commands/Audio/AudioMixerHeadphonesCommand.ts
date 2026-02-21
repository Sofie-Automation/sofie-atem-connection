import { WritableCommand, DeserializedCommand } from '../CommandBase.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { Util } from '../../index.js'
import { ClassicAudioHeadphoneOutputChannel } from '../../state/audio.js'

export class AudioMixerHeadphonesCommand extends WritableCommand<ClassicAudioHeadphoneOutputChannel> {
	public static MaskFlags = {
		gain: 1 << 0,
		programOutGain: 1 << 1,
		talkbackGain: 1 << 2,
		sidetoneGain: 1 << 3,
	}
	public static readonly rawName = 'CAMH'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(12)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt16BE(Util.DecibelToUInt16BE(this.properties.gain || 0), 2)
		buffer.writeUInt16BE(Util.DecibelToUInt16BE(this.properties.programOutGain || 0), 4)
		buffer.writeUInt16BE(Util.DecibelToUInt16BE(this.properties.talkbackGain || 0), 6)
		buffer.writeUInt16BE(Util.DecibelToUInt16BE(this.properties.sidetoneGain || 0), 8)
		return buffer
	}
}

export class AudioMixerHeadphonesUpdateCommand extends DeserializedCommand<ClassicAudioHeadphoneOutputChannel> {
	public static readonly rawName = 'AMHP'

	public static deserialize(rawCommand: Buffer): AudioMixerHeadphonesUpdateCommand {
		const properties = {
			gain: Util.UInt16BEToDecibel(rawCommand.readUInt16BE(0)),
			programOutGain: Util.UInt16BEToDecibel(rawCommand.readUInt16BE(2)),
			talkbackGain: Util.UInt16BEToDecibel(rawCommand.readUInt16BE(4)),
			sidetoneGain: Util.UInt16BEToDecibel(rawCommand.readUInt16BE(6)),
		}

		return new AudioMixerHeadphonesUpdateCommand(properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.audio) {
			throw new InvalidIdError('Classic Audio')
		}

		state.audio.headphones = {
			...state.audio.headphones,
			...this.properties,
		}
		return `audio.headphones`
	}
}
