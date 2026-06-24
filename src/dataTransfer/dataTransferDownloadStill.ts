import { DataTransferDownloadRequestCommand } from '../commands/DataTransfer'
import { ProgressTransferResult, DataTransferState } from './dataTransfer'
import { DataTransferDownloadBuffer } from './dataTransferDownloadBuffer'

// The largest frame the ATEM can produce is 8K (7680x4320), stored as 10bit YUV422 (4 bytes per
// pixel). The downloaded buffer is RLE encoded, so allow 10% headroom for encoding overhead. This
// bounds memory usage if a device streams data without ever completing the transfer.
const MAX_STILL_DOWNLOAD_SIZE = Math.ceil(7680 * 4320 * 4 * 1.1)

export class DataTransferDownloadStill extends DataTransferDownloadBuffer {
	constructor(public readonly poolIndex: number, public readonly stillIndex: number) {
		super(stillIndex, MAX_STILL_DOWNLOAD_SIZE)
	}

	public async startTransfer(transferId: number): Promise<ProgressTransferResult> {
		const command = new DataTransferDownloadRequestCommand({
			transferId: transferId,
			transferStoreId: this.poolIndex,
			transferIndex: this.stillIndex,
			transferType: 0x00f9,
		})

		return {
			newState: DataTransferState.Ready,
			commands: [command],
		}
	}
}
