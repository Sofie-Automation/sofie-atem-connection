import { BasicWritableCommand } from '../CommandBase.js'
import { MacroAction } from '../../enums/index.js'

export class MacroActionCommand extends BasicWritableCommand<{ action: MacroAction }> {
	public static readonly rawName = 'MAct'

	public readonly index: number

	constructor(index: number, action: MacroAction) {
		super({ action })

		this.index = index
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt8(this.properties.action, 2)
		switch (this.properties.action) {
			case MacroAction.Run:
			case MacroAction.Delete:
				buffer.writeUInt16BE(this.index, 0)
				break
			case MacroAction.Stop:
			case MacroAction.StopRecord:
			case MacroAction.InsertUserWait:
			case MacroAction.Continue:
				buffer.writeUInt16BE(0xffff, 0)
				break
			default:
				break
		}
		return buffer
	}
}
