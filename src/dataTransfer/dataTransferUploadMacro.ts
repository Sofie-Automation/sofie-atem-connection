import { DataTransferFileDescriptionCommand, DataTransferUploadRequestCommand } from '../commands/DataTransfer/index.js'
import { ISerializableCommand } from '../commands/CommandBase.js'
import { ProgressTransferResult, DataTransferState } from './dataTransfer.js'
import { DataTransferUploadBuffer } from './dataTransferUploadBuffer.js'

export class DataTransferUploadMacro extends DataTransferUploadBuffer {
	constructor(public readonly macroIndex: number, public readonly data: Buffer, private name: string) {
		super({
			encodedData: data,
			rawDataLength: data.length,
			isRleEncoded: false,
			hash: null,
		})
	}

	public async startTransfer(transferId: number): Promise<ProgressTransferResult> {
		const command = new DataTransferUploadRequestCommand({
			transferId: transferId,
			transferStoreId: 0xffff,
			transferIndex: this.macroIndex,
			size: this.data.length,
			mode: 768,
		})

		return {
			newState: DataTransferState.Ready,
			commands: [command],
		}
	}

	protected generateDescriptionCommand(transferId: number): ISerializableCommand {
		return new DataTransferFileDescriptionCommand({
			name: this.name,
			description: undefined,
			fileHash: '',
			transferId: transferId,
		})
	}
}
