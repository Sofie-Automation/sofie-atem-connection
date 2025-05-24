import * as EventEmitter from 'eventemitter3'
import { AtemState, AtemStateUtil, InvalidIdError } from './state'
import { AtemSocket } from './lib/atemSocket'
import { ISerializableCommand, IDeserializedCommand } from './commands/CommandBase'
import * as Commands from './commands'
import * as DataTransferCommands from './commands/DataTransfer'
import * as DT from './dataTransfer'
import * as Util from './lib/atemUtil'
import { VideoModeInfo, getVideoModeInfo } from './lib/videoMode'
import { listVisibleInputs } from './lib/tally'
import {
	calculateGenerateMultiviewerLabelProps,
	generateMultiviewerLabel,
	hasInternalMultiviewerLabelGeneration,
	loadFont,
} from './lib/multiviewLabel'
import { FontFace } from '@julusian/freetype2'
import PLazy = require('p-lazy')
import { TimeCommand } from './commands'
import { TimeInfo } from './state/info'
import { SomeAtemAudioLevels } from './state/levels'
import { generateUploadBufferInfo, UploadBufferInfo } from './dataTransfer/dataTransferUploadBuffer'
import { convertWAVToRaw } from './lib/converters/wavAudio'
import { decodeRLE } from './lib/converters/rle'
import { convertYUV422ToRGBA } from './lib/converters/yuv422ToRgba'
import { AtemCommandSender } from './lib/atemCommands'
import * as Enums from './enums'

export interface AtemOptions {
	address?: string
	port?: number
	debugBuffers?: boolean
	disableMultithreaded?: boolean
	childProcessTimeout?: number
	/**
	 * Maximum size of packets to transmit
	 */
	maxPacketSize?: number
}

export type AtemEvents = {
	error: [string]
	info: [string]
	debug: [string]
	connected: []
	disconnected: []
	stateChanged: [AtemState, string[]]
	levelChanged: [SomeAtemAudioLevels]
	receivedCommands: [IDeserializedCommand[]]
	updatedTime: [TimeInfo]
}

interface SentPackets {
	resolve: () => void
	reject: () => void
}

export enum AtemConnectionStatus {
	CLOSED,
	CONNECTING,
	CONNECTED,
}

export const DEFAULT_PORT = 9910
export const DEFAULT_MAX_PACKET_SIZE = 1416 // Matching ATEM software

export interface IBasicAtem {
	get status(): AtemConnectionStatus
	get state(): Readonly<AtemState> | undefined

	/**
	 * Get the current videomode of the ATEM, if known
	 */
	get videoMode(): Readonly<VideoModeInfo> | undefined

	connect(address: string, port?: number): Promise<void>
	disconnect(): Promise<void>
	destroy(): Promise<void>

	sendCommands(commands: ISerializableCommand[]): Promise<void>
	sendCommand(command: ISerializableCommand): Promise<void>
}

class AtemWrapper {
	private readonly emitter: EventEmitter<AtemEvents>
	private readonly socket: AtemSocket
	public readonly dataTransferManager: DT.DataTransferManager // TODO - this should be protected/private but we need to access it from the Atem class
	private _state: AtemState | undefined
	private _sentQueue: { [packetId: string]: SentPackets } = {}
	private _status: AtemConnectionStatus

	constructor(emitter: EventEmitter<AtemEvents>, options: AtemOptions) {
		this.emitter = emitter
		this._state = AtemStateUtil.Create()
		this._status = AtemConnectionStatus.CLOSED
		this.socket = new AtemSocket({
			debugBuffers: options?.debugBuffers ?? false,
			address: options?.address || '',
			port: options?.port || DEFAULT_PORT,
			disableMultithreaded: options?.disableMultithreaded ?? false,
			childProcessTimeout: options?.childProcessTimeout || 600,
			maxPacketSize: options?.maxPacketSize ?? DEFAULT_MAX_PACKET_SIZE,
		})
		this.dataTransferManager = new DT.DataTransferManager(this.sendCommands.bind(this))

		this.socket.on('receivedCommands', (commands) => {
			this.emitter.emit('receivedCommands', commands)
			this._mutateState(commands)
		})
		this.socket.on('ackPackets', (trackingIds) => this._resolveCommands(trackingIds))
		this.socket.on('info', (msg) => this.emitter.emit('info', msg))
		this.socket.on('debug', (msg) => this.emitter.emit('debug', msg))
		this.socket.on('error', (e) => this.emitter.emit('error', e))
		this.socket.on('disconnect', () => {
			this._status = AtemConnectionStatus.CLOSED
			this.dataTransferManager.stopCommandSending()
			this._rejectAllCommands()
			this.emitter.emit('disconnected')
			this._state = undefined
		})
	}

