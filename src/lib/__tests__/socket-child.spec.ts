import { describe, test, expect, vi, beforeEach, beforeAll, afterEach, afterAll } from 'vitest'
// eslint-disable-next-line vitest/no-mocks-import
import { Socket } from '../__mocks__/dgram.js'
import { AtemSocketChild, COMMAND_CONNECT_HELLO, ConnectionState, PacketFlag } from '../atemSocketChild.js'
import { DEFAULT_PORT } from '../../atem.js'
import { performance } from 'perf_hooks'

vi.mock('dgram', async () => await import('../__mocks__/dgram.js'))

const ADDRESS = '127.0.0.1'

function getSocket(child: AtemSocketChild): Socket {
	const socket = (child as any)._socket as Socket
	expect(socket).toBeTruthy()
	expect(socket.isOpen).toBeTruthy()
	socket.expectedAddress = ADDRESS
	socket.expectedPort = DEFAULT_PORT

	return socket
}
function getState(child: AtemSocketChild): ConnectionState {
	return (child as any)._connectionState as ConnectionState
}
function getInflightIds(child: AtemSocketChild): number[] {
	return (child as any)._inFlight.map((p: any) => p.packetId)
}
function fakeConnect(child: AtemSocketChild): void {
	const child2 = child as any
	child2._connectionState = ConnectionState.Established
	child2._address = '127.0.0.1'
	child2.startTimers()
}

function createSocketChild(
	onCommandsReceived?: (payload: Buffer, packetId: number) => Promise<void>,
	onPacketsAcknowledged?: (ids: Array<{ packetId: number; trackingId: number }>) => Promise<void>,
	onDisconnect?: () => Promise<void>
): AtemSocketChild {
	return new AtemSocketChild(
		{
			address: ADDRESS,
			port: DEFAULT_PORT,
			debugBuffers: false,
		},
		onDisconnect || (async (): Promise<void> => Promise.resolve()),
		// async msg => { console.log(msg) },
		async (): Promise<void> => Promise.resolve(),
		onCommandsReceived || (async (): Promise<void> => Promise.resolve()),
		onPacketsAcknowledged || (async (): Promise<void> => Promise.resolve())
	)
}

