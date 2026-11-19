import { BasicWritableCommand } from '../../CommandBase.js'

export class MixEffectKeyCutSourceSetCommand extends BasicWritableCommand<{ cutSource: number }> {
	public static readonly rawName = 'CKeC'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, upstreamKeyerId: number, cutSource: number) {
		super({ cutSource })

		this.mixEffect = mixEffect
		this.upstreamKeyerId = upstreamKeyerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.mixEffect, 0)
		buffer.writeUInt8(this.upstreamKeyerId, 1)
		buffer.writeUInt16BE(this.properties.cutSource, 2)
		return buffer
	}
}