	private _onInitComplete(): void {
		this.dataTransferManager.startCommandSending()
		this.emitter.emit('connected')
	}

	get status(): AtemConnectionStatus {
		return this._status
	}

	get state(): Readonly<AtemState> | undefined {
		return this._state
	}

	/**
	 * Get the current videomode of the ATEM, if known
	 */
	get videoMode(): Readonly<VideoModeInfo> | undefined {
		if (!this.state) return undefined

		return getVideoModeInfo(this.state.settings.videoMode)
	}

	public async connect(address: string, port?: number): Promise<void> {
		return this.socket.connect(address, port)
	}

	public async disconnect(): Promise<void> {
		return this.socket.disconnect()
	}

	public async destroy(): Promise<void> {
		this.dataTransferManager.stopCommandSending()
		return this.socket.destroy()
	}

	public async sendCommands(commands: ISerializableCommand[]): Promise<void> {
		const trackingIds = await this.socket.sendCommands(commands)

		const promises: Promise<void>[] = []

		for (const trackingId of trackingIds) {
			promises.push(
				new Promise<void>((resolve, reject) => {
					this._sentQueue[trackingId] = {
						resolve,
						reject,
					}
				})
			)
		}

		await Promise.allSettled(promises)
	}

	private _mutateState(commands: IDeserializedCommand[]): void {
		// Is this the start of a new connection?
		if (commands.find((cmd) => cmd instanceof Commands.VersionCommand)) {
			// On start of connection, create a new state object
			this._state = AtemStateUtil.Create()
			this._status = AtemConnectionStatus.CONNECTING
		}

		const allChangedPaths: string[] = []

		const state = this._state
		for (const command of commands) {
			if (command instanceof TimeCommand) {
				this.emitter.emit('updatedTime', command.properties)
			} else if (command instanceof Commands.FairlightMixerMasterLevelsUpdateCommand) {
				this.emitter.emit('levelChanged', {
					system: 'fairlight',
					type: 'master',
					levels: command.properties,
				})
			} else if (command instanceof Commands.FairlightMixerSourceLevelsUpdateCommand) {
				this.emitter.emit('levelChanged', {
					system: 'fairlight',
					type: 'source',
					source: command.source,
					index: command.index,
					levels: command.properties,
				})
			} else if (state) {
				try {
					const changePaths = command.applyToState(state)
					if (!Array.isArray(changePaths)) {
						allChangedPaths.push(changePaths)
					} else {
						allChangedPaths.push(...changePaths)
					}
				} catch (e) {
					if (e instanceof InvalidIdError) {
						this.emitter.emit(
							'debug',
							`Invalid command id: ${e}. Command: ${command.constructor.name} ${Util.commandStringify(
								command
							)}`
						)
					} else {
						this.emitter.emit(
							'error',
							`MutateState failed: ${e}. Command: ${command.constructor.name} ${Util.commandStringify(
								command
							)}`
						)
					}
				}
			}

			for (const commandName in DataTransferCommands) {
				// TODO - this is fragile
				if (command.constructor.name === commandName) {
					this.dataTransferManager.queueHandleCommand(command)
				}
			}
		}

		const initComplete = commands.find((cmd) => cmd instanceof Commands.InitCompleteCommand)
		if (initComplete) {
			this._status = AtemConnectionStatus.CONNECTED
			this._onInitComplete()
		} else if (state && this._status === AtemConnectionStatus.CONNECTED && allChangedPaths.length > 0) {
			this.emitter.emit('stateChanged', state, allChangedPaths)
		}
	}

	private _resolveCommands(trackingIds: number[]): void {
		trackingIds.forEach((trackingId) => {
			const sent = this._sentQueue[trackingId]
			if (sent) {
				sent.resolve()
				delete this._sentQueue[trackingId]
			}
		})
	}

	private _rejectAllCommands(): void {
		// Take a copy in case the promises cause more mutations
		const sentQueue = this._sentQueue
		this._sentQueue = {}

		Object.values<SentPackets>(sentQueue).forEach((sent) => sent.reject())
	}
}

