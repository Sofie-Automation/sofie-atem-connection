import { BasicWritableCommand } from '../../CommandBase.js'
import { FlyKeyKeyFrame, FlyKeyDirection } from '../../../enums/index.js'

export class MixEffectKeyRunToCommand extends BasicWritableCommand<{
	keyFrameId: FlyKeyKeyFrame
	direction: FlyKeyDirection
}> {
	public static readonly rawName = 'RFlK'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, upstreamKeyerId: number, keyFrameId: FlyKeyKeyFrame, direction: FlyKeyDirection) {
		super({ keyFrameId, direction })

		this.mixEffect = mixEffect
		this.upstreamKeyerId = upstreamKeyerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt8(this.properties.keyFrameId === FlyKeyKeyFrame.RunToInfinite ? 2 : 0, 0)
		buffer.writeUInt8(this.mixEffect, 1)
		buffer.writeUInt8(this.upstreamKeyerId, 2)
		buffer.writeUInt8(this.properties.keyFrameId, 4)
		buffer.writeUInt8(this.properties.direction, 5)

		return buffer
	}
}
