import { BasicWritableCommand } from '../CommandBase.js'

export class MacroAddTimedPauseCommand extends BasicWritableCommand<{ frames: number }> {
	public static readonly rawName = 'MSlp'

	constructor(frames: number) {
		super({ frames })
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt16BE(this.properties.frames, 2)
		return buffer
	}
}
