import { BasicWritableCommand } from '../CommandBase.js'

export class MediaPoolClearStillCommand extends BasicWritableCommand<{ index: number }> {
	public static readonly rawName = 'CSTL'

	constructor(index: number) {
		super({ index })
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.properties.index, 0)
		return buffer
	}
}
