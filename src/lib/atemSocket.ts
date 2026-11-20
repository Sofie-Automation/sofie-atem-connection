import EventEmitter from 'node:events'

import { IpcWrapper, RespawnWorkerMonitor } from 'thread-tools'
import type { IpcEventHandlers } from 'thread-tools'

import { DEFAULT_PORT } from '../atem.js'
import { IDeserializedCommand, ISerializableCommand, VersionCommand } from '../commands/index.js'
import { CommandParser } from './atemCommandParser.js'
import { PacketBuilder } from './packetBuilder.js'
import type { OutboundPacketInfo } from './atemSocketChild.js'
import type { ChildToParentIpc, ParentToChildIpc } from './atemSocketIpc.js'

/**
 * Callbacks the bridge must call to notify the parent of child events.
 */
export type ChildBridgeCallbacks = {
	onDisconnect: () => void
	onLog: (message: string) => void
	onCommandsReceived: (payload: Uint8Array) => void
	onPacketsAcknowledged: (ids: Array<{ packetId: number; trackingId: number }>) => void
}

/**
 * Returned by a ChildBridgeFactory. Represents the outbound side of the bridge.
 */
export interface ChildBridgeHandle {
	connect(address: string, port: number): Promise<void>
	disconnect(): Promise<void>
	sendPackets(packets: OutboundPacketInfo[]): void
}

/**
 * Factory for creating an in-process child bridge instead of spawning a real worker.
 * Implement and pass as `createChildBridge` in AtemOptions to avoid a real worker thread
 * (useful for testing or embedding).
 */
export type ChildBridgeFactory = (
	options: { address: string; port: number; debugBuffers: boolean; maxReconnectDelay?: number },
	callbacks: ChildBridgeCallbacks
) => ChildBridgeHandle

export interface AtemSocketOptions {
	address: string
	port: number
	debugBuffers: boolean
	maxReconnectDelay?: number
	maxPacketSize: number
	/**
	 * Path to the worker JS file. When not set, resolves relative to this file.
	 * Override this when the on-disk layout differs from the default.
	 */
	workerFilePath?: string | URL
	/**
	 * When provided, this factory is called instead of spawning a real worker thread.
	 * Useful for testing or embedding the socket child in-process.
	 */
	createChildBridge?: ChildBridgeFactory
}

export type AtemSocketEvents = {
	disconnect: []
	info: [string]
	debug: [string]
	error: [string]
	receivedCommands: [IDeserializedCommand[]]
	ackPackets: [number[]]
}

export class AtemSocket extends EventEmitter<AtemSocketEvents> {
	private readonly _debugBuffers: boolean
	private readonly _maxReconnectDelay: number | undefined
	private readonly _maxPacketSize: number
	private readonly _workerFilePath: string | URL | undefined
	private readonly _createChildBridgeFn: ChildBridgeFactory | undefined
	private readonly _commandParser: CommandParser = new CommandParser()

	private _nextPacketTrackingId = 0
	private _isDisconnecting = false
	private _address: string
	private _port: number = DEFAULT_PORT
	private _monitor: RespawnWorkerMonitor | undefined
	private _bridge: ChildBridgeHandle | undefined
	private _workerReady: Promise<void> | undefined
	private _creatingSocket: Promise<void> | undefined

	constructor(options: AtemSocketOptions) {
		super()
		this._address = options.address
		this._port = options.port
		this._debugBuffers = options.debugBuffers
		this._maxReconnectDelay = options.maxReconnectDelay
		this._maxPacketSize = options.maxPacketSize
		this._workerFilePath = options.workerFilePath
		this._createChildBridgeFn = options.createChildBridge
	}

	public async connect(address?: string, port?: number): Promise<void> {
		this._isDisconnecting = false

		if (address) {
			this._address = address
		}
		if (port) {
			this._port = port
		}

		if (!this._bridge) {
			// cache the creation promise, in case `destroy` is called before it completes
			this._creatingSocket = this._createSocketProcess()
			await this._creatingSocket

			if (this._isDisconnecting || !this._bridge) {
				throw new Error('Disconnecting')
			}
		}

		await this._bridge.connect(this._address, this._port)
	}

	public async destroy(): Promise<void> {
		await this.disconnect()

		// Ensure thread creation has finished if it was started
		if (this._creatingSocket) await this._creatingSocket.catch(() => null)

		const monitor = this._monitor
		if (monitor) {
			await new Promise<void>((resolve) => monitor.stop(resolve))
			this._monitor = undefined
		}
		this._bridge = undefined
		this._workerReady = undefined
	}

	public async disconnect(): Promise<void> {
		this._isDisconnecting = true

		if (this._bridge) {
			await this._bridge.disconnect()
		}
	}

	get nextPacketTrackingId(): number {
		if (this._nextPacketTrackingId >= Number.MAX_SAFE_INTEGER) {
			this._nextPacketTrackingId = 0
		}
		return ++this._nextPacketTrackingId
	}

	public async sendCommands(commands: Array<ISerializableCommand>): Promise<number[]> {
		if (!this._bridge) throw new Error('Socket process is not open')

		const maxPacketSize = this._maxPacketSize - 12 // MTU minus ATEM header
		const packetBuilder = new PacketBuilder(maxPacketSize, this._commandParser.version)

		for (const cmd of commands) {
			packetBuilder.addCommand(cmd)
		}

		const packets: OutboundPacketInfo[] = packetBuilder.getPackets().map((buffer) => ({
			payload: buffer,
			trackingId: this.nextPacketTrackingId,
		}))
		if (this._debugBuffers) {
			const described = packets.map((packet) => ({
				...packet,
				payload: Buffer.from(packet.payload).toString('hex'),
			}))
			this.emit('debug', `PAYLOAD PACKETS ${JSON.stringify(described)}`)
		}

		if (packets.length > 0) {
			this._bridge.sendPackets(packets)
		}

		return packets.map((packet) => packet.trackingId)
	}

