import { DataTransferDownloadRequestCommand } from '../commands/DataTransfer'
import { ProgressTransferResult, DataTransferState } from './dataTransfer'
import { DataTransferDownloadBuffer } from './dataTransferDownloadBuffer'

// Macros are small xml documents. 1MB is far larger than any real macro, but bounds memory usage
// if a device streams data without ever completing the transfer.
const MAX_MACRO_DOWNLOAD_SIZE = 1024 * 1024

export class DataTransferDownloadMacro extends DataTransferDownloadBuffer {
	constructor(public readonly macroIndex: number) {
		super(macroIndex, MAX_MACRO_DOWNLOAD_SIZE)
	}

	public async startTransfer(transferId: number): Promise<ProgressTransferResult> {
		const command = new DataTransferDownloadRequestCommand({
			transferId: transferId,
			transferStoreId: 0xffff,
			transferIndex: this.macroIndex,
			transferType: 0x03fe,
		})

		return {
			newState: DataTransferState.Ready,
			commands: [command],
		}
	}
}
