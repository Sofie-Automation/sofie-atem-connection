import EventEmitter from 'node:events'
import path from 'node:path'

import exitHook from 'exit-hook'
import threadedClassPkg, { ThreadedClassManager } from 'threadedclass'
import type { ThreadedClass } from 'threadedclass'

import { DEFAULT_PORT } from '../atem.js'
import { IDeserializedCommand, ISerializableCommand, VersionCommand } from '../commands/index.js'
import { CommandParser } from './atemCommandParser.js'
import { isRunningInTests } from './atemUtil.js'
import { PacketBuilder } from './packetBuilder.js'
import type { AtemSocketChild, OutboundPacketInfo } from './atemSocketChild.js'

export interface AtemSocketOptions {
	address: string
	port: number
	debugBuffers: boolean
	maxReconnectDelay?: number
	disableMultithreaded: boolean
	childProcessTimeout: number
	maxPacketSize: number
	disableExitHandlers?: boolean
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
	private readonly _disableMultithreaded: boolean
	private readonly _childProcessTimeout: number
	private readonly _maxPacketSize: number
	private readonly _disableExitHandlers: boolean
	private readonly _commandParser: CommandParser = new CommandParser()

	private _nextPacketTrackingId = 0
	private _isDisconnecting = false
	private _address: string
	private _port: number = DEFAULT_PORT
	private _socketProcess: ThreadedClass<AtemSocketChild> | undefined
	private _creatingSocket: Promise<void> | undefined
	private _exitUnsubscribe?: () => void

	constructor(options: AtemSocketOptions) {
		super()
		this._address = options.address
		this._port = options.port
		this._debugBuffers = options.debugBuffers
		this._maxReconnectDelay = options.maxReconnectDelay
		this._disableMultithreaded = options.disableMultithreaded
		this._childProcessTimeout = options.childProcessTimeout
		this._maxPacketSize = options.maxPacketSize
		this._disableExitHandlers = options.disableExitHandlers ?? false
	}

	public async connect(address?: string, port?: number): Promise<void> {
		this._isDisconnecting = false

		if (address) {
			this._address = address
		}
		if (port) {
			this._port = port
		}

		if (!this._socketProcess) {
			// cache the creation promise, in case `destroy` is called before it completes
			this._creatingSocket = this._createSocketProcess()
			await this._creatingSocket

			if (this._isDisconnecting || !this._socketProcess) {
				throw new Error('Disconnecting')
			}
		}

		await this._socketProcess.connect(this._address, this._port)
	}

	public async destroy(): Promise<void> {
		await this.disconnect()

		// Ensure thread creation has finished if it was started
		if (this._creatingSocket) await this._creatingSocket.catch(() => null)

		if (this._socketProcess) {
			await ThreadedClassManager.destroy(this._socketProcess)
			this._socketProcess = undefined
		}
		if (this._exitUnsubscribe) {
			this._exitUnsubscribe()
			this._exitUnsubscribe = undefined
		}
	}

	public async disconnect(): Promise<void> {
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
			await this._socketProcess.sendPackets(packets)
		}

		return packets.map((packet) => packet.trackingId)
	}

	private async _createSocketProcess(): Promise<void> {
		this._socketProcess = await threadedClassPkg.threadedClass<AtemSocketChild, typeof AtemSocketChild>(
			// threadedclass can't resolve relative paths from an ESM caller, so give it an absolute path
			path.join(
				import.meta.dirname,
				isRunningInTests() ? '__tests__/atemSocketChildFake.js' : 'atemSocketChild.js'
			),
			'AtemSocketChild',
			[
				{
					address: this._address,
					port: this._port,
					debugBuffers: this._debugBuffers,
					maxReconnectDelay: this._maxReconnectDelay,
				},
				async (): Promise<void> => {
					this.emit('disconnect')
				}, // onDisconnect
				async (message: string): Promise<void> => {
					this.emit('info', message)
				}, // onLog
				async (payload: Uint8Array): Promise<void> => {
					// Arrives as a Uint8Array from the worker thread. It is already a copy, so wrap it rather than copying again
					this._parseCommands(Buffer.from(payload.buffer, payload.byteOffset, payload.byteLength))
				}, // onCommandsReceived
				async (ids: Array<{ packetId: number; trackingId: number }>): Promise<void> => {
					this.emit(
						'ackPackets',
						ids.map((id) => id.trackingId)
					)
				}, // onPacketsAcknowledged
			],
			{
				instanceName: 'atem-connection',
				freezeLimit: this._childProcessTimeout,
				autoRestart: true,
				disableMultithreading: this._disableMultithreaded,
				importWorkerFile: true,
			}
		)

		ThreadedClassManager.onEvent(this._socketProcess, 'restarted', () => {
			this.connect().catch((error) => {
				const errorMsg = `Failed to reconnect after respawning socket process: ${error}`
				this.emit('error', errorMsg)
			})
		})
		ThreadedClassManager.onEvent(this._socketProcess, 'thread_closed', () => {
			this.emit('disconnect')
		})

		if (!this._disableExitHandlers) {
			this._exitUnsubscribe = exitHook(() => {
				this.destroy().catch(() => null)
			})
		}
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
