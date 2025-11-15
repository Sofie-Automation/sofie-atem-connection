import { EventEmitter } from 'eventemitter3'
import { CommandParser } from './atemCommandParser'
import exitHook = require('exit-hook')
import { VersionCommand, ISerializableCommand, IDeserializedCommand } from '../commands'
import { DEFAULT_PORT } from '../atem'
import type { OutboundPacketInfo } from './atemSocketChild'
import { PacketBuilder } from './packetBuilder'
import * as Comlink from 'comlink'
import { SocketWorkerApi } from './atemSocketChildWrapper'
import { Worker } from 'worker_threads'
import nodeEndpoint from 'comlink/dist/umd/node-adapter'

export interface AtemSocketOptions {
	address?: string
	port?: number
	disableMultithreaded: boolean
	debugBuffers: boolean
	maxPacketSize: number
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
	private readonly _maxPacketSize: number
	private readonly _commandParser: CommandParser = new CommandParser()

	private _nextPacketTrackingId = 0
	private _isDisconnecting = false
	private _address: string | undefined
	private _port: number | undefined
	private _socketWorker: Worker | undefined
	private _socketProcess: Comlink.Remote<SocketWorkerApi> | SocketWorkerApi | undefined
	private _disableMultithreaded: boolean
	private _creatingSocket: Promise<void> | undefined
	private _exitUnsubscribe?: () => void
	private _targetState: 'connected' | 'disconnected' = 'disconnected'

	constructor(options: AtemSocketOptions) {
		super()
		this._address = options.address
		this._port = options.port
		this._disableMultithreaded = options.disableMultithreaded
		this._debugBuffers = options.debugBuffers
		this._maxPacketSize = options.maxPacketSize
	}

	public async connect(address?: string, port?: number): Promise<void> {
		this._isDisconnecting = false

		if (address) this._address = address
		if (port) this._port = port

		if (!this._address) throw new Error('Address not set')

		if (!this._socketProcess) {
			// cache the creation promise, in case `destroy` is called before it completes
			this._creatingSocket = this._createSocketProcess()
			await this._creatingSocket

			if (this._isDisconnecting || !this._socketProcess) {
				throw new Error('Disconnecting')
			}
		}

		this._targetState = 'connected'
		await this._socketProcess.connect(this._address, this._port || DEFAULT_PORT)
	}

	public async destroy(): Promise<void> {
		await this.disconnect()

		// Ensure thread creation has finished if it was started
		if (this._creatingSocket) await this._creatingSocket.catch(() => null)

		if (this._socketProcess) {
			this._socketWorker?.terminate().catch(() => null)
			this._socketProcess = undefined
			this._socketWorker = undefined
		}

		if (this._exitUnsubscribe) {
			this._exitUnsubscribe()
			this._exitUnsubscribe = undefined
		}
	}

	public async disconnect(): Promise<void> {
		this._targetState = 'disconnected'
		this._isDisconnecting = true

		if (this._socketProcess) {
			await this._socketProcess.disconnect()
		}
	}

	get nextPacketTrackingId(): number {
		if (this._nextPacketTrackingId >= Number.MAX_SAFE_INTEGER) {
			this._nextPacketTrackingId = 0
		}
		return ++this._nextPacketTrackingId
	}

	public async sendCommands(commands: Array<ISerializableCommand>): Promise<number[]> {
		if (!this._socketProcess) throw new Error('Socket process is not open')

		const maxPacketSize = this._maxPacketSize - 12 // MTU minus ATEM header
		const packetBuilder = new PacketBuilder(maxPacketSize, this._commandParser.version)

		for (const cmd of commands) {
			packetBuilder.addCommand(cmd)
		}

		const packets: OutboundPacketInfo[] = packetBuilder.getPackets().map((buffer) => ({
			payloadLength: buffer.length,
			payloadHex: buffer.toString('hex'),
			trackingId: this.nextPacketTrackingId,
		}))
		if (this._debugBuffers) this.emit('debug', `PAYLOAD PACKETS ${JSON.stringify(packets)}`)

		if (packets.length > 0) {
			await this._socketProcess.sendPackets(packets)
		}

		return packets.map((packet) => packet.trackingId)
	}

	private async _createSocketProcess(): Promise<void> {
		if (this._disableMultithreaded) {
			this._socketProcess = new SocketWorkerApi()
		} else {
			const worker = new Worker(`${__dirname}/socket-worker.js`, { workerData: {} })
			worker.on('error', (e) => this.emit('error', e?.message || 'Worker error'))
			worker.on('exit', (_code) => {
				this._socketProcess = undefined
				this._socketWorker = undefined
				worker.terminate().catch(() => null)
				this.emit('disconnect')

				if (this._targetState === 'connected') {
					// Trigger a reconnect
					this.connect().catch((error) =>
						this.emit('error', `Failed to reconnect after socket process exit: ${error}`)
					)
				}
			})

			this._socketProcess = Comlink.wrap<SocketWorkerApi>(nodeEndpoint(worker))
			this._socketWorker = worker
		}

		await this._socketProcess.init(
			this._debugBuffers,
			Comlink.proxy(async (): Promise<void> => {
				this.emit('disconnect')
			}),
			Comlink.proxy(async (message: string): Promise<void> => {
				this.emit('info', message)
			}),
			Comlink.proxy(async (payload: Buffer): Promise<void> => {
				this._parseCommands(Buffer.from(payload))
			}),
			Comlink.proxy(async (ids: Array<{ packetId: number; trackingId: number }>): Promise<void> => {
				this.emit(
					'ackPackets',
					ids.map((id) => id.trackingId)
				)
			})
		)

		this._exitUnsubscribe = exitHook(() => {
			this.destroy().catch(() => null)
		})
	}

	private _parseCommands(buffer: Buffer): IDeserializedCommand[] {
		const parsedCommands: IDeserializedCommand[] = []

		while (buffer.length > 8) {
			const length = buffer.readUInt16BE(0)
			const name = buffer.toString('ascii', 4, 8)

			if (length < 8) {
				// Commands are never less than 8, as that is the header
				break
			}

			const cmdConstructor = this._commandParser.commandFromRawName(name)
			if (cmdConstructor && typeof cmdConstructor.deserialize === 'function') {
				try {
					const cmd: IDeserializedCommand = cmdConstructor.deserialize(
						buffer.slice(8, length),
						this._commandParser.version
					)

					if (cmd instanceof VersionCommand) {
						// init started
						this._commandParser.version = cmd.properties.version
					}

					parsedCommands.push(cmd)
				} catch (e) {
					this.emit('error', `Failed to deserialize command: ${cmdConstructor.constructor.name}: ${e}`)
				}
			} else {
				this.emit('debug', `Unknown command ${name} (${length}b)`)
			}

			// Trim the buffer
			buffer = buffer.slice(length)
		}

		if (parsedCommands.length > 0) {
			this.emit('receivedCommands', parsedCommands)
		}
		return parsedCommands
	}
}
