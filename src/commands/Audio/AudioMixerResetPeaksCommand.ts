import { WritableCommand } from '../CommandBase.js'

export interface ClassicAudioResetPeaks {
	all: boolean
	input: number
	master: boolean
	monitor: boolean
}

export class AudioMixerResetPeaksCommand extends WritableCommand<ClassicAudioResetPeaks> {
	public static MaskFlags = {
		all: 1 << 0,
		input: 1 << 1,
		master: 1 << 2,
		monitor: 1 << 3,
	}
	public static readonly rawName = 'RAMP'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.properties.all ? 1 : 0, 1)
		buffer.writeUInt16BE(this.properties.input || 0, 2)
		buffer.writeUInt8(this.properties.master ? 1 : 0, 4)
		buffer.writeUInt8(this.properties.monitor ? 1 : 0, 5)
		return buffer
	}
}
