import {
	DataTransferAckCommand,
	DataTransferCompleteCommand,
	DataTransferDataCommand,
	DataTransferDownloadRequestCommand,
	DataTransferErrorCommand,
	ErrorCode,
} from '../commands/DataTransfer/index.js'
import { IDeserializedCommand } from '../commands/CommandBase.js'
import { DataTransfer, ProgressTransferResult, DataTransferState } from './dataTransfer.js'

// TODO - this should be reimplemented on top of a generic DataTransferDownloadBuffer class
export class DataTransferDownloadStill extends DataTransfer<Buffer> {
	#data: Buffer[] = []

	constructor(
		public readonly poolIndex: number,
		public readonly stillIndex: number
	) {
		super()
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

	public async handleCommand(
		command: IDeserializedCommand,
		oldState: DataTransferState
	): Promise<ProgressTransferResult> {
		if (command instanceof DataTransferErrorCommand) {
			switch (command.properties.errorCode) {
				case ErrorCode.Retry:
					return this.restartTransfer(command.properties.transferId)

				case ErrorCode.NotFound:
					this.abort(new Error('Invalid download'))

					return {
						newState: DataTransferState.Finished,
						commands: [],
					}
				default:
					// Abort the transfer.
					this.abort(new Error(`Unknown error ${command.properties.errorCode}`))

					return {
						newState: DataTransferState.Finished,
						commands: [],
					}
			}
		} else if (command instanceof DataTransferDataCommand) {
			this.#data.push(command.properties.body)

			// todo - have we received all data? maybe check if the command.body < max_len

			return {
				newState: oldState,
				commands: [
					new DataTransferAckCommand({
						transferId: command.properties.transferId,
						transferIndex: this.stillIndex,
					}),
				],
			}
		} else if (command instanceof DataTransferCompleteCommand) {
			this.resolvePromise(Buffer.concat(this.#data))

			return {
				newState: DataTransferState.Finished,
				commands: [],
			}
		}

		return { newState: oldState, commands: [] }
	}
}
