import { BasicWritableCommand, DeserializedCommand } from '../CommandBase.js'

export interface LockStateProps {
	index: number
	locked: boolean
}

export class LockStateCommand extends BasicWritableCommand<LockStateProps> {
	public static readonly rawName = 'LOCK'

	constructor(index: number, locked: boolean) {
		super({ index, locked })
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)
		buffer.writeUInt16BE(this.properties.index, 0)
		buffer.writeUInt8(this.properties.locked ? 1 : 0, 2)
		return buffer
	}
}

export class LockStateUpdateCommand extends DeserializedCommand<LockStateProps> {
	public static readonly rawName = 'LKST'

	public static deserialize(rawCommand: Buffer): LockStateUpdateCommand {
		const properties = {
			index: rawCommand.readUInt16BE(0),
			locked: rawCommand.readUInt8(2) === 1,
		}

		return new LockStateUpdateCommand(properties)
	}

	public applyToState(): string | string[] {
		// Nothing to do
		return []
	}
}
