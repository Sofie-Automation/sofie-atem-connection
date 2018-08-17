import { createSocket, Socket } from 'dgram'
import { EventEmitter } from 'events'
import { format } from 'util'
import { Util } from './atemUtil'
import { ConnectionState, IPCMessageType, PacketFlag } from '../enums'

export class AtemSocketChild extends EventEmitter {
	private _connectionState = ConnectionState.Closed
	private _debug = false
	private _reconnectTimer: NodeJS.Timer | undefined
	private _retransmitTimer: NodeJS.Timer | undefined

	private _localPacketId = 1
	private _maxPacketID = (1 << 15) - 1 // Atem expects 15 not 16 bits before wrapping
	private _sessionId: number

	private _address: string
	private _port: number = 9910
	private _socket: Socket
	private _reconnectInterval = 5000

	private _inFlightTimeout = 200
	private _maxRetries = 5
	private _lastReceivedAt: number = Date.now()
	private _inFlight: Array<{packetId: number, trackingId: number, lastSent: number, packet: Buffer, resent: number}> = []
	private _parentProcess = process

	constructor (options: { address?: string, port?: number } = {}) {
		super()
		this._address = options.address || this._address
		this._port = options.port || this._port

		this._createSocket()
	}

	public connect (address?: string, port?: number) {
		if (!this._reconnectTimer) {
			this._reconnectTimer = setInterval(() => {
				if (this._lastReceivedAt + this._reconnectInterval > Date.now()) return
				if (this._connectionState === ConnectionState.Established) {
					this._connectionState = ConnectionState.Closed
					this.emit('disconnect', null, null)
				}
				this._localPacketId = 1
				this._sessionId = 0
				this.log('reconnect')
				if (this._address && this._port) {
					this._sendPacket(Util.COMMAND_CONNECT_HELLO)
					this._connectionState = ConnectionState.SynSent
				}
			}, this._reconnectInterval)
		}
		if (!this._retransmitTimer) {
			this._retransmitTimer = setInterval(() => this._checkForRetransmit(), 50)
		}

		if (address) {
			this._address = address
		}
		if (port) {
			this._port = port
		}

		this._sendPacket(Util.COMMAND_CONNECT_HELLO)
		this._connectionState = ConnectionState.SynSent
	}

	public disconnect () {
		return new Promise((resolve) => {
			if (this._connectionState === ConnectionState.Established) {
				this._socket.close(() => {
					clearInterval(this._retransmitTimer as NodeJS.Timer)
					clearInterval(this._reconnectTimer as NodeJS.Timer)
					this._retransmitTimer = undefined
					this._reconnectTimer = undefined

					this._connectionState = ConnectionState.Closed
					this._createSocket()
					this.emit('disconnect')

					resolve()
				})
			} else {
				resolve()
			}
		})
	}

	public log (...args: any[]): void {
		const payload = format.apply(format, args)
		this._sendParentMessage({
			cmd: IPCMessageType.Log,
			payload
		}).catch(() => { /* Discard errors. */ })
	}

	get nextPacketId (): number {
		return this._localPacketId
	}

	public _sendCommand (serializedCommand: Buffer, trackingId: number) {
		const payload = serializedCommand
		if (this._debug) this.log('PAYLOAD', payload)
		const buffer = new Buffer(16 + payload.length)
		buffer.fill(0)

		buffer[0] = (16 + payload.length) / 256 | 0x08
		buffer[1] = (16 + payload.length) % 256
		buffer[2] = this._sessionId >> 8
		buffer[3] = this._sessionId & 0xff
		buffer[10] = this._localPacketId / 256
		buffer[11] = this._localPacketId % 256
		buffer[12] = (4 + payload.length) / 256
		buffer[13] = (4 + payload.length) % 256

		payload.copy(buffer, 16)
		this._sendPacket(buffer)

		this._inFlight.push({
			packetId: this._localPacketId,
			trackingId,
			lastSent: Date.now(),
			packet: buffer,
			resent: 0 })
		this._localPacketId++
		if (this._maxPacketID < this._localPacketId) this._localPacketId = 0
	}

	private _createSocket () {
		this._socket = createSocket('udp4')
		this._socket.bind(1024 + Math.floor(Math.random() * 64511))
		this._socket.on('message', (packet, rinfo) => this._receivePacket(packet, rinfo))
	}

