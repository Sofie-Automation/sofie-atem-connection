import { BasicWritableCommand } from '../CommandBase.js'

export class AutoTransitionCommand extends BasicWritableCommand<null> {
	public static readonly rawName = 'DAut'

	public readonly mixEffect: number

	constructor(mixEffect: number) {
		super(null)

		this.mixEffect = mixEffect
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.mixEffect, 0)
		return buffer
	}
}
