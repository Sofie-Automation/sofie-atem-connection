import { DeserializedCommand } from '../CommandBase.js'

/** The known error codes */
export enum ErrorCode {
	Retry = 1,
	NotFound = 2,
	NotLocked = 5, // Maybe
}

export interface DataTransferErrorProps {
	transferId: number
	errorCode: ErrorCode
}

export class DataTransferErrorCommand extends DeserializedCommand<DataTransferErrorProps> {
	public static readonly rawName = 'FTDE'

	public static deserialize(rawCommand: Buffer): DataTransferErrorCommand {
		const properties = {
			transferId: rawCommand.readUInt16BE(0),
			errorCode: rawCommand.readUInt8(2),
		}

		return new DataTransferErrorCommand(properties)
	}

	public applyToState(): string[] {
		// Nothing to do
		return []
	}
}
