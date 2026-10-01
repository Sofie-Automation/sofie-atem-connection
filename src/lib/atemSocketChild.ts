/**
 * Note: this file wants as few imports as possible, as it gets loaded in a worker-thread and may require its own webpack bundle
 */
import { createSocket, Socket, RemoteInfo } from 'dgram'
import { performance } from 'perf_hooks'

const IN_FLIGHT_TIMEOUT = 60 // ms
const CONNECTION_TIMEOUT = 5000 // ms
const CONNECTION_RETRY_INTERVAL = 1000 // ms
const RETRANSMIT_INTERVAL = 10 // ms
const MAX_PACKET_RETRIES = 10
const MAX_PACKET_ID = 1 << 15 // Atem expects 15 not 16 bits before wrapping
const MAX_PACKET_PER_ACK = 16
/**
 * How far ahead of the expected packet id an inbound packet may be and still get buffered, which also bounds the
 * buffer size. The atem keeps resending unacked packets, so this only needs to cover its unacked window (observed
 * ~20-30 packets deep when one packet was lost at 50 packets/s). Packets are at most 2047 bytes, so this is <512KB.
 */
const MAX_OUT_OF_ORDER_PACKETS = 256

export const COMMAND_CONNECT_HELLO = Buffer.from([
	0x10, 0x14, 0x53, 0xab, 0x00, 0x00, 0x00, 0x00, 0x00, 0x3a, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00,
])

export enum ConnectionState {
	Closed = 0x00,
	SynSent = 0x01,
	Established = 0x02,
	/** Disconnected by the user (by calling `disconnect()`) */
	Disconnected = 0x03,
}

export enum PacketFlag {
	AckRequest = 0x01,
	NewSessionId = 0x02,
	IsRetransmit = 0x04,
	RetransmitRequest = 0x08,
	AckReply = 0x10,
}

interface InFlightPacket {
	readonly packetId: number
	readonly trackingId: number
	readonly payload: Buffer
	lastSent: number
	resent: number
}

export interface OutboundPacketInfo {
	payloadLength: number
	payloadHex: string
	trackingId: number
}

export class AtemSocketChild {
	private readonly _debugBuffers: boolean

	private _connectionState = ConnectionState.Closed
	private _reconnectTimer: NodeJS.Timer | undefined
	private _retransmitTimer: NodeJS.Timeout | undefined

	private _nextSendPacketId = 1
	private _sessionId = 0

	private _address: string
	private _port: number
	private _socket: Socket

	private _lastReceivedAt: number = performance.now()
	private _lastReceivedPacketId = 0
	/** Payloads of AckRequest packets that arrived ahead of sequence, keyed by packet id */
	private _outOfOrderPackets = new Map<number, Buffer>()
	/** When the inbound stream last made progress while there were packets waiting in `_outOfOrderPackets` */
	private _outOfOrderStalledSince: number | undefined
	private _inFlight: InFlightPacket[] = []
	private _ackTimer: NodeJS.Timeout | undefined
	private _receivedWithoutAck = 0

	private readonly onDisconnect: () => Promise<void>
	private readonly onLog: (message: string) => Promise<void>
	private readonly onCommandsReceived: (payload: Buffer, packetId: number) => Promise<void>
	private readonly onPacketsAcknowledged: (ids: Array<{ packetId: number; trackingId: number }>) => Promise<void>

	constructor(
		options: { address: string; port: number; debugBuffers: boolean },
		onDisconnect: () => Promise<void>,
		onLog: (message: string) => Promise<void>,
		onCommandReceived: (payload: Buffer, packetId: number) => Promise<void>,
		onCommandAcknowledged: (ids: Array<{ packetId: number; trackingId: number }>) => Promise<void>
	) {
		this._debugBuffers = options.debugBuffers
		this._address = options.address
		this._port = options.port

		this.onDisconnect = onDisconnect
		this.onLog = onLog
		this.onCommandsReceived = onCommandReceived
		this.onPacketsAcknowledged = onCommandAcknowledged

		this._socket = this._createSocket()
	}