export class BasicAtem extends EventEmitter<AtemEvents> implements IBasicAtem {
	readonly #client: AtemWrapper

	constructor(options?: AtemOptions) {
		super()

		this.#client = new AtemWrapper(this, options || {})
	}

	get status(): AtemConnectionStatus {
		return this.#client.status
	}

	get state(): Readonly<AtemState> | undefined {
		return this.#client.state
	}

	/**
	 * Get the current videomode of the ATEM, if known
	 */
	get videoMode(): Readonly<VideoModeInfo> | undefined {
		return this.#client.videoMode
	}

	public async connect(address: string, port?: number): Promise<void> {
		return this.#client.connect(address, port)
	}

	public async disconnect(): Promise<void> {
		return this.#client.disconnect()
	}

	public async destroy(): Promise<void> {
		return this.#client.destroy()
	}

	public async sendCommands(commands: ISerializableCommand[]): Promise<void> {
		return this.#client.sendCommands(commands)
	}

	public async sendCommand(command: ISerializableCommand): Promise<void> {
		return this.#client.sendCommands([command])
	}
}

export class Atem extends AtemCommandSender<Promise<void>> implements EventEmitter<AtemEvents>, IBasicAtem {
	readonly #client: AtemWrapper
	readonly #events = new EventEmitter<AtemEvents>()

	#multiviewerFontFace: Promise<FontFace>
	#multiviewerFontScale: number

	protected get apiVersion(): Enums.ProtocolVersion | undefined {
		return this.#client.state?.info?.apiVersion
	}

	constructor(options?: AtemOptions) {
		super()

		this.#client = new AtemWrapper(this.#events, options || {})

		this.#multiviewerFontFace = PLazy.from(async () => loadFont())
		this.#multiviewerFontScale = 1.0
	}

	/** @begin IBasicAtem */

	get status(): AtemConnectionStatus {
		return this.#client.status
	}
	get state(): Readonly<AtemState> | undefined {
		return this.#client.state
	}

	/**
	 * Get the current videomode of the ATEM, if known
	 */
	get videoMode(): Readonly<VideoModeInfo> | undefined {
		return this.#client.videoMode
	}

	async connect(address: string, port?: number): Promise<void> {
		return this.#client.connect(address, port)
	}
	async disconnect(): Promise<void> {
		return this.#client.disconnect()
	}
	async destroy(): Promise<void> {
		return this.#client.destroy()
	}

	async sendCommands(commands: ISerializableCommand[]): Promise<void> {
		return this.#client.sendCommands(commands)
	}
	async sendCommand(command: ISerializableCommand): Promise<void> {
		return this.#client.sendCommands([command])
	}

	/** @end IBasicAtem */

	/**
	 * Set the font to use for the multiviewer, or reset to default
	 */
	public async setMultiviewerFontFace(font: FontFace | string | null): Promise<void> {
		let loadedFont: FontFace
		if (font) {
			if (typeof font === 'string') {
				loadedFont = await loadFont(font)
			} else {
				loadedFont = font
			}
		} else {
			loadedFont = await loadFont()
		}

		this.#multiviewerFontFace = Promise.resolve(loadedFont)
	}
	/**
	 * Set the scale factor for the multiviewer text. Default is 1
	 */
	public setMultiviewerFontScale(scale: number | null): void {
		if (typeof scale === 'number') {
			if (scale <= 0) throw new Error('Scale must be greater than 0')
			this.#multiviewerFontScale = scale
		} else if (scale === null) {
			this.#multiviewerFontScale = 1.0
		}
	}

	public async downloadMacro(index: number): Promise<Buffer> {
		return this.#client.dataTransferManager.downloadMacro(index)
	}
	public async uploadMacro(index: number, name: string, data: Buffer): Promise<void> {
		return this.#client.dataTransferManager.uploadMacro(index, data, name)
	}

