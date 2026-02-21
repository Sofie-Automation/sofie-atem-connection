import { ISerializableCommand } from '../commands/CommandBase.js'
import { DataTransferFileDescriptionCommand, DataTransferUploadRequestCommand } from '../commands/DataTransfer/index.js'
import { ProgressTransferResult, DataTransferState } from './dataTransfer.js'
import { DataTransferUploadBuffer, UploadBufferInfo } from './dataTransferUploadBuffer.js'

export default class DataTransferUploadStill extends DataTransferUploadBuffer {
	readonly #stillIndex: number
	readonly #name: string
	readonly #description: string
	readonly #dataLength: number

	constructor(stillIndex: number, buffer: UploadBufferInfo, name: string, description: string) {
		super(buffer)

		this.#stillIndex = stillIndex
		this.#name = name
		this.#description = description
		this.#dataLength = buffer.rawDataLength
	}

	public async startTransfer(transferId: number): Promise<ProgressTransferResult> {
		const command = new DataTransferUploadRequestCommand({
			transferId: transferId,
			transferStoreId: 0,
			transferIndex: this.#stillIndex,
			size: this.#dataLength,
			mode: 1,
		})

		return {
			newState: DataTransferState.Ready,
			commands: [command],
		}
	}

	protected generateDescriptionCommand(transferId: number): ISerializableCommand {
		return new DataTransferFileDescriptionCommand({
			description: this.#description,
			name: this.#name,
			fileHash: this.hash,
			transferId: transferId,
		})
	}
}