	private startTimers(): void {
		if (!this._reconnectTimer) {
			this._reconnectTimer = setInterval(() => {
				const now = performance.now()
				const heardRecently = this._lastReceivedAt + CONNECTION_TIMEOUT > now
				const inboundStalled =
					this._outOfOrderStalledSince !== undefined &&
					this._outOfOrderStalledSince + CONNECTION_TIMEOUT <= now
				if (heardRecently && !inboundStalled) {
					// We heard from the atem recently, and the inbound stream is not stuck behind a lost packet
					return
				}

				if (inboundStalled) {
					this.log(`Inbound stalled waiting for packet ${(this._lastReceivedPacketId + 1) % MAX_PACKET_ID}`)
				}

				this.restartConnection().catch((e) => {
					this.log(`Reconnect failed: ${e}`)
				})
			}, CONNECTION_RETRY_INTERVAL)
		}
	}

	public async connect(address: string, port: number): Promise<void> {
		this._address = address
		this._port = port

		return this.restartConnection()
	}

	public async disconnect(): Promise<void> {
		this._clearTimers()

		return this._closeSocket().then(async () => {
			this._connectionState = ConnectionState.Disconnected
			this._clearOutOfOrderPackets()
			return this.onDisconnect()
		})
	}

	private _clearTimers() {
		if (this._retransmitTimer) {
			clearTimeout(this._retransmitTimer)
			this._retransmitTimer = undefined
		}
		if (this._reconnectTimer) {
			clearInterval(this._reconnectTimer)
			this._reconnectTimer = undefined
		}
	}

	private async restartConnection(): Promise<void> {
		this._clearTimers()

		// This includes a 'disconnect'
		if (this._connectionState === ConnectionState.Established) {
			this._connectionState = ConnectionState.Closed
			this._recreateSocket()
			await this.onDisconnect()
		} else if (this._connectionState === ConnectionState.Disconnected) {
			this._createSocket()
		}

		// Reset connection
		this._nextSendPacketId = 1
		this._sessionId = 0
		this._inFlight = []
		this._clearOutOfOrderPackets()
		this.log('reconnect')

		this.startTimers()

		// Try doing reconnect
		this._sendPacket(COMMAND_CONNECT_HELLO)
		this._connectionState = ConnectionState.SynSent
	}

	private log(message: string): void {
		// tslint:disable-next-line: no-floating-promises
		void this.onLog(message)
	}

	public sendPackets(packets: OutboundPacketInfo[]): void {
		for (const packet of packets) {
			this.sendPacket(packet.payloadLength, packet.payloadHex, packet.trackingId)
		}
	}

	private sendPacket(payloadLength: number, payloadHex: string, trackingId: number): void {
		const packetId = this._nextSendPacketId++
		if (this._nextSendPacketId >= MAX_PACKET_ID) this._nextSendPacketId = 0

		const opcode = PacketFlag.AckRequest << 11

		const buffer = Buffer.alloc(12 + payloadLength, 0)
		buffer.writeUInt16BE(opcode | (payloadLength + 12), 0) // Opcode & Length
		buffer.writeUInt16BE(this._sessionId, 2)
		buffer.writeUInt16BE(packetId, 10)

		buffer.write(payloadHex, 12, payloadLength, 'hex')
		this._sendPacket(buffer)

		this._inFlight.push({
			packetId,
			trackingId,
			lastSent: performance.now(),
			payload: buffer,
			resent: 0,
		})
		this._triggerRetransmitTimer()
	}

	private _recreateSocket(): Socket {
		this._closeSocket().catch((_err) => {
			// do nothing because it always resolves
		})
		return this._createSocket()
	}

	private async _closeSocket(): Promise<void> {
		if (this._ackTimer) {
			clearTimeout(this._ackTimer)
			delete this._ackTimer
		}

		return new Promise<void>((resolve) => {
			try {
				this._socket.close(() => resolve())
			} catch (err) {
				this.log(`Error closing socket: ${err}`)
				resolve()
			}
		})
	}

	private _createSocket(): Socket {
		this._socket = createSocket('udp4')
		this._socket.bind()
		this._socket.on('message', (packet, rinfo) => this._receivePacket(packet, rinfo))
		this._socket.on('error', (err) => {
			this.log(`Connection error: ${err}`)

			if (this._connectionState === ConnectionState.Established) {
				// If connection is open, then restart. Otherwise the reconnectTimer will handle it
				this.restartConnection().catch((e) => {
					this.log(`Failed to restartConnection: ${e?.message ?? e}`)
				})
			}
		})

		return this._socket
	}