describe('SocketChild', () => {
	beforeEach(() => {
		vi.useFakeTimers()
	})
	beforeAll(() => {
		const startup = Date.now()
		vi.spyOn(performance, 'now').mockImplementation(() => Date.now() - startup)
	})
	afterEach(() => {
		vi.useRealTimers()
	})
	afterAll(() => {
		vi.restoreAllMocks()
	})

	test('Establish connection', async () => {
		const child = createSocketChild()
		try {
			const socket = getSocket(child)

			let receivedPacket = false
			socket.sendImpl = (msg: Buffer): void => {
				// Shouldnt only get one send
				expect(receivedPacket).toBeFalsy()
				receivedPacket = true
				expect(msg).toEqual(COMMAND_CONNECT_HELLO)
			}

			expect(getState(child)).toEqual(ConnectionState.Closed)
			await child.connect(ADDRESS, DEFAULT_PORT)

			// Ensure everything has ticked through
			await vi.advanceTimersByTimeAsync(20)

			// Confirm something was sent
			expect(receivedPacket).toBeTruthy()
			expect(getState(child)).toEqual(ConnectionState.SynSent)

			receivedPacket = false
			socket.sendImpl = (msg: Buffer): void => {
				// Shouldnt only get one send
				expect(receivedPacket).toBeFalsy()
				receivedPacket = true
				expect(msg).toEqual(
					Buffer.from([0x80, 0x0c, 0x53, 0x1b, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00])
				)
			}

			// Now get the connection established
			await socket.emitMessage(
				Buffer.from([
					0x10,
					0x14, // Length & Type
					0x53,
					0x1b, // Session Id
					0x00,
					0x00, // Not acking
					0x00,
					0x00, // Not asking for retransmit
					0x00,
					0xd1, // 'Client pkt id' Not sure why this
					0x00,
					0x00, // Packet Id
					0x02,
					0x00,
					0x00,
					0x00,
					0x00,
					0x00,
					0x00,
					0x00, // Unknown Payload
				])
			)

			// Ensure everything has ticked through
			await vi.advanceTimersByTimeAsync(20)

			// Confirm something was sent
			expect(receivedPacket).toBeTruthy()
			expect(getState(child)).toEqual(ConnectionState.Established)
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})

	function genAckRequestMessage(pktId: number, extraLength?: number): Buffer {
		const buffer = Buffer.from([
			0x08,
			0x0c + (extraLength || 0), // Length & Type
			0x53,
			0x1b, // Session Id
			0x00,
			0x00, // Not acking
			0x00,
			0x00, // Not asking for retransmit
			0x00,
			0x00, // 'Client pkt id' Not needed
			0x00,
			0x00, // Packet Id
		])
		buffer.writeUInt16BE(pktId, 10) // Packet Id

		return buffer
	}

	test('Ack - delayed', async () => {
		const child = createSocketChild()
		try {
			fakeConnect(child)
			const socket = getSocket(child)

			const acked: number[] = []
			let gotUnknown = false
			socket.sendImpl = (msg: Buffer): void => {
				const opcode = msg.readUInt8(0) >> 3
				if (opcode & PacketFlag.AckReply) {
					acked.push(msg.readUInt16BE(4))
				} else {
					gotUnknown = true
					// Shouldnt get any other sends
					// expect(false).toBeTruthy()
				}
			}

			await socket.emitMessage(genAckRequestMessage(1))

			// Nothing should have been sent immediately
			expect(acked).toEqual([])
			expect(gotUnknown).toBe(false)

			// Still nothing sent
			await vi.advanceTimersByTimeAsync(4)
			expect(acked).toEqual([])
			expect(gotUnknown).toBe(false)

			// Should be an ack a little later
			await vi.advanceTimersByTimeAsync(10)
			expect(acked).toEqual([1])
			expect(gotUnknown).toBe(false)
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})

	test('Ack - bulk', async () => {
		const child = createSocketChild()
		try {
			fakeConnect(child)
			const socket = getSocket(child)

			let acked: number[] = []
			let gotUnknown = false
			socket.sendImpl = (msg: Buffer): void => {
				const opcode = msg.readUInt8(0) >> 3
				if (opcode & PacketFlag.AckReply) {
					acked.push(msg.readUInt16BE(4))
				} else {
					gotUnknown = true
					// Shouldnt get any other sends
					// expect(false).toBeTruthy()
				}
			}

			for (let i = 1; i <= 15; i++) {
				await socket.emitMessage(genAckRequestMessage(i))
			}

			// Nothing should have been sent yet
			await vi.advanceTimersByTimeAsync(4)
			expect(acked).toEqual([])
			expect(gotUnknown).toBe(false)

			// One more will trigger an ack
			await socket.emitMessage(genAckRequestMessage(16))
			expect(acked).toEqual([16])
			expect(gotUnknown).toBe(false)
			acked = []

			// Nothing more should be acked
			await vi.advanceTimersByTimeAsync(10)
			expect(acked).toEqual([])
			expect(gotUnknown).toBe(false)
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})

	test('Inbound commands', async () => {
		let gotCmds: number[] = []
		const child = createSocketChild(async (buf) => {
			gotCmds.push(buf.length)
			return Promise.resolve()
		})
		try {
			fakeConnect(child)
			const socket = getSocket(child)

			let gotUnknown = false
			socket.sendImpl = (_msg: Buffer): void => {
				gotUnknown = true
				// Shouldnt get any other sends
				expect(false).toBeTruthy()
			}

			gotCmds = []

			// Nothing
			await socket.emitMessage(genAckRequestMessage(1))
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBe(false)

			// Some payload
			const buffer = Buffer.concat([genAckRequestMessage(2, 1), Buffer.from([0])])
			await socket.emitMessage(buffer)
			expect(gotCmds).toEqual([1])
			expect(gotUnknown).toBe(false)
			gotCmds = []

			// Repeated should not re-emit
			await socket.emitMessage(buffer)
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBe(false)

			// Previous should not re-emit
			await socket.emitMessage(Buffer.concat([genAckRequestMessage(1, 1), Buffer.from([0])]))
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBe(false)

			// Another payload
			await socket.emitMessage(Buffer.concat([genAckRequestMessage(3, 1), Buffer.from([0])]))
			expect(gotCmds).toEqual([1])
			expect(gotUnknown).toBe(false)
			gotCmds = []
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})

	test('Inbound commands - around wrap', async () => {
		let gotCmds: number[] = []
		const child = createSocketChild(async (buf) => {
			gotCmds.push(buf.length)
			return Promise.resolve()
		})
		try {
			fakeConnect(child)
			const socket = getSocket(child)
			;(child as any)._lastReceivedPacketId = 32766 // 32767 is max

			let gotUnknown = false
			socket.sendImpl = (_msg: Buffer): void => {
				gotUnknown = true
				// Shouldnt get any other sends
				expect(false).toBeTruthy()
			}

			gotCmds = []

			// Nothing
			await socket.emitMessage(Buffer.concat([genAckRequestMessage(32766, 1), Buffer.from([0])]))
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBe(false)

			// Some payload
			const lastBuffer = Buffer.concat([genAckRequestMessage(32767, 1), Buffer.from([0])])
			await socket.emitMessage(lastBuffer)
			expect(gotCmds).toEqual([1])
			expect(gotUnknown).toBe(false)
			gotCmds = []

			// Should not re-emit
			await socket.emitMessage(lastBuffer)
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBe(false)
			gotCmds = []

			// Now it has wrapped
			const firstBuffer = Buffer.concat([genAckRequestMessage(0, 1), Buffer.from([0])])
			await socket.emitMessage(firstBuffer)
			expect(gotCmds).toEqual([1])
			expect(gotUnknown).toBe(false)
			gotCmds = []

			// Next buffer
			await socket.emitMessage(Buffer.concat([genAckRequestMessage(1, 1), Buffer.from([0])]))
			expect(gotCmds).toEqual([1])
			expect(gotUnknown).toBe(false)
			gotCmds = []

			// Should not re-emit
			await socket.emitMessage(firstBuffer)
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBe(false)
			gotCmds = []

			// Retransmit of lastBuffer is not uncommon, it should not re-emit
			await socket.emitMessage(lastBuffer)
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBe(false)
			gotCmds = []

			// Ensure that the first buffer still does not re-emit
			await socket.emitMessage(firstBuffer)
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBe(false)
			gotCmds = []
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})

	test('SendCommands', async () => {
		const child = createSocketChild()
		try {
			fakeConnect(child)
			const socket = getSocket(child)
			;(child as any)._nextSendPacketId = 123

			let received: Array<{ id: number; payload: Buffer }> = []
			socket.sendImpl = (msg: Buffer): void => {
				const opcode = msg.readUInt8(0) >> 3
				expect(opcode).toEqual(PacketFlag.AckRequest)

				received.push({
					id: msg.readUInt16BE(10),
					payload: msg.slice(12),
				})
			}

			// Send something
			const buf1 = Buffer.from([0, 1, 2])
			const cmdName = 'test'
			const buf1Expected = Buffer.alloc(11)
			buf1Expected.writeUInt16BE(buf1Expected.length, 0)
			buf1Expected.write(cmdName, 4, 4)
			Buffer.from(buf1).copy(buf1Expected, 8)

			child.sendPackets([
				{
					payloadLength: buf1Expected.length,
					payloadHex: buf1Expected.toString('hex'),
					trackingId: 1,
				},
			])
			expect(received).toEqual([
				{
					id: 123,
					payload: buf1Expected,
				},
			])
			received = []
			expect(getInflightIds(child)).toEqual([123])

			// Send another
			child.sendPackets([
				{
					payloadLength: buf1Expected.length,
					payloadHex: buf1Expected.toString('hex'),
					trackingId: 1,
				},
			])
			expect(received).toEqual([
				{
					id: 124,
					payload: buf1Expected,
				},
			])
			received = []
			expect(getInflightIds(child)).toEqual([123, 124])
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})

	function genAckCommandMessage(pktId: number): Buffer {
		const buffer = Buffer.from([
			0x80,
			0x0c, // Length & Type
			0x53,
			0x1b, // Session Id
			0x00,
			0x00, // Acking - set after
			0x00,
			0x00, // Not asking for retransmit
			0x00,
			0x00, // 'Client pkt id' Not needed
			0x00,
			0x00, // No Packet Id
		])
		buffer.writeUInt16BE(pktId, 4) // Acked Id

		return buffer
	}

	test('SendCommand - acks', async () => {
		let acked: Array<{ packetId: number; trackingId: number }> = []
		const child = createSocketChild(undefined, async (ids) => {
			acked.push(...ids)
		})
		try {
			fakeConnect(child)
			const socket = getSocket(child)
			;(child as any)._nextSendPacketId = 123

			let received: number[] = []
			socket.sendImpl = (msg: Buffer): void => {
				const opcode = msg.readUInt8(0) >> 3
				expect(opcode).toEqual(PacketFlag.AckRequest)

				received.push(msg.readUInt16BE(10))
			}

			acked = []

			// Send some stuff
			const buf1 = Buffer.from([0, 1, 2])
			child.sendPackets([
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 5 },
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 6 },
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 7 },
			])
			child.sendPackets([{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 8 }])
			child.sendPackets([
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 9 },
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 10 },
			])
			expect(received).toEqual([123, 124, 125, 126, 127, 128])
			received = []
			expect(getInflightIds(child)).toEqual([123, 124, 125, 126, 127, 128])
			expect(acked).toEqual([])

			// Ack a couple
			await socket.emitMessage(genAckCommandMessage(125))
			expect(getInflightIds(child)).toEqual([126, 127, 128])
			expect(acked).toEqual([
				{ packetId: 123, trackingId: 5 },
				{ packetId: 124, trackingId: 6 },
				{ packetId: 125, trackingId: 7 },
			])
			acked = []

			// Another ack
			await socket.emitMessage(genAckCommandMessage(126))
			expect(getInflightIds(child)).toEqual([127, 128])
			expect(acked).toEqual([{ packetId: 126, trackingId: 8 }])
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})

	test('SendCommand - acks wrap', async () => {
		let acked: Array<{ packetId: number; trackingId: number }> = []
		const child = createSocketChild(undefined, async (ids) => {
			acked.push(...ids)
		})
		try {
			fakeConnect(child)
			const socket = getSocket(child)
			;(child as any)._nextSendPacketId = 32764 // 32767 is max

			let received: number[] = []
			socket.sendImpl = (msg: Buffer): void => {
				const opcode = msg.readUInt8(0) >> 3
				expect(opcode).toEqual(PacketFlag.AckRequest)

				received.push(msg.readUInt16BE(10))
			}

			acked = []

			// Send some stuff
			const buf1 = Buffer.from([0, 1, 2])
			child.sendPackets([
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 5 }, // 32764
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 6 }, // 32765
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 7 }, // 32766
			])
			child.sendPackets([
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 8 }, // 32767
			])
			child.sendPackets([
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 9 }, // 0
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 10 }, // 1
			])
			expect(received).toEqual([32764, 32765, 32766, 32767, 0, 1])
			received = []
			expect(getInflightIds(child)).toEqual([32764, 32765, 32766, 32767, 0, 1])
			expect(acked).toEqual([])

			// Ack a couple
			await socket.emitMessage(genAckCommandMessage(32766))
			expect(getInflightIds(child)).toEqual([32767, 0, 1])
			expect(acked).toEqual([
				{ packetId: 32764, trackingId: 5 },
				{ packetId: 32765, trackingId: 6 },
				{ packetId: 32766, trackingId: 7 },
			])
			acked = []

			// Another ack
			await socket.emitMessage(genAckCommandMessage(0))
			expect(getInflightIds(child)).toEqual([1])
			expect(acked).toEqual([
				{ packetId: 32767, trackingId: 8 },
				{ packetId: 0, trackingId: 9 },
			])
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})

	test('SendCommand - retransmit timeouts', async () => {
		let acked: Array<{ packetId: number; trackingId: number }> = []
		const child = createSocketChild(undefined, async (ids) => {
			acked.push(...ids)
		})
		try {
			fakeConnect(child)
			const socket = getSocket(child)
			;(child as any)._nextSendPacketId = 32764 // 32767 is max

			let received: number[] = []
			socket.sendImpl = (msg: Buffer): void => {
				const opcode = msg.readUInt8(0) >> 3
				expect(opcode).toEqual(PacketFlag.AckRequest)

				received.push(msg.readUInt16BE(10))
			}

			acked = []

			// Send some stuff
			const buf1 = Buffer.from([0, 1, 2])
			child.sendPackets([
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 5 }, // 32764
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 6 }, // 32765
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 7 }, // 32766
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 8 }, // 32767
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 9 }, // 0
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 10 }, // 1
			])
			expect(received).toEqual([32764, 32765, 32766, 32767, 0, 1])
			received = []
			expect(getInflightIds(child)).toEqual([32764, 32765, 32766, 32767, 0, 1])
			expect(acked).toEqual([])

			// Ack a couple to ensure socket is running properly
			await socket.emitMessage(genAckCommandMessage(32765))
			expect(getInflightIds(child)).toEqual([32766, 32767, 0, 1])
			expect(acked).toEqual([
				{ packetId: 32764, trackingId: 5 },
				{ packetId: 32765, trackingId: 6 },
			])
			acked = []
			expect(received).toEqual([])
			received = []

			// Let the commands be resent
			await vi.advanceTimersByTimeAsync(80)
			expect(received).toEqual([32766, 32767, 0, 1])
			received = []

			// Should keep happening
			await vi.advanceTimersByTimeAsync(80)
			expect(received).toEqual([32766, 32767, 0, 1])
			received = []

			// Add another to the queue
			child.sendPackets([
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 11 }, // 2
			])
			expect(received).toEqual([2])
			received = []
			expect(getInflightIds(child)).toEqual([32766, 32767, 0, 1, 2])
			expect(acked).toEqual([])

			// And again, this time with the new thing
			await vi.advanceTimersByTimeAsync(80)
			expect(received).toEqual([32766, 32767, 0, 1, 2])
			received = []
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})

	function genRetransmitRequestCommandMessage(pktId: number): Buffer {
		const buffer = Buffer.from([
			0x40,
			0x0c, // Length & Type
			0x53,
			0x1b, // Session Id
			0x00,
			0x00, // Not acking
			0x00,
			0x00, // retransmit - set after
			0x00,
			0x00, // 'Client pkt id' Not needed
			0x00,
			0x00, // No Packet Id
		])
		buffer.writeUInt16BE(pktId, 6) // retransmit Id

		return buffer
	}

	test('SendCommand - retransmit request', async () => {
		let acked: Array<{ packetId: number; trackingId: number }> = []
		const child = createSocketChild(undefined, async (ids) => {
			acked.push(...ids)
		})
		try {
			fakeConnect(child)
			const socket = getSocket(child)
			;(child as any)._nextSendPacketId = 32764 // 32767 is max

			let received: number[] = []
			socket.sendImpl = (msg: Buffer): void => {
				const opcode = msg.readUInt8(0) >> 3
				expect(opcode).toEqual(PacketFlag.AckRequest)

				received.push(msg.readUInt16BE(10))
			}

			acked = []

			// Send some stuff
			const buf1 = Buffer.from([0, 1, 2])
			child.sendPackets([
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 5 }, // 32764
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 6 }, // 32765
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 7 }, // 32766
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 8 }, // 32767
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 9 }, // 0
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 10 }, // 1
			])
			expect(received).toEqual([32764, 32765, 32766, 32767, 0, 1])
			received = []
			expect(getInflightIds(child)).toEqual([32764, 32765, 32766, 32767, 0, 1])
			expect(acked).toEqual([])

			// Ack a couple to ensure socket is running properly
			await socket.emitMessage(genAckCommandMessage(32765))
			expect(getInflightIds(child)).toEqual([32766, 32767, 0, 1])
			expect(acked).toEqual([
				{ packetId: 32764, trackingId: 5 },
				{ packetId: 32765, trackingId: 6 },
			])
			acked = []
			expect(received).toEqual([])
			received = []

			// The device asks for a retransmit
			await socket.emitMessage(genRetransmitRequestCommandMessage(32766))
			expect(received).toEqual([32766, 32767, 0, 1])
			received = []

			// And again
			await socket.emitMessage(genRetransmitRequestCommandMessage(32767))
			expect(received).toEqual([32767, 0, 1])
			received = []
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})

	test('SendCommand - retransmit request future', async () => {
		const acked: Array<{ packetId: number; trackingId: number }> = []
		let connected = true
		const child = createSocketChild(
			undefined,
			async (ids) => {
				acked.push(...ids)
			},
			async () => {
				connected = false
			}
		)
		try {
			fakeConnect(child)
			const socket = getSocket(child)
			;(child as any)._nextSendPacketId = 32767 // 32767 is max
			connected = true

			// Send some stuff
			const buf1 = Buffer.from([0, 1, 2])
			child.sendPackets([
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 5 }, // 32767
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 6 }, // 0
			])
			expect(getInflightIds(child)).toEqual([32767, 0])
			expect(acked).toEqual([])
			expect(connected).toBe(true)

			// The device asks for a retransmit of a future packet
			await socket.emitMessage(genRetransmitRequestCommandMessage(1))
			expect(getInflightIds(child)).toEqual([])
			expect(connected).toBe(false)
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})

	test('SendCommand - retransmit request previous', async () => {
		const acked: Array<{ packetId: number; trackingId: number }> = []
		let connected = true
		const child = createSocketChild(
			undefined,
			async (ids) => {
				acked.push(...ids)
			},
			async () => {
				connected = false
			}
		)
		try {
			fakeConnect(child)
			const socket = getSocket(child)
			;(child as any)._nextSendPacketId = 32767 // 32767 is max
			connected = true

			// Send some stuff
			const buf1 = Buffer.from([0, 1, 2])
			child.sendPackets([
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 5 }, // 32767
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 6 }, // 0
			])
			expect(getInflightIds(child)).toEqual([32767, 0])
			expect(acked).toEqual([])
			expect(connected).toBe(true)

			// The device asks for a retransmit of a past packet
			await socket.emitMessage(genRetransmitRequestCommandMessage(32766))
			expect(getInflightIds(child)).toEqual([])
			expect(connected).toBe(false)
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})

	test('Reconnect timer', async () => {
		let acked: Array<{ packetId: number; trackingId: number }> = []
		let connected = true
		const child = createSocketChild(
			undefined,
			async (ids) => {
				acked.push(...ids)
			},
			async () => {
				connected = false
			}
		)
		try {
			fakeConnect(child)
			const socket = getSocket(child)
			;(child as any)._nextSendPacketId = 32767 // 32767 is max
			connected = true

			acked = []

			// Send some stuff
			const buf1 = Buffer.from([0, 1, 2])
			child.sendPackets([
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 5 }, // 32767
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 6 }, // 0
			])
			expect(getInflightIds(child)).toEqual([32767, 0])
			expect(acked).toEqual([])
			expect(connected).toBe(true)

			// Ack a couple to ensure socket is running properly
			await socket.emitMessage(genAckCommandMessage(0))
			expect(getInflightIds(child)).toEqual([])
			expect(acked).toEqual([
				{ packetId: 32767, trackingId: 5 },
				{ packetId: 0, trackingId: 6 },
			])
			acked = []

			// Tick to let the timer execute
			await vi.advanceTimersByTimeAsync(1500)
			expect(connected).toBe(true)
			expect(getInflightIds(child)).toEqual([])
			expect(acked).toEqual([])

			// Still nothing
			await vi.advanceTimersByTimeAsync(1500)
			expect(connected).toBe(true)
			expect(getInflightIds(child)).toEqual([])
			expect(acked).toEqual([])

			// Not quite
			await vi.advanceTimersByTimeAsync(1990)
			expect(connected).toBe(true)
			child.sendPackets([
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 7 }, // 1
			])
			expect(getInflightIds(child)).toEqual([1])
			expect(acked).toEqual([])

			// Timeout
			await vi.advanceTimersByTimeAsync(20)
			expect(connected).toBe(false)
			expect(getInflightIds(child)).toEqual([])
			expect(acked).toEqual([])
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})
})
