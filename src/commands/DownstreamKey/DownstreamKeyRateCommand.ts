import { BasicWritableCommand } from '../CommandBase.js'

export class DownstreamKeyRateCommand extends BasicWritableCommand<{ rate: number }> {
	public static readonly rawName = 'CDsR'

	public readonly downstreamKeyerId: number

	constructor(downstreamKeyerId: number, rate: number) {
		super({ rate })

		this.downstreamKeyerId = downstreamKeyerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.downstreamKeyerId, 0)
		buffer.writeUInt8(this.properties.rate, 1)
		return buffer
	}
}
