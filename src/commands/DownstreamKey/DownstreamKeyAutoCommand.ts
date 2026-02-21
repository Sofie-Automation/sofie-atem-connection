import { WritableCommand } from '../CommandBase.js'
import { ProtocolVersion } from '../../enums/index.js'

export class DownstreamKeyAutoCommand extends WritableCommand<{ isTowardsOnAir: boolean }> {
	public static readonly MaskFlags = {
		isTowardsOnAir: 1,
	}
	public static readonly rawName = 'DDsA'

	public readonly downstreamKeyerId: number

	constructor(downstreamKeyerId: number) {
		super()

		this.downstreamKeyerId = downstreamKeyerId
	}

	public serialize(version: ProtocolVersion): Buffer {
		const buffer = Buffer.alloc(4)

		if (version >= ProtocolVersion.V8_0_1) {
			buffer.writeUInt8(this.flag, 0)
			buffer.writeUInt8(this.downstreamKeyerId, 1)
			buffer.writeUInt8(this.properties.isTowardsOnAir ? 1 : 0, 2)
		} else {
			buffer.writeUInt8(this.downstreamKeyerId, 0)
		}

		return buffer
	}
}
