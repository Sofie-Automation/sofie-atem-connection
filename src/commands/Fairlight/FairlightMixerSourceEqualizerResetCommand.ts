import { WritableCommand } from '../CommandBase.js'

export class FairlightMixerSourceEqualizerResetCommand extends WritableCommand<{ equalizer: boolean; band: number }> {
	public static MaskFlags = {
		equalizer: 1 << 0,
		band: 1 << 1,
	}

	public static readonly rawName = 'RICE'

	public readonly index: number
	public readonly source: bigint

	constructor(index: number, source: bigint) {
		super()

		this.index = index
		this.source = source
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(20)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt16BE(this.index, 2)
		buffer.writeBigInt64BE(this.source, 8)

		buffer.writeUInt8(this.properties.equalizer ? 1 : 0, 16)
		buffer.writeUInt8(this.properties.band || 0, 17)

		return buffer
	}
}
