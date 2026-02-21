import { SymmetricalCommand } from '../CommandBase.js'

export interface DataTransferAckProps {
	transferId: number
	transferIndex: number
}

export class DataTransferAckCommand extends SymmetricalCommand<DataTransferAckProps> {
	public static readonly rawName = 'FTUA'

	public static deserialize(rawCommand: Buffer): DataTransferAckCommand {
		const properties = {
			transferId: rawCommand.readUInt16BE(0),
			transferIndex: rawCommand.readUInt8(2),
		}

		return new DataTransferAckCommand(properties)
	}

	public serialize(): Buffer {
		const buffer = Buffer.alloc(4)

		buffer.writeUInt16BE(this.properties.transferId)
		buffer.writeUInt8(this.properties.transferIndex, 2)

		return buffer
	}

	public applyToState(): string[] {
		// Nothing to do
		return []
	}
}
