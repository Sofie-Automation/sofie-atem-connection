import { BasicWritableCommand } from '../CommandBase.js'

export interface DataTransferFileDescriptionProps {
	transferId: number
	name: string | undefined
	description: string | undefined
	fileHash: string
}

export class DataTransferFileDescriptionCommand extends BasicWritableCommand<DataTransferFileDescriptionProps> {
	public static readonly rawName = 'FTFD'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(212)
		buffer.writeUInt16BE(this.properties.transferId, 0)
		if (this.properties.name) buffer.write(this.properties.name, 2, 64)
		if (this.properties.description) buffer.write(this.properties.description, 66, 128)
		Buffer.from(this.properties.fileHash, 'base64').copy(buffer, 194, 0, 16)

		return buffer
	}
}