	private _isPacketCoveredByAck(ackId: number, packetId: number): boolean {
		const tolerance = MAX_PACKET_ID / 2
		const pktIsShortlyBefore = packetId < ackId && packetId + tolerance > ackId
		const pktIsShortlyAfter = packetId > ackId && packetId < ackId + tolerance
		const pktIsBeforeWrap = packetId > ackId + tolerance
		return packetId === ackId || ((pktIsShortlyBefore || pktIsBeforeWrap) && !pktIsShortlyAfter)
	}

	private _receivePacket(packet: Buffer, rinfo: RemoteInfo): void {
		if (this._debugBuffers) this.log(`RECV ${packet.toString('hex')}`)
		this._lastReceivedAt = performance.now()
		const length = packet.readUInt16BE(0) & 0x07ff
		if (length !== rinfo.size) return

		const flags = packet.readUInt8(0) >> 3
		this._sessionId = packet.readUInt16BE(2)
		const remotePacketId = packet.readUInt16BE(10)

		// Send hello answer packet when receive connect flags
		if (flags & PacketFlag.NewSessionId) {
			this._connectionState = ConnectionState.Established
			this._lastReceivedPacketId = remotePacketId
			this._clearOutOfOrderPackets()
			this._sendAck(remotePacketId)
			return
		}

		const ps: Array<Promise<void>> = []

		if (this._connectionState === ConnectionState.Established) {
			// Device asked for retransmit
			if (flags & PacketFlag.RetransmitRequest) {
				const fromPacketId = packet.readUInt16BE(6)
				this.log(`Retransmit request: ${fromPacketId}`)

				ps.push(this._retransmitFrom(fromPacketId))
			}

			// Got a packet that needs an ack. Ids are only 15 bits, anything larger is malformed and could never be drained
			if (flags & PacketFlag.AckRequest && remotePacketId < MAX_PACKET_ID) {
				const distance = (remotePacketId - this._lastReceivedPacketId + MAX_PACKET_ID) % MAX_PACKET_ID
				// Check if it next in the sequence
				if (distance === 1) {
					this._lastReceivedPacketId = remotePacketId

					// It might have commands
					if (length > 12) {
						ps.push(this.onCommandsReceived(packet.subarray(12), remotePacketId))
					}

					// Deliver any buffered packets which are now in sequence
					let drained = 0
					let nextPacketId = (this._lastReceivedPacketId + 1) % MAX_PACKET_ID
					let nextPayload = this._outOfOrderPackets.get(nextPacketId)
					while (nextPayload) {
						this._outOfOrderPackets.delete(nextPacketId)
						this._lastReceivedPacketId = nextPacketId
						drained++

						if (nextPayload.length > 0) {
							ps.push(this.onCommandsReceived(nextPayload, nextPacketId))
						}

						nextPacketId = (nextPacketId + 1) % MAX_PACKET_ID
						nextPayload = this._outOfOrderPackets.get(nextPacketId)
					}

					// Progress was made, so restart the stall clock for any packets still waiting behind a new gap
					this._outOfOrderStalledSince = this._outOfOrderPackets.size > 0 ? performance.now() : undefined

					if (drained > 0) {
						// Ack immediately, so the atem stops retransmitting what we now have
						this._sendAckNow()
					} else {
						this._sendOrQueueAck()
					}
				} else if (distance > 1 && distance <= MAX_OUT_OF_ORDER_PACKETS) {
					// It is ahead of sequence, so hold onto it until the gap is filled
					if (!this._outOfOrderPackets.has(remotePacketId)) {
						if (this._outOfOrderPackets.size === 0) this._outOfOrderStalledSince = performance.now()
						this._outOfOrderPackets.set(remotePacketId, packet.subarray(12))
					}
				} else if (this._isPacketCoveredByAck(this._lastReceivedPacketId, remotePacketId)) {
					// We got a retransmit of something we have already acked, so reack it
					this._sendOrQueueAck()
				}
			}

			// Device ack'ed our packet
			if (flags & PacketFlag.AckReply) {
				const ackPacketId = packet.readUInt16BE(4)
				const ackedCommands: Array<{ packetId: number; trackingId: number }> = []
				this._inFlight = this._inFlight.filter((pkt) => {
					if (this._isPacketCoveredByAck(ackPacketId, pkt.packetId)) {
						ackedCommands.push({
							packetId: pkt.packetId,
							trackingId: pkt.trackingId,
						})
						return false
					} else {
						// Not acked yet
						return true
					}
				})

				this._triggerRetransmitTimer()
				ps.push(this.onPacketsAcknowledged(ackedCommands))
				// this.log(`${Date.now()} Got ack ${ackPacketId} Remaining=${this._inFlight.length}`)
			}
		}

		Promise.all(ps).catch((e) => {
			this.log(`Failed to receivePacket: ${e?.message ?? e}`)
		})
	}

