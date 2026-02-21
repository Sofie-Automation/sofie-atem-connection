import { WritableCommand } from '../CommandBase.js'

export class FairlightMixerMasterEqualizerResetCommand extends WritableCommand<{ equalizer: boolean; band: number }> {
	public static MaskFlags = {
		equalizer: 1 << 0,
		band: 1 << 1,
	}

	public static readonly rawName = 'RMOE'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)

		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.properties.equalizer ? 1 : 0, 1)
		buffer.writeUInt8(this.properties.band || 0, 2)

		return buffer
	}
}
