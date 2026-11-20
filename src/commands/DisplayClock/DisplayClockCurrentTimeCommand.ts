import { DisplayClockTime } from '../../state/displayClock.js'
import { AtemState, InvalidIdError } from '../../state/index.js'
import { DeserializedCommand } from '../CommandBase.js'

export class DisplayClockCurrentTimeCommand extends DeserializedCommand<{ time: DisplayClockTime }> {
	public static readonly rawName = 'DSTV'

	constructor(time: DisplayClockTime) {
		super({ time })
	}

	public static deserialize(rawCommand: Buffer): DisplayClockCurrentTimeCommand {
		// Future: id at byte 0

		const time: DisplayClockTime = {
			hours: rawCommand.readUint8(1),
			minutes: rawCommand.readUint8(2),
			seconds: rawCommand.readUint8(3),
			frames: rawCommand.readUint8(4),
		}

		return new DisplayClockCurrentTimeCommand(time)
	}

	public applyToState(state: AtemState): string {
		if (!state.displayClock) {
			throw new InvalidIdError('DisplayClock')
		}

		state.displayClock.currentTime = this.properties.time
		return 'displayClock.currentTime'
	}
}
