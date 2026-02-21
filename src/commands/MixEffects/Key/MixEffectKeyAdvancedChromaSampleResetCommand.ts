import { BasicWritableCommand } from '../../CommandBase.js'

export interface AdvancedChromaSampleResetProps {
	keyAdjustments?: boolean
	chromaCorrection?: boolean
	colorAdjustments?: boolean
}

export class MixEffectKeyAdvancedChromaSampleResetCommand extends BasicWritableCommand<AdvancedChromaSampleResetProps> {
	public static readonly rawName = 'RACK'

	public readonly mixEffect: number
	public readonly upstreamKeyerId: number

	constructor(mixEffect: number, upstreamKeyerId: number, props: AdvancedChromaSampleResetProps) {
		super(props)

		this.mixEffect = mixEffect
		this.upstreamKeyerId = upstreamKeyerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.mixEffect, 0)
		buffer.writeUInt8(this.upstreamKeyerId, 1)

		let val = 0
		if (this.properties.keyAdjustments) {
			val |= 1 << 0
		}
		if (this.properties.chromaCorrection) {
			val |= 1 << 1
		}
		if (this.properties.colorAdjustments) {
			val |= 1 << 2
		}

		buffer.writeUInt8(val, 3)

		return buffer
	}
}
