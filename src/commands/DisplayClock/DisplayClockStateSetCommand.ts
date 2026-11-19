import { DisplayClockClockState } from '../../enums/index.js'
import { BasicWritableCommand } from '../CommandBase.js'

export class DisplayClockStateSetCommand extends BasicWritableCommand<{ state: DisplayClockClockState }> {
	public static readonly rawName = 'DCSC'

	constructor(state: DisplayClockClockState) {
		super({ state })
	}

	public serialize(): Buffer {
		// Future: id at byte 0
		const buffer = Buffer.alloc(4)

		buffer.writeUint8(this.properties.state, 1)

		return buffer
	}
}
