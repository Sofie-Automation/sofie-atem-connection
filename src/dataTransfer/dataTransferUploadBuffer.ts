import { IDeserializedCommand, ISerializableCommand } from '../commands/CommandBase.js'
import {
	DataTransferCompleteCommand,
	DataTransferDataCommand,
	DataTransferErrorCommand,
	DataTransferUploadContinueCommand,
	DataTransferUploadContinueProps,
	ErrorCode,
} from '../commands/DataTransfer/index.js'
import * as crypto from 'crypto'
import { DataTransfer, ProgressTransferResult, DataTransferState } from './dataTransfer.js'
import debug0 from 'debug'
import { VideoModeInfo } from '../lib/videoMode.js'
import { convertRGBAToYUV422 } from '../lib/converters/rgbaToYuv422.js'
import { RLE_HEADER, encodeRLE } from '../lib/converters/rle.js'

const debug = debug0('atem-connection:data-transfer:upload-buffer')

export interface UploadBufferInfo {
	/**
	 * Encoded data in ATEM native format (eg YUVA for pixels, 24bit audio)
	 */
	encodedData: Buffer
	/**
	 * Length of the encoded data, before any RLE encoding
	 */
	rawDataLength: number
	/**
	 * Whether RLE encoding has been performed on this buffer (when supported)
	 */
	isRleEncoded: boolean
	/**
	 * Hash for the encoded data, intended as a unique identifier/checksum
	 * When `null`, one will be generated from the `encodedData`
	 * This is returned by the ATEM when describing what is in each slot
	 */
	hash: string | null
}

export function generateHashForBuffer(data: Buffer): string {
	return data ? crypto.createHash('md5').update(data).digest('base64') : ''
}

export function generateUploadBufferInfo(
	data: Buffer | UploadBufferInfo,
	resolution: VideoModeInfo,
	shouldEncodeRLE: boolean
): UploadBufferInfo {
	const expectedLength = resolution.width * resolution.height * 4
	if (Buffer.isBuffer(data)) {
		if (data.length !== expectedLength)
			throw new Error(`Pixel buffer has incorrect length. Received ${data.length} expected ${expectedLength}`)

		const encodedData = convertRGBAToYUV422(resolution.width, resolution.height, data)

		return {
			encodedData: shouldEncodeRLE ? encodeRLE(encodedData) : encodedData,
			rawDataLength: encodedData.length,
			isRleEncoded: shouldEncodeRLE,
			hash: generateHashForBuffer(encodedData),
		}
	} else {
		const result: UploadBufferInfo = { ...data }
		if (data.rawDataLength !== expectedLength)
			throw new Error(
				`Pixel buffer has incorrect length. Received ${data.rawDataLength} expected ${expectedLength}`
			)

		if (shouldEncodeRLE && !data.isRleEncoded) {
			data.isRleEncoded = true
			data.encodedData = encodeRLE(data.encodedData)
		}

		return result
	}
}

export abstract class DataTransferUploadBuffer extends DataTransfer<void> {
	protected readonly hash: string
	protected readonly data: Buffer

	#bytesSent = 0

	constructor(buffer: UploadBufferInfo) {
		super()

		this.hash = buffer.hash ?? generateHashForBuffer(buffer.encodedData)
		this.data = buffer.encodedData
	}

	protected abstract generateDescriptionCommand(transferId: number): ISerializableCommand

	public async handleCommand(
		command: IDeserializedCommand,
		oldState: DataTransferState
	): Promise<ProgressTransferResult> {
		if (command instanceof DataTransferErrorCommand) {
			switch (command.properties.errorCode) {
				case ErrorCode.Retry:
					return this.restartTransfer(command.properties.transferId)

				case ErrorCode.NotFound:
					this.abort(new Error('Invalid upload'))

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
		} else if (command instanceof DataTransferUploadContinueCommand) {
			const result: ProgressTransferResult = {
				newState: oldState,
				commands: [],
			}

			// Atem requested more packets of data
			if (oldState === DataTransferState.Ready) {
				// First bunch of packets, also send the description
				result.newState = DataTransferState.Transferring
				result.commands.push(this.generateDescriptionCommand(command.properties.transferId))
			}

			const nextChunks = this.getNextChunks(command.properties)
			result.commands.push(...nextChunks)

			// if (nextChunks.length === 0) this.abort(new Error('Ran out of data'))

			return result
		} else if (command instanceof DataTransferCompleteCommand) {
			// Atem reports that it recieved everything
			if (oldState === DataTransferState.Transferring) {
				this.resolvePromise()

				return {
					newState: DataTransferState.Finished,
					commands: [],
				}
			} else {
				return { newState: oldState, commands: [] }
			}
		} else {
			// Unknown command
			return { newState: oldState, commands: [] }
		}
	}

	private getNextChunks(props: DataTransferUploadContinueProps): ISerializableCommand[] {
		const commands: ISerializableCommand[] = []

		// Take a little less because the atem does that?
		// const chunkSize = props.chunkSize - 4
		const chunkSize = Math.floor(props.chunkSize / 8) * 8

		for (let i = 0; i < props.chunkCount; i++) {
			// Make sure the packet isn't empty
			if (this.#bytesSent >= this.data.length) break

			// Make sure the packet doesn't end in the middle of a RLE block
			let shortenBy = 0
			if (chunkSize + this.#bytesSent > this.data.length) {
				// The last chunk can't end with a RLE header
				shortenBy = this.#bytesSent + chunkSize - this.data.length
			} else if (RLE_HEADER === this.data.readBigUint64BE(this.#bytesSent + chunkSize - 8)) {
				// RLE header starts 8 bytes before the end
				shortenBy = 8
			} else if (RLE_HEADER === this.data.readBigUint64BE(this.#bytesSent + chunkSize - 16)) {
				// RLE header starts 16 bytes before the end
				shortenBy = 16
			}

			commands.push(
				new DataTransferDataCommand({
					transferId: props.transferId,
					body: this.data.slice(this.#bytesSent, this.#bytesSent + chunkSize - shortenBy),
				})
			)
			this.#bytesSent += chunkSize - shortenBy
		}

		debug(`Generated ${commands.length} chunks for size ${chunkSize}`)

		return commands
	}
}