	private _receivePacket (packet: Buffer, rinfo: any) {
		if (this._debug) this.log('RECV ', packet)
		this._lastReceivedAt = Date.now()
		const length = ((packet[0] & 0x07) << 8) | packet[1]
		if (length !== rinfo.size) return

		const flags = packet[0] >> 3
		// this._sessionId = [packet[2], packet[3]]
		this._sessionId = packet[2] << 8 | packet[3]
		const remotePacketId = packet[10] << 8 | packet[11]

		// Send hello answer packet when receive connect flags
		if (flags & PacketFlag.Connect && !(flags & PacketFlag.Repeat)) {
			this._sendPacket(Util.COMMAND_CONNECT_HELLO_ANSWER)
		}

		// Parse commands, Emit 'stateChanged' event after parse
		if (flags & PacketFlag.AckRequest && length > 12) {
			this._sendParentMessage({
				cmd: IPCMessageType.InboundCommand,
				payload: {
					packet: packet.slice(12),
					remotePacketId
				}
			}).catch(() => { /* Discard errors. */ })
		}

		// Send ping packet, Emit 'connect' event after receive all stats
		if (flags & PacketFlag.AckRequest && length === 12 && this._connectionState === ConnectionState.SynSent) {
			this._connectionState = ConnectionState.Established
		}

		// Send ack packet (called by answer packet in Skaarhoj)
		if (flags & PacketFlag.AckRequest && this._connectionState === ConnectionState.Established) {
			this._sendAck(remotePacketId)
			this.emit('ping')
		}

		// Device ack'ed our command
		if (flags & PacketFlag.AckReply && this._connectionState === ConnectionState.Established) {
			const ackPacketId = packet[4] << 8 | packet[5]
			for (const i in this._inFlight) {
				if (ackPacketId >= this._inFlight[i].packetId) {
					this._sendParentMessage({
						cmd: IPCMessageType.CommandAcknowledged,
						payload: {
							commandId: this._inFlight[i].packetId,
							trackingId: this._inFlight[i].trackingId
						}
					}).catch(() => { /* Discard errors. */ })
					delete this._inFlight[i]
				}
			}
		}
	}

	private _sendPacket (packet: Buffer) {
		if (this._debug) this.log('SEND ', packet)
		this._socket.send(packet, 0, packet.length, this._port, this._address)
	}

	private _sendAck (packetId: number) {
		const buffer = new Buffer(12)
		buffer.fill(0)
		buffer[0] = 0x80
		buffer[1] = 0x0C
		buffer[2] = this._sessionId >> 8
		buffer[3] = this._sessionId & 0xFF
		buffer[4] = packetId >> 8
		buffer[5] = packetId & 0xFF
		buffer[9] = 0x41
		this._sendPacket(buffer)
	}

	private _checkForRetransmit () {
		for (const sentPacket of this._inFlight) {
			if (sentPacket && sentPacket.lastSent + this._inFlightTimeout < Date.now()) {
				if (sentPacket.resent <= this._maxRetries) {
					sentPacket.lastSent = Date.now()
					sentPacket.resent++
					this.log('RESEND: ', sentPacket)
					this._sendPacket(sentPacket.packet)
				} else {
					this._inFlight.splice(this._inFlight.indexOf(sentPacket), 1)
					this.log('TIMED OUT: ', sentPacket.packet)
					// @todo: we should probably break up the connection here.
				}
			}
		}
	}

	private _sendParentMessage (message: {cmd: IPCMessageType; payload?: any}) {
		if (!this._parentProcess) {
			throw new Error('Parent process process does not exist')
		}

		return Util.sendIPCMessage(this, '_parentProcess', message)
	}
}

const singleton = new AtemSocketChild()
process.on('message', message => {
	if (typeof message !== 'object') {
		return
	}

	if (typeof message.cmd !== 'string' || message.cmd.length <= 0) {
		return
	}

	const payload = message.payload
	switch (message.cmd) {
		case IPCMessageType.Connect:
			singleton.connect(payload.address, payload.port)
			break
		case IPCMessageType.Disconnect:
			singleton.disconnect().catch(() => { /* discard error */ })
			break
		case IPCMessageType.OutboundCommand:
			singleton._sendCommand(Buffer.from(payload.data.data), payload.trackingId)
			break
	}
})
