import { DisplayClockProperties } from '../../state/displayClock.js'
import { AtemState } from '../../state/index.js'
import { DeserializedCommand } from '../CommandBase.js'

export class DisplayClockPropertiesGetCommand extends DeserializedCommand<DisplayClockProperties> {
	public static readonly rawName = 'DCPV'

	constructor(props: DisplayClockProperties) {
		super(props)
	}

	public static deserialize(rawCommand: Buffer): DisplayClockPropertiesGetCommand {
		// Future: id at byte 0

		const props: DisplayClockProperties = {
			enabled: !!rawCommand.readUint8(1),
			size: rawCommand.readUint8(3),
			opacity: rawCommand.readUint8(5),
			positionX: rawCommand.readInt16BE(6),
			positionY: rawCommand.readInt16BE(8),
			autoHide: !!rawCommand.readUint8(10),
			startFrom: {
				hours: rawCommand.readUint8(11),
				minutes: rawCommand.readUint8(12),
				seconds: rawCommand.readUint8(13),
				frames: rawCommand.readUint8(14),
			},
			clockMode: rawCommand.readUint8(15),
			clockState: rawCommand.readUint8(16),
		}

		return new DisplayClockPropertiesGetCommand(props)
	}

	public applyToState(state: AtemState): string {
		state.displayClock = {
			currentTime: {
				hours: 0,
				minutes: 0,
				seconds: 0,
				frames: 0,
			},
			...state.displayClock,
			properties: this.properties,
		}
		return 'displayClock.properties'
	}
}