	private _sendPacket(packet: Buffer): void {
		if (this._debugBuffers) this.log(`SEND ${packet.toString('hex')}`)
		this._socket.send(packet, 0, packet.length, this._port, this._address)
	}

	private _clearOutOfOrderPackets(): void {
		this._outOfOrderPackets.clear()
		this._outOfOrderStalledSince = undefined
	}

	private _sendOrQueueAck(): void {
		this._receivedWithoutAck++
		if (this._receivedWithoutAck >= MAX_PACKET_PER_ACK) {
			this._sendAckNow()
		} else if (!this._ackTimer) {
			this._ackTimer = setTimeout(() => {
				delete this._ackTimer
				this._receivedWithoutAck = 0
				this._sendAck(this._lastReceivedPacketId)
			}, 5)
		}
	}

	private _sendAckNow(): void {
		this._receivedWithoutAck = 0

		if (this._ackTimer) {
			clearTimeout(this._ackTimer)
			delete this._ackTimer
		}

		this._sendAck(this._lastReceivedPacketId)
	}

	private _sendAck(packetId: number): void {
		const opcode = PacketFlag.AckReply << 11
		const length = 12
		const buffer = Buffer.alloc(length, 0)
		buffer.writeUInt16BE(opcode | length, 0)
		buffer.writeUInt16BE(this._sessionId, 2)
		buffer.writeUInt16BE(packetId, 4)
		this._sendPacket(buffer)
	}

	private async _retransmitFrom(fromId: number): Promise<void> {
		// this.log(`Resending from ${fromId} to ${this._inFlight.length > 0 ? this._inFlight[this._inFlight.length - 1].packetId : '-'}`)

		// The atem will ask for MAX_PACKET_ID to be retransmitted when it really wants 0
		fromId = fromId % MAX_PACKET_ID

		const fromIndex = this._inFlight.findIndex((pkt) => pkt.packetId === fromId)
		if (fromIndex === -1) {
			// fromId is not inflight, so we cannot resend. only fix is to abort
			this.log(`Unable to resend: ${fromId}`)
			await this.restartConnection()
		} else {
			this.log(`Resending from ${fromId} to ${this._inFlight[this._inFlight.length - 1].packetId}`)
			// Resend from the requested
			const now = performance.now()
			for (let i = fromIndex; i < this._inFlight.length; i++) {
				const sentPacket = this._inFlight[i]
				if (sentPacket.packetId === fromId || !this._isPacketCoveredByAck(fromId, sentPacket.packetId)) {
					sentPacket.lastSent = now
					sentPacket.resent++

					// this.log(`${Date.now()} Resending ${sentPacket.packetId} Last=${this._nextSendPacketId - 1}`)
					this._sendPacket(sentPacket.payload)
				}
			}
		}
	}

	private _triggerRetransmitTimer(): void {
		if (!this._inFlight.length) {
			if (this._retransmitTimer) {
				clearTimeout(this._retransmitTimer)
				delete this._retransmitTimer
			}
			return
		}

		if (!this._retransmitTimer) {
			this._retransmitTimer = setTimeout(() => {
				delete this._retransmitTimer
				this._checkForRetransmit().catch((e) => {
					this.log(`Failed to retransmit: ${e?.message ?? e}`)
				})
			}, RETRANSMIT_INTERVAL)
		}
	}

	private async _checkForRetransmit(): Promise<void> {
		if (!this._inFlight.length) return

		this._triggerRetransmitTimer()

		const now = performance.now()
		for (const sentPacket of this._inFlight) {
			if (sentPacket.lastSent + IN_FLIGHT_TIMEOUT < now) {
				if (
					sentPacket.resent <= MAX_PACKET_RETRIES &&
					this._isPacketCoveredByAck(this._nextSendPacketId, sentPacket.packetId)
				) {
					this.log(`Retransmit from timeout: ${sentPacket.packetId}`)
					// Retransmit the packet and anything after it
					return this._retransmitFrom(sentPacket.packetId)
				} else {
					// A packet has timed out, so we need to reset to avoid getting stuck
					this.log(`Packet timed out: ${sentPacket.packetId}`)
					return this.restartConnection()
				}
			}
		}

		return Promise.resolve()
	}
}