	/**
	 * Download a still image from the ATEM media pool
	 *
	 * Note: This performs colour conversions in JS, which is not very CPU efficient. If performance is important,
	 * consider using [@atem-connection/image-tools](https://www.npmjs.com/package/@atem-connection/image-tools) to
	 * pre-convert the images with more optimal algorithms
	 * @param index Still index to download
	 * @param format The pixel format to return for the downloaded image. 'raw' passes through unchanged, and will be RLE encoded.
	 * @returns Promise which returns the image once downloaded. If the still slot is not in use, this will throw
	 */
	public async downloadStill(index: number, format: 'raw' | 'rgba' | 'yuv' = 'rgba'): Promise<Buffer> {
		let rawBuffer = await this.#client.dataTransferManager.downloadStill(index)

		if (format === 'raw') {
			return rawBuffer
		}

		if (!this.state) throw new Error('Unable to check current resolution')
		const resolution = getVideoModeInfo(this.state.settings.videoMode)
		if (!resolution) throw new Error('Failed to determine required resolution')

		rawBuffer = decodeRLE(rawBuffer, resolution.width * resolution.height * 4)

		switch (format) {
			case 'yuv':
				return rawBuffer
			case 'rgba':
			default:
				return convertYUV422ToRGBA(resolution.width, resolution.height, rawBuffer)
		}
	}

	/**
	 * Upload a still image to the ATEM media pool
	 *
	 * Note: This performs colour conversions in JS, which is not very CPU efficient. If performance is important,
	 * consider using [@atem-connection/image-tools](https://www.npmjs.com/package/@atem-connection/image-tools) to
	 * pre-convert the images with more optimal algorithms
	 * @param index Still index to upload to
	 * @param data a RGBA pixel buffer, or an already YUVA encoded image
	 * @param name Name to give the uploaded image
	 * @param description Description for the uploaded image
	 * @param options Upload options
	 * @returns Promise which resolves once the image is uploaded
	 */
	public async uploadStill(
		index: number,
		data: Buffer | UploadBufferInfo,
		name: string,
		description: string,
		options?: DT.UploadStillEncodingOptions
	): Promise<void> {
		if (!this.state) throw new Error('Unable to check current resolution')
		const resolution = getVideoModeInfo(this.state.settings.videoMode)
		if (!resolution) throw new Error('Failed to determine required resolution')

		const encodedData = generateUploadBufferInfo(data, resolution, !options?.disableRLE)

		return this.#client.dataTransferManager.uploadStill(index, encodedData, name, description)
	}

	/**
	 * Upload a clip to the ATEM media pool
	 *
	 * Note: This performs colour conversions in JS, which is not very CPU efficient. If performance is important,
	 * consider using [@atem-connection/image-tools](https://www.npmjs.com/package/@atem-connection/image-tools) to
	 * pre-convert the images with more optimal algorithms
	 * @param index Clip index to upload to
	 * @param frames Array or generator of frames. Each frame can be a RGBA pixel buffer, or an already YUVA encoded image
	 * @param name Name to give the uploaded clip
	 * @param options Upload options
	 * @returns Promise which resolves once the clip is uploaded
	 */
	public async uploadClip(
		index: number,
		frames: Iterable<Buffer> | AsyncIterable<Buffer> | Iterable<UploadBufferInfo> | AsyncIterable<UploadBufferInfo>,
		name: string,
		options?: DT.UploadStillEncodingOptions
	): Promise<void> {
		if (!this.state) throw new Error('Unable to check current resolution')
		const resolution = getVideoModeInfo(this.state.settings.videoMode)
		if (!resolution) throw new Error('Failed to determine required resolution')

		const provideFrame = async function* (): AsyncGenerator<UploadBufferInfo> {
			for await (const frame of frames) {
				yield generateUploadBufferInfo(frame, resolution, !options?.disableRLE)
			}
		}
		return this.#client.dataTransferManager.uploadClip(index, provideFrame(), name)
	}

	/**
	 * Upload clip audio to the ATEM media pool
	 * @param index Clip index to upload to
	 * @param data stereo 48khz 24bit WAV audio data
	 * @param name Name to give the uploaded audio
	 * @returns Promise which resolves once the clip audio is uploaded
	 */
	public async uploadAudio(index: number, data: Buffer, name: string): Promise<void> {
		return this.#client.dataTransferManager.uploadAudio(index, convertWAVToRaw(data, this.state?.info?.model), name)
	}

	public listVisibleInputs(mode: 'program' | 'preview', me = 0): number[] {
		if (this.state) {
			return listVisibleInputs(mode, this.state, me)
		} else {
			return []
		}
	}

	public hasInternalMultiviewerLabelGeneration(): boolean {
		return !!this.state && hasInternalMultiviewerLabelGeneration(this.state?.info.model)
	}

