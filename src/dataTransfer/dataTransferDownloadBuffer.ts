import {
	DataTransferAckCommand,
	DataTransferCompleteCommand,
	DataTransferDataCommand,
	DataTransferErrorCommand,
	ErrorCode,
} from '../commands/DataTransfer'
import { IDeserializedCommand } from '../commands/CommandBase'
import { DataTransfer, ProgressTransferResult, DataTransferState } from './dataTransfer'

/**
 * Generic base for transfers which download a buffer from the ATEM.
 *
 * The data arrives as a sequence of `DataTransferDataCommand` packets, terminated by a
 * `DataTransferCompleteCommand`. A misbehaving or hostile device could stream data packets
 * indefinitely (or never send the completion), so each implementation must provide an upper
 * bound on the expected size. Once that bound is exceeded the transfer is aborted instead of
 * accumulating without limit until the process runs out of memory.
 */
export abstract class DataTransferDownloadBuffer extends DataTransfer<Buffer> {
	#data: Buffer[] = []
	#dataLength = 0

	/**
	 * @param transferIndex Index reported back in the ack commands
	 * @param maxBufferSize Hard cap on the total downloaded size, in bytes
	 */
	constructor(protected readonly transferIndex: number, private readonly maxBufferSize: number) {
		super()
	}

	public abstract startTransfer(transferId: number): Promise<ProgressTransferResult>

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
			this.#dataLength += command.properties.body.length

			// Guard against a device streaming an unbounded amount of data (or never completing the
			// transfer), which would otherwise grow this buffer until the process runs out of memory.
			if (this.#dataLength > this.maxBufferSize) {
				this.abort(new Error('Download exceeded maximum expected size'))

				return {
					newState: DataTransferState.Finished,
					commands: [],
				}
			}

			return {
				newState: oldState,
				commands: [
					new DataTransferAckCommand({
						transferId: command.properties.transferId,
						transferIndex: this.transferIndex,
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
