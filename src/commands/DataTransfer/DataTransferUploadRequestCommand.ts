import { BasicWritableCommand } from '../CommandBase.js'

export interface DataTransferUploadRequestProps {
	transferId: number
	transferStoreId: number
	transferIndex: number
	size: number
	mode: number // Note: maybe this should be an enum, but we don't have a good description, and it shouldn't be used externally
}

export class DataTransferUploadRequestCommand extends BasicWritableCommand<DataTransferUploadRequestProps> {
	public static readonly rawName = 'FTSD'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(16)
		buffer.writeUInt16BE(this.properties.transferId, 0)
		buffer.writeUInt16BE(this.properties.transferStoreId, 2)
		buffer.writeUInt16BE(this.properties.transferIndex, 6)
		buffer.writeUInt32BE(this.properties.size, 8)
		buffer.writeUInt16BE(this.properties.mode, 12)
		return buffer
	}
}