	/**
	 * Write a custom multiviewer label buffer
	 * @param inputId The input id
	 * @param buffer Label buffer
	 * @returns Promise that resolves once upload is complete
	 */
	public async writeMultiviewerLabel(inputId: number, buffer: Buffer): Promise<void> {
		if (this.hasInternalMultiviewerLabelGeneration()) throw new Error(`ATEM doesn't support custom labels`)

		// Verify the buffer doesnt contain data that is 'out of bounds' and will crash the atem
		const badValues = new Set([255, 254])
		for (const val of buffer) {
			if (badValues.has(val)) {
				throw new Error(`Buffer contains invalid value ${val}`)
			}
		}

		return this.#client.dataTransferManager.uploadMultiViewerLabel(inputId, buffer)
	}

	/**
	 * Generate and upload a multiviewer label
	 * @param inputId The input id
	 * @param text Label text
	 * @returns Promise that resolves once upload is complete
	 */
	public async drawMultiviewerLabel(inputId: number, text: string): Promise<void> {
		if (this.hasInternalMultiviewerLabelGeneration()) throw new Error(`ATEM doesn't support custom labels`)

		const props = calculateGenerateMultiviewerLabelProps(this.state ?? null)
		if (!props) throw new Error(`Failed to determine render properties`)

		const fontFace = await this.#multiviewerFontFace

		const buffer = generateMultiviewerLabel(fontFace, this.#multiviewerFontScale, text, props)
		// Note: we should probably validate the buffer looks like it doesn't contain crashy data, but as we generate we can trust it
		return this.#client.dataTransferManager.uploadMultiViewerLabel(inputId, buffer)
	}

	/** @begin EventEmitter */
	/* This isn't nice, but is necessary to 'extend' two classes */

	/**
	 * Return an array listing the events for which the emitter has registered
	 * listeners.
	 */
	eventNames(): Array<EventEmitter.EventNames<AtemEvents>> {
		return this.#events.eventNames()
	}

	/**
	 * Return the listeners registered for a given event.
	 */
	listeners<T extends EventEmitter.EventNames<AtemEvents>>(
		event: T
	): Array<EventEmitter.EventListener<AtemEvents, T>> {
		return this.#events.listeners(event)
	}

	/**
	 * Return the number of listeners listening to a given event.
	 */
	listenerCount(event: EventEmitter.EventNames<AtemEvents>): number {
		return this.#events.listenerCount(event)
	}

	/**
	 * Calls each of the listeners registered for a given event.
	 */
	emit<T extends EventEmitter.EventNames<AtemEvents>>(
		event: T,
		...args: EventEmitter.EventArgs<AtemEvents, T>
	): boolean {
		return this.#events.emit(event, ...args)
	}

	/**
	 * Add a listener for a given event.
	 */
	on<T extends EventEmitter.EventNames<AtemEvents>>(
		event: T,
		fn: EventEmitter.EventListener<AtemEvents, T>,
		// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
		context?: any
	): this {
		this.#events.on(event, fn, context)
		return this
	}
	addListener<T extends EventEmitter.EventNames<AtemEvents>>(
		event: T,
		fn: EventEmitter.EventListener<AtemEvents, T>,
		// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
		context?: any
	): this {
		this.#events.on(event, fn, context)
		return this
	}

	/**
	 * Add a one-time listener for a given event.
	 */
	once<T extends EventEmitter.EventNames<AtemEvents>>(
		event: T,
		fn: EventEmitter.EventListener<AtemEvents, T>,
		// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
		context?: any
	): this {
		this.#events.once(event, fn, context)
		return this
	}

	/**
	 * Remove the listeners of a given event.
	 */
	removeListener<T extends EventEmitter.EventNames<AtemEvents>>(
		event: T,
		fn?: EventEmitter.EventListener<AtemEvents, T>,
		// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
		context?: any,
		once?: boolean
	): this {
		this.#events.removeListener(event, fn, context, once)
		return this
	}
	off<T extends EventEmitter.EventNames<AtemEvents>>(
		event: T,
		fn?: EventEmitter.EventListener<AtemEvents, T>,
		// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
		context?: any,
		once?: boolean
	): this {
		this.#events.off(event, fn, context, once)
		return this
	}

	/**
	 * Remove all listeners, or those of the specified event.
	 */
	removeAllListeners(event?: EventEmitter.EventNames<AtemEvents>): this {
		this.#events.removeAllListeners(event)
		return this
	}

	/** @end EventEmitter */
}
