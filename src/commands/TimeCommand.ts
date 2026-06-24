import { TimeInfo } from '../state/info.js'
import * as Enums from '../enums/index.js'
import { BasicWritableCommand } from './index.js'
import { SymmetricalCommand } from './CommandBase.js'

export class TimeCommand extends SymmetricalCommand<TimeInfo> {
	public static readonly rawName = 'Time'

	constructor(properties: TimeInfo | Omit<TimeInfo, 'dropFrame'>) {
		super({
			dropFrame: false,
			...properties,
		})
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(8)
		buffer.writeUInt8(this.properties.hour, 0)
		buffer.writeUInt8(this.properties.minute, 1)
		buffer.writeUInt8(this.properties.second, 2)
		buffer.writeUInt8(this.properties.frame, 3)

		buffer.writeUInt8(this.properties.dropFrame ? 1 : 0, 5)

		return buffer
	}

	public static deserialize(rawCommand: Buffer): TimeCommand {
		const properties = {
			hour: rawCommand.readUInt8(0),
			minute: rawCommand.readUInt8(1),
			second: rawCommand.readUInt8(2),
			frame: rawCommand.readUInt8(3),
			// Byte 4 looks to be a field marker
			dropFrame: rawCommand.readUInt8(5) === 1,
		}

		return new TimeCommand(properties)
	}

	public applyToState(): string[] {
		// Not stored in the state
		return []
	}
}

export class TimeRequestCommand extends BasicWritableCommand<null> {
	public static readonly rawName = 'TiRq'
	public static readonly minimumVersion = Enums.ProtocolVersion.V8_0

	constructor() {
		super(null)
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(0)
		return buffer
	}
}
