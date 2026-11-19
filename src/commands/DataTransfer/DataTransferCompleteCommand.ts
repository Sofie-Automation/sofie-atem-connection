import { DeserializedCommand } from '../CommandBase.js'

export class DataTransferCompleteCommand extends DeserializedCommand<{ transferId: number }> {
	public static readonly rawName = 'FTDC'

	public static deserialize(rawCommand: Buffer): DataTransferCompleteCommand {
		const properties = {
			transferId: rawCommand.readUInt16BE(0),
		}

		return new DataTransferCompleteCommand(properties)
	}

	public applyToState(): string[] {
		// Nothing to do
		return []
	}
}
