import { BasicWritableCommand } from '../CommandBase.js'

export class FairlightMixerSendLevelsCommand extends BasicWritableCommand<{ sendLevels: boolean }> {
	public static readonly rawName = 'SFLN'

	constructor(sendLevels: boolean) {
		super({ sendLevels })
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.properties.sendLevels ? 1 : 0, 0)
		return buffer
	}
}
