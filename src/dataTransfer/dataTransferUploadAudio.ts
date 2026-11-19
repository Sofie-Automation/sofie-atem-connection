import { ISerializableCommand } from '../commands/CommandBase.js'
import { DataTransferUploadBuffer } from './dataTransferUploadBuffer.js'
import { DataTransferFileDescriptionCommand, DataTransferUploadRequestCommand } from '../commands/DataTransfer/index.js'
import { ProgressTransferResult, DataTransferState } from './dataTransfer.js'

export default class DataTransferUploadAudio extends DataTransferUploadBuffer {
	readonly #clipIndex: number
	readonly #name: string

	constructor(clipIndex: number, data: Buffer, name: string) {
		super({
			encodedData: data,
			rawDataLength: data.length,
			isRleEncoded: false,
			hash: null,
		})

		this.#clipIndex = clipIndex
		this.#name = name
	}

	public async startTransfer(transferId: number): Promise<ProgressTransferResult> {
		const command = new DataTransferUploadRequestCommand({
			transferId: transferId,
			transferStoreId: this.#clipIndex + 1,
			transferIndex: 0,
			size: this.data.length,
			mode: 256,
		})

		return {
			newState: DataTransferState.Ready,
			commands: [command],
		}
	}

	protected generateDescriptionCommand(transferId: number): ISerializableCommand {
		return new DataTransferFileDescriptionCommand({
			name: this.#name,
			description: undefined,
			fileHash: this.hash,
			transferId: transferId,
		})
	}
}
