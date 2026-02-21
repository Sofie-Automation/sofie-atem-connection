import { WritableCommand, DeserializedCommand } from '../CommandBase.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { Util } from '../../index.js'
import { ClassicAudioMonitorChannel } from '../../state/audio.js'

export class AudioMixerMonitorCommand extends WritableCommand<ClassicAudioMonitorChannel> {
	public static MaskFlags = {
		enabled: 1 << 0,
		gain: 1 << 1,
		mute: 1 << 2,
		solo: 1 << 3,
		soloSource: 1 << 4,
		dim: 1 << 5,
		dimLevel: 1 << 6,
	}
	public static readonly rawName = 'CAMm'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(12)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.properties.enabled ? 1 : 0, 1)
		buffer.writeUInt16BE(Util.DecibelToUInt16BE(this.properties.gain || 0), 2)
		buffer.writeUInt8(this.properties.mute ? 1 : 0, 4)
		buffer.writeUInt8(this.properties.solo ? 1 : 0, 5)
		buffer.writeUInt16BE(this.properties.soloSource || 0, 6)
		buffer.writeUInt8(this.properties.dim ? 1 : 0, 8)
		buffer.writeUInt16BE(this.properties.dimLevel || 0, 10)
		return buffer
	}
}

export class AudioMixerMonitorUpdateCommand extends DeserializedCommand<ClassicAudioMonitorChannel> {
	public static readonly rawName = 'AMmO'

	public static deserialize(rawCommand: Buffer): AudioMixerMonitorUpdateCommand {
		const properties = {
			enabled: rawCommand.readUInt8(0) > 0,
			gain: Util.UInt16BEToDecibel(rawCommand.readUInt16BE(2)),

			mute: rawCommand.readUInt8(4) > 0,
			solo: rawCommand.readUInt8(5) > 0,
			soloSource: rawCommand.readUInt16BE(6),

			dim: rawCommand.readUInt8(8) > 0,
			dimLevel: rawCommand.readUInt16BE(10),
		}

		return new AudioMixerMonitorUpdateCommand(properties)
	}

	public applyToState(state: AtemState): string {
		if (!state.audio) {
			throw new InvalidIdError('Classic Audio')
		}

		state.audio.monitor = {
			...state.audio.monitor,
			...this.properties,
		}
		return `audio.monitor`
	}
}
