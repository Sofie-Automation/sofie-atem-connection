import { DeserializedCommand } from '../CommandBase.js'

export class LockObtainedCommand extends DeserializedCommand<{ index: number }> {
	public static readonly rawName = 'LKOB'

	constructor(index: number) {
		super({ index })
	}

	public static deserialize(rawCommand: Buffer): LockObtainedCommand {
		const index = rawCommand.readUInt16BE(0)

		return new LockObtainedCommand(index)
	}

	public applyToState(): string[] {
		// nothing to do
		return []
	}
}
