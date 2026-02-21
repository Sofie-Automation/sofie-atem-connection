import { BasicWritableCommand } from '../CommandBase.js'

export interface DataTransferDownloadRequestProps {
	transferId: number
	transferStoreId: number
	transferIndex: number
	transferType: number
}

export class DataTransferDownloadRequestCommand extends BasicWritableCommand<DataTransferDownloadRequestProps> {
	public static readonly rawName = 'FTSU'

	public serialize(): Buffer {
		const buffer = Buffer.alloc(12)
		buffer.writeUInt16BE(this.properties.transferId, 0)
		buffer.writeUInt16BE(this.properties.transferStoreId, 2)
		buffer.writeUInt16BE(this.properties.transferIndex, 6)

		buffer.writeUInt16BE(this.properties.transferType, 8)

		return buffer
	}
}