	private async _createSocketProcess(): Promise<void> {
		if (this._createChildBridgeFn) {
			// In-process bridge: wire two IpcWrappers directly together without spawning a worker.
			this._setupInProcessBridge(this._createChildBridgeFn)
			return
		}

		const workerUrl: string | URL = this._workerFilePath ?? new URL('./atemSocketChildWorker.js', import.meta.url)

		let firstSpawn = true

		const workerReadyPromise = Promise.withResolvers<void>()
		this._workerReady = workerReadyPromise.promise

		const childToParentHandlers: IpcEventHandlers<ChildToParentIpc> = {
			onDisconnect: async () => {
				this.emit('disconnect')
			},
			onLog: async ({ message }) => {
				this.emit('info', message)
			},
			onCommandsReceived: async ({ payload }) => {
				// Arrives as a Uint8Array from the worker thread. It is already a copy, so wrap it rather than copying again
				this._parseCommands(Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength))
			},
			onPacketsAcknowledged: async ({ ids }) => {
				this.emit(
					'ackPackets',
					ids.map((id) => id.trackingId)
				)
			},
		}

		const monitor = new RespawnWorkerMonitor(workerUrl, {
			workerData: () => ({
				address: this._address,
				port: this._port,
				debugBuffers: this._debugBuffers,
				maxReconnectDelay: this._maxReconnectDelay,
			}),
			sleep: 1000,
		})

		const ipc = new IpcWrapper<ParentToChildIpc, ChildToParentIpc>(
			childToParentHandlers,
			(msg) => monitor.worker?.postMessage(msg),
			10000
		)

		monitor.on('message', (msg) => ipc.receivedMessage(msg))

		monitor.on('online', () => {
			workerReadyPromise.resolve()
		})

		monitor.on('spawn', () => {
			if (!firstSpawn) {
				this.connect().catch((error) => {
					const errorMsg = `Failed to reconnect after respawning socket process: ${error}`
					this.emit('error', errorMsg)
				})
			}
			firstSpawn = false
		})

		monitor.on('crash', () => {
			this.emit('disconnect')
		})

		this._monitor = monitor
		this._bridge = {
			connect: async (address, port) => ipc.sendWithCb('connect', { address, port }),
			disconnect: async () => ipc.sendWithCb('disconnect', {}),
			sendPackets: (packets) => {
				ipc.sendWithNoCb('sendPackets', { packets })
			},
		}
		monitor.start()

		await this._workerReady
	}

	private _setupInProcessBridge(factory: ChildBridgeFactory): void {
		// Dummy monitor: an EventEmitter with a no-op stop(), so tests can emit 'spawn'/'crash'
		const dummyMonitor = new EventEmitter()
		;(dummyMonitor as EventEmitter & { stop: (cb?: () => void) => void }).stop = (cb?) => cb?.()

		// For in-process bridges, treat every 'spawn' as a reconnect (no real first-spawn to skip)
		dummyMonitor.on('spawn', () => {
			this.connect().catch((error) => {
				this.emit('error', `Failed to reconnect after respawning: ${error}`)
			})
		})
		dummyMonitor.on('crash', () => {
			this.emit('disconnect')
		})

		this._monitor = dummyMonitor as unknown as RespawnWorkerMonitor

		this._bridge = factory(
			{
				address: this._address,
				port: this._port,
				debugBuffers: this._debugBuffers,
				maxReconnectDelay: this._maxReconnectDelay,
			},
			{
				onDisconnect: () => this.emit('disconnect'),
				onLog: (message) => this.emit('info', message),
				onCommandsReceived: (payload) =>
					this._parseCommands(Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength)),
				onPacketsAcknowledged: (ids) =>
					this.emit(
						'ackPackets',
						ids.map((id) => id.trackingId)
					),
			}
		)

		this._workerReady = Promise.resolve()
	}

	private _parseCommands(buffer: Buffer): IDeserializedCommand[] {
		const parsedCommands: IDeserializedCommand[] = []

		while (buffer.length > 8) {
			const length = buffer.readUInt16BE(0)
			const name = buffer.toString('ascii', 4, 8)

			if (length < 8) {
				// Commands are never less than 8, as that is the header
				this.emit('debug', `Received command ${name} with invalid length ${length}`)
				break
			}
			if (length > buffer.length) {
				// The command claims to be longer than the data that is left, so the packet is malformed
				this.emit(
					'error',
					`Received command ${name} with length ${length}, but only ${buffer.length} bytes remain`
				)
				break
			}

			const cmdConstructor = this._commandParser.commandFromRawName(name)
			if (cmdConstructor && typeof cmdConstructor.deserialize === 'function') {
				try {
					const cmd: IDeserializedCommand = cmdConstructor.deserialize(
						buffer.subarray(8, length),
						this._commandParser.version
					)

					if (cmd instanceof VersionCommand) {
						// init started
						this._commandParser.version = cmd.properties.version
					}

					parsedCommands.push(cmd)
				} catch (e) {
					this.emit('error', `Failed to deserialize command: ${cmdConstructor.name}: ${e}`)
				}
			} else {
				this.emit('debug', `Unknown command ${name} (${length}b)`)
			}

			// Trim the buffer
			buffer = buffer.subarray(length)
		}

		if (parsedCommands.length > 0) {
			this.emit('receivedCommands', parsedCommands)
		}
		return parsedCommands
	}
}
