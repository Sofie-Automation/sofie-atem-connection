import { BasicWritableCommand } from '../CommandBase.js'

export class DownstreamKeyTieCommand extends BasicWritableCommand<{ tie: boolean }> {
	public static readonly rawName = 'CDsT'

	public readonly downstreamKeyerId: number

	constructor(downstreamKeyerId: number, tie: boolean) {
		super({ tie })

		this.downstreamKeyerId = downstreamKeyerId
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.downstreamKeyerId, 0)
		buffer.writeUInt8(this.properties.tie ? 1 : 0, 1)
		return buffer
	}
}
