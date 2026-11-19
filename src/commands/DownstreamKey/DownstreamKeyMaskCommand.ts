import { WritableCommand } from '../CommandBase.js'
import { DownstreamKeyerMask } from '../../state/video/downstreamKeyers.js'

export class DownstreamKeyMaskCommand extends WritableCommand<DownstreamKeyerMask> {
	public static MaskFlags = {
		enabled: 1 << 0,
		top: 1 << 1,
		bottom: 1 << 2,
		left: 1 << 3,
		right: 1 << 4,
	}

	public static readonly rawName = 'CDsM'

	public readonly downstreamKeyerId: number

	constructor(downstreamKeyerId: number) {
		super()

		this.downstreamKeyerId = downstreamKeyerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(12)
		buffer.writeUInt8(this.flag, 0)
		buffer.writeUInt8(this.downstreamKeyerId, 1)
		buffer.writeUInt8(this.properties.enabled ? 1 : 0, 2)

		buffer.writeInt16BE(this.properties.top || 0, 4)
		buffer.writeInt16BE(this.properties.bottom || 0, 6)
		buffer.writeInt16BE(this.properties.left || 0, 8)
		buffer.writeInt16BE(this.properties.right || 0, 10)
		return buffer
	}
}
