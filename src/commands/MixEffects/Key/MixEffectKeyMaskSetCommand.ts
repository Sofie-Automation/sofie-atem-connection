import { WritableCommand } from '../../CommandBase.js'
import { UpstreamKeyerMaskSettings } from '../../../state/video/upstreamKeyers.js'

export class MixEffectKeyMaskSetCommand extends WritableCommand<UpstreamKeyerMaskSettings> {
	public static MaskFlags = {
		maskEnabled: 1 << 0,
		maskTop: 1 << 1,
		maskBottom: 1 << 2,
		maskLeft: 1 << 3,
		maskRight: 1 << 4,
	}

	public static readonly rawName = 'CKMs'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, upstreamKeyerId: number) {
		super()

		this.mixEffect = mixEffect
		this.upstreamKeyerId = upstreamKeyerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(12)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.mixEffect, 1)
		buffer.writeUInt8(this.upstreamKeyerId, 2)

		buffer.writeUInt8(this.properties.maskEnabled ? 1 : 0, 3)
		buffer.writeInt16BE(this.properties.maskTop || 0, 4)
		buffer.writeInt16BE(this.properties.maskBottom || 0, 6)
		buffer.writeInt16BE(this.properties.maskLeft || 0, 8)
		buffer.writeInt16BE(this.properties.maskRight || 0, 10)

		return buffer
	}
}
