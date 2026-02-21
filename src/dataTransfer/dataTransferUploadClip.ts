import { IDeserializedCommand, ISerializableCommand } from '../commands/CommandBase.js'
import { DataTransferFileDescriptionCommand, DataTransferUploadRequestCommand } from '../commands/DataTransfer/index.js'
import { DataTransfer, DataTransferState, ProgressTransferResult } from './dataTransfer.js'
import { MediaPoolClearClipCommand, MediaPoolSetClipCommand } from '../commands/Media/index.js'
import debug0 from 'debug'
import { DataTransferUploadBuffer, UploadBufferInfo } from './dataTransferUploadBuffer.js'

const debug = debug0('atem-connection:data-transfer:upload-clip')

export type DataTransferFrameGenerator =
	| Generator<DataTransferUploadClipFrame, undefined>
	| AsyncGenerator<DataTransferUploadClipFrame, undefined>

export class DataTransferUploadClip extends DataTransfer<void> {
	readonly #clipIndex: number
	readonly #name: string
	readonly #frames: DataTransferFrameGenerator
	readonly #nextTransferId: () => number

	#currentFrame: DataTransferUploadClipFrame | undefined
	#numFrames = 0

	constructor(clipIndex: number, name: string, frames: DataTransferFrameGenerator, nextTransferId: () => number) {
		super()

		this.#clipIndex = clipIndex
		this.#name = name
		this.#frames = frames
		this.#nextTransferId = nextTransferId
	}

	private async nextFrame(): Promise<DataTransferUploadClipFrame | undefined> {
		const next = await this.#frames.next()
		return next.value
	}

	public async startTransfer(transferId: number): Promise<ProgressTransferResult> {
		this.#currentFrame = await this.nextFrame()
		if (!this.#currentFrame) {
			throw new Error('No frames available for transfer')
		}

		this.#numFrames++

		const frameResult = await this.#currentFrame.startTransfer(transferId)

		return {
			newState: DataTransferState.Ready,
			commands: [new MediaPoolClearClipCommand(this.#clipIndex), ...frameResult.commands],
		}
	}

	/** Restart the current transfer */
	public async restartTransfer(transferId: number): Promise<ProgressTransferResult> {
		if (this.#currentFrame) {
			return this.#currentFrame.startTransfer(transferId)
		} else {
			// TODO - is this correct?
			return this.startTransfer(transferId)
		}
	}

	public async handleCommand(
		command: IDeserializedCommand,
		oldState: DataTransferState
	): Promise<ProgressTransferResult> {
		if (!this.#currentFrame) {
			throw new Error('No frames available for transfer')
		}

		// TODO - is oldState appropriate here?
		const frameResult = await this.#currentFrame.handleCommand(command, oldState)
		debug(
			`handleCommand: ${DataTransferState[frameResult.newState]} - Giving ${frameResult.commands.length} commands`
		)

		if (frameResult.newState === DataTransferState.Finished) {
			// Get the next frame
			this.#currentFrame = await this.nextFrame()
			debug(`Start next frame (${!!this.#currentFrame})`)
			if (this.#currentFrame) {
				this.#numFrames++

				const newId = this.#nextTransferId()
				const newFrameResult = await this.#currentFrame.startTransfer(newId)

				return {
					newState: DataTransferState.Ready,
					newId: newId,
					commands: [...frameResult.commands, ...newFrameResult.commands],
				}
			} else {
				// Looks like we finished
				this.resolvePromise()

				debug(`Clip complete`)

				return {
					newState: DataTransferState.Finished,
					commands: [
						...frameResult.commands,
						new MediaPoolSetClipCommand({
							index: this.#clipIndex,
							name: this.#name,
							frames: this.#numFrames,
						}),
					],
				}
			}
		} else {
			return {
				newState: DataTransferState.Transferring,
				commands: frameResult.commands,
			}
		}
	}
}

export class DataTransferUploadClipFrame extends DataTransferUploadBuffer {
	readonly #clipIndex: number
	readonly #frameIndex: number
	readonly #dataLength: number

	constructor(clipIndex: number, frameIndex: number, buffer: UploadBufferInfo) {
		super(buffer)

		this.#clipIndex = clipIndex
		this.#frameIndex = frameIndex
		this.#dataLength = buffer.rawDataLength
	}

	public async startTransfer(transferId: number): Promise<ProgressTransferResult> {
		debug(`Start transfer ${transferId} (${this.#dataLength})`)
		const command = new DataTransferUploadRequestCommand({
			transferId: transferId,
			transferStoreId: this.#clipIndex + 1,
			transferIndex: this.#frameIndex,
			size: this.#dataLength,
			mode: 1,
		})

		return {
			newState: DataTransferState.Ready,
			commands: [command],
		}
	}

	protected generateDescriptionCommand(transferId: number): ISerializableCommand {
		debug(`Generate frame description for transfer ${transferId}`)
		return new DataTransferFileDescriptionCommand({
			name: undefined,
			description: undefined,
			fileHash: this.hash,
			transferId: transferId,
		})
	}
}
