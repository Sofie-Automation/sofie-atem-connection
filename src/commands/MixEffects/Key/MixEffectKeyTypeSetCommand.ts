import { WritableCommand } from '../../CommandBase.js'
import { UpstreamKeyerTypeSettings } from '../../../state/video/upstreamKeyers.js'

export class MixEffectKeyTypeSetCommand extends WritableCommand<UpstreamKeyerTypeSettings> {
	public static MaskFlags = {
		mixEffectKeyType: 1 << 0,
		flyEnabled: 1 << 1,
	}

	public static readonly rawName = 'CKTp'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, upstreamKeyerId: number) {
		super()

		this.mixEffect = mixEffect
		this.upstreamKeyerId = upstreamKeyerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.mixEffect, 1)
		buffer.writeUInt8(this.upstreamKeyerId, 2)

		buffer.writeUInt8(this.properties.mixEffectKeyType || 0, 3)
		buffer.writeUInt8(this.properties.flyEnabled ? 1 : 0, 4)

		return buffer
	}
}
