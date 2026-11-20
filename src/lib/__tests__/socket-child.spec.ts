jest.mock('dgram')
import { Socket } from '../__mocks__/dgram'
import { AtemSocketChild, COMMAND_CONNECT_HELLO, ConnectionState, PacketFlag } from '../atemSocketChild'
import * as fakeTimers from '@sinonjs/fake-timers'
import { DEFAULT_PORT } from '../../atem'
import { performance } from 'perf_hooks'
import * as sinon from 'sinon'
import { promises as dns } from 'dns'

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
	let clock: fakeTimers.InstalledClock
	beforeEach(() => {
		clock = fakeTimers.install()
	})
	beforeAll(() => {
		const startup = Date.now()
		sinon.stub(performance, 'now').callsFake(() => Date.now() - startup)
	})
	afterEach(() => {
		clock.uninstall()
	})
	afterAll(() => {
		sinon.restore()
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
			clock.tick(20)

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
				clock,
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
			await clock.tickAsync(20)

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

			await socket.emitMessage(clock, genAckRequestMessage(1))

			// Nothing should have been sent immediately
			expect(acked).toEqual([])
			expect(gotUnknown).toBeFalse()

			// Still nothing sent
			clock.tick(4)
			expect(acked).toEqual([])
			expect(gotUnknown).toBeFalse()

			// Should be an ack a little later
			clock.tick(10)
			expect(acked).toEqual([1])
			expect(gotUnknown).toBeFalse()
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
				await socket.emitMessage(clock, genAckRequestMessage(i))
			}

			// Nothing should have been sent yet
			await clock.tickAsync(4)
			expect(acked).toEqual([])
			expect(gotUnknown).toBeFalse()

			// One more will trigger an ack
			await socket.emitMessage(clock, genAckRequestMessage(16))
			expect(acked).toEqual([16])
			expect(gotUnknown).toBeFalse()
			acked = []

			// Nothing more should be acked
			clock.tick(10)
			expect(acked).toEqual([])
			expect(gotUnknown).toBeFalse()
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
			await socket.emitMessage(clock, genAckRequestMessage(1))
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBeFalse()

			// Some payload
			const buffer = Buffer.concat([genAckRequestMessage(2, 1), Buffer.from([0])])
			await socket.emitMessage(clock, buffer)
			expect(gotCmds).toEqual([1])
			expect(gotUnknown).toBeFalse()
			gotCmds = []

			// Repeated should not re-emit
			await socket.emitMessage(clock, buffer)
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBeFalse()

			// Previous should not re-emit
			await socket.emitMessage(clock, Buffer.concat([genAckRequestMessage(1, 1), Buffer.from([0])]))
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBeFalse()

			// Another payload
			await socket.emitMessage(clock, Buffer.concat([genAckRequestMessage(3, 1), Buffer.from([0])]))
			expect(gotCmds).toEqual([1])
			expect(gotUnknown).toBeFalse()
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
			await socket.emitMessage(clock, Buffer.concat([genAckRequestMessage(32766, 1), Buffer.from([0])]))
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBeFalse()

			// Some payload
			const lastBuffer = Buffer.concat([genAckRequestMessage(32767, 1), Buffer.from([0])])
			await socket.emitMessage(clock, lastBuffer)
			expect(gotCmds).toEqual([1])
			expect(gotUnknown).toBeFalse()
			gotCmds = []

			// Should not re-emit
			await socket.emitMessage(clock, lastBuffer)
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBeFalse()
			gotCmds = []

			// Now it has wrapped
			const firstBuffer = Buffer.concat([genAckRequestMessage(0, 1), Buffer.from([0])])
			await socket.emitMessage(clock, firstBuffer)
			expect(gotCmds).toEqual([1])
			expect(gotUnknown).toBeFalse()
			gotCmds = []

			// Next buffer
			await socket.emitMessage(clock, Buffer.concat([genAckRequestMessage(1, 1), Buffer.from([0])]))
			expect(gotCmds).toEqual([1])
			expect(gotUnknown).toBeFalse()
			gotCmds = []

			// Should not re-emit
			await socket.emitMessage(clock, firstBuffer)
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBeFalse()
			gotCmds = []

			// Retransmit of lastBuffer is not uncommon, it should not re-emit
			await socket.emitMessage(clock, lastBuffer)
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBeFalse()
			gotCmds = []

			// Ensure that the first buffer still does not re-emit
			await socket.emitMessage(clock, firstBuffer)
			expect(gotCmds).toEqual([])
			expect(gotUnknown).toBeFalse()
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
					payload: msg.subarray(12),
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

	test('SendCommands - rejected when not connected', async () => {
		const child = createSocketChild()
		try {
			await child.connect(ADDRESS, DEFAULT_PORT)
			expect(getState(child)).toEqual(ConnectionState.SynSent)

			// Anything sent now would be dropped by the next reconnect attempt, never to be acked
			expect(() => child.sendPackets([{ payloadLength: 1, payloadHex: '00', trackingId: 1 }])).toThrow(
				'Not connected'
			)
			expect(getInflightIds(child)).toEqual([])
		} finally {
			await child.disconnect()
		}
	})

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
			await socket.emitMessage(clock, genAckCommandMessage(125))
			expect(getInflightIds(child)).toEqual([126, 127, 128])
			expect(acked).toEqual([
				{ packetId: 123, trackingId: 5 },
				{ packetId: 124, trackingId: 6 },
				{ packetId: 125, trackingId: 7 },
			])
			acked = []

			// Another ack
			await socket.emitMessage(clock, genAckCommandMessage(126))
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
			await socket.emitMessage(clock, genAckCommandMessage(32766))
			expect(getInflightIds(child)).toEqual([32767, 0, 1])
			expect(acked).toEqual([
				{ packetId: 32764, trackingId: 5 },
				{ packetId: 32765, trackingId: 6 },
				{ packetId: 32766, trackingId: 7 },
			])
			acked = []

			// Another ack
			await socket.emitMessage(clock, genAckCommandMessage(0))
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
			await socket.emitMessage(clock, genAckCommandMessage(32765))
			expect(getInflightIds(child)).toEqual([32766, 32767, 0, 1])
			expect(acked).toEqual([
				{ packetId: 32764, trackingId: 5 },
				{ packetId: 32765, trackingId: 6 },
			])
			acked = []
			expect(received).toEqual([])
			received = []

			// Let the commands be resent
			await clock.tickAsync(80)
			expect(received).toEqual([32766, 32767, 0, 1])
			received = []

			// Should keep happening
			await clock.tickAsync(80)
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
			await clock.tickAsync(80)
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
			await socket.emitMessage(clock, genAckCommandMessage(32765))
			expect(getInflightIds(child)).toEqual([32766, 32767, 0, 1])
			expect(acked).toEqual([
				{ packetId: 32764, trackingId: 5 },
				{ packetId: 32765, trackingId: 6 },
			])
			acked = []
			expect(received).toEqual([])
			received = []

			// The device asks for a retransmit
			await socket.emitMessage(clock, genRetransmitRequestCommandMessage(32766))
			expect(received).toEqual([32766, 32767, 0, 1])
			received = []

			// And again
			await socket.emitMessage(clock, genRetransmitRequestCommandMessage(32767))
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
			expect(connected).toBeTrue()

			// The device asks for a retransmit of a future packet
			await socket.emitMessage(clock, genRetransmitRequestCommandMessage(1))
			expect(getInflightIds(child)).toEqual([])
			expect(connected).toBeFalse()
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
			expect(connected).toBeTrue()

			// The device asks for a retransmit of a past packet
			await socket.emitMessage(clock, genRetransmitRequestCommandMessage(32766))
			expect(getInflightIds(child)).toEqual([])
			expect(connected).toBeFalse()
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
			expect(connected).toBeTrue()

			// Ack a couple to ensure socket is running properly
			await socket.emitMessage(clock, genAckCommandMessage(0))
			expect(getInflightIds(child)).toEqual([])
			expect(acked).toEqual([
				{ packetId: 32767, trackingId: 5 },
				{ packetId: 0, trackingId: 6 },
			])
			acked = []

			// Tick to let the timer execute
			await clock.tickAsync(1500)
			expect(connected).toBeTrue()
			expect(getInflightIds(child)).toEqual([])
			expect(acked).toEqual([])

			// Still nothing
			await clock.tickAsync(1500)
			expect(connected).toBeTrue()
			expect(getInflightIds(child)).toEqual([])
			expect(acked).toEqual([])

			// Not quite
			await clock.tickAsync(1990)
			expect(connected).toBeTrue()
			child.sendPackets([
				{ payloadLength: buf1.length, payloadHex: buf1.toString('hex'), trackingId: 7 }, // 1
			])
			expect(getInflightIds(child)).toEqual([1])
			expect(acked).toEqual([])

			// Timeout
			await clock.tickAsync(20)
			expect(connected).toBeFalse()
			expect(getInflightIds(child)).toEqual([])
			expect(acked).toEqual([])
		} finally {
			if (child) {
				// Try and cleanup any timers
				await child.disconnect()
			}
		}
	})

	function genPayloadMessage(pktId: number): Buffer {
		// Payload carries the packet id, so delivery order can be checked from the payload itself
		const payload = Buffer.alloc(2)
		payload.writeUInt16BE(pktId, 0)
		return Buffer.concat([genAckRequestMessage(pktId, 2), payload])
	}

	function genNewSessionMessage(pktId: number): Buffer {
		const buffer = Buffer.from([
			0x10,
			0x0c, // Length & Type
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

	function createOutOfOrderHarness() {
		const delivered: number[] = []
		const child = createSocketChild(async (buf, packetId) => {
			// The payload must belong to the packet id it is delivered with
			expect(buf.readUInt16BE(0)).toEqual(packetId)
			delivered.push(packetId)
			return Promise.resolve()
		})
		fakeConnect(child)
		const socket = getSocket(child)

		const acked: number[] = []
		socket.sendImpl = (msg: Buffer): void => {
			const opcode = msg.readUInt8(0) >> 3
			expect(opcode).toEqual(PacketFlag.AckReply)
			acked.push(msg.readUInt16BE(4))
		}

		return { child, socket, delivered, acked }
	}

	test('Inbound commands - out of order packets are buffered until the gap is filled', async () => {
		const { child, socket, delivered, acked } = createOutOfOrderHarness()
		try {
			// Packet 1 is lost, 2-4 arrive ahead of sequence
			await socket.emitMessage(clock, genPayloadMessage(2))
			await socket.emitMessage(clock, genPayloadMessage(3))
			await socket.emitMessage(clock, genPayloadMessage(4))
			await clock.tickAsync(20)
			expect(delivered).toEqual([])
			expect(acked).toEqual([])

			// The missing packet arrives: everything is delivered in order, and acked straight away
			await socket.emitMessage(clock, genPayloadMessage(1))
			expect(delivered).toEqual([1, 2, 3, 4])
			expect(acked).toEqual([4])
			expect((child as any)._lastReceivedPacketId).toEqual(4)

			// Sequence continues normally afterwards
			await socket.emitMessage(clock, genPayloadMessage(5))
			await clock.tickAsync(20)
			expect(delivered).toEqual([1, 2, 3, 4, 5])
			expect(acked).toEqual([4, 5])
		} finally {
			await child.disconnect()
		}
	})

	test('Inbound commands - out of order packets around wrap', async () => {
		const { child, socket, delivered, acked } = createOutOfOrderHarness()
		try {
			;(child as any)._lastReceivedPacketId = 32766 // 32767 is max

			await socket.emitMessage(clock, genPayloadMessage(0))
			await socket.emitMessage(clock, genPayloadMessage(1))
			await clock.tickAsync(20)
			expect(delivered).toEqual([])

			await socket.emitMessage(clock, genPayloadMessage(32767))
			expect(delivered).toEqual([32767, 0, 1])
			expect(acked).toEqual([1])
		} finally {
			await child.disconnect()
		}
	})

	test('Inbound commands - retransmits of buffered packets are not delivered twice', async () => {
		const { child, socket, delivered, acked } = createOutOfOrderHarness()
		try {
			await socket.emitMessage(clock, genPayloadMessage(2))
			await socket.emitMessage(clock, genPayloadMessage(2))
			await socket.emitMessage(clock, genPayloadMessage(3))
			await socket.emitMessage(clock, genPayloadMessage(2))
			await socket.emitMessage(clock, genPayloadMessage(3))
			expect(delivered).toEqual([])

			await socket.emitMessage(clock, genPayloadMessage(1))
			expect(delivered).toEqual([1, 2, 3])
			expect(acked).toEqual([3])

			// Late retransmits of already delivered packets are re-acked, not re-delivered
			await socket.emitMessage(clock, genPayloadMessage(1))
			await socket.emitMessage(clock, genPayloadMessage(2))
			await socket.emitMessage(clock, genPayloadMessage(3))
			await clock.tickAsync(20)
			expect(delivered).toEqual([1, 2, 3])
			expect(acked).toEqual([3, 3])
		} finally {
			await child.disconnect()
		}
	})

	test('Inbound commands - packets too far ahead are not buffered', async () => {
		const { child, socket, delivered } = createOutOfOrderHarness()
		try {
			// Way beyond any sane reorder window
			await socket.emitMessage(clock, genPayloadMessage(5000))
			expect((child as any)._outOfOrderPackets.size).toEqual(0)

			await socket.emitMessage(clock, genPayloadMessage(1))
			expect(delivered).toEqual([1])
		} finally {
			await child.disconnect()
		}
	})

	test('Inbound commands - packet ids beyond 15 bits are ignored', async () => {
		const { child, socket, delivered } = createOutOfOrderHarness()
		try {
			// Fill the whole reorder window, along with the 16 bit alias of every id in it
			for (let pktId = 2; pktId <= 256; pktId++) {
				await socket.emitMessage(clock, genPayloadMessage(pktId))
				await socket.emitMessage(clock, genPayloadMessage(pktId + 32768))
			}
			expect((child as any)._outOfOrderPackets.size).toEqual(255)
			expect([...(child as any)._outOfOrderPackets.keys()].every((pktId: number) => pktId < 32768)).toBeTrue()

			// The alias of the next packet is not accepted in its place
			await socket.emitMessage(clock, genPayloadMessage(1 + 32768))
			expect(delivered).toEqual([])
			expect((child as any)._lastReceivedPacketId).toEqual(0)

			// The real packet drains the whole window, leaving nothing behind
			await socket.emitMessage(clock, genPayloadMessage(1))
			expect(delivered).toHaveLength(256)
			expect((child as any)._outOfOrderPackets.size).toEqual(0)
			expect((child as any)._outOfOrderStalledSince).toBeUndefined()
		} finally {
			await child.disconnect()
		}
	})

	test('Inbound - malformed packets are ignored', async () => {
		const { child, socket, delivered, acked } = createOutOfOrderHarness()
		try {
			// Too short to hold a header, but with a matching length. These used to throw from the socket handler
			for (const msg of [
				Buffer.alloc(0),
				Buffer.from([0x00, 0x02]),
				Buffer.from([0x08, 0x0b, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
			]) {
				expect(() =>
					socket.emit('message', msg, {
						address: ADDRESS,
						port: DEFAULT_PORT,
						family: 'IPv4',
						size: msg.length,
					})
				).not.toThrow()
			}
			await clock.tickAsync(20)
			expect(delivered).toEqual([])
			expect(acked).toEqual([])
			expect(getState(child)).toEqual(ConnectionState.Established)
		} finally {
			await child.disconnect()
		}
	})

	test('Inbound - packets from other addresses are ignored', async () => {
		const { child, socket, delivered } = createOutOfOrderHarness()
		try {
			const msg = genPayloadMessage(1)
			socket.emit('message', msg, { address: '10.0.0.99', port: DEFAULT_PORT, family: 'IPv4', size: msg.length })
			socket.emit('message', genNewSessionMessage(500), {
				address: '10.0.0.99',
				port: DEFAULT_PORT,
				family: 'IPv4',
				size: 12,
			})
			await clock.tickAsync(20)
			expect(delivered).toEqual([])
			expect((child as any)._lastReceivedPacketId).toEqual(0)

			// The real atem is still heard
			await socket.emitMessage(clock, msg)
			expect(delivered).toEqual([1])
		} finally {
			await child.disconnect()
		}
	})

	test('Hostnames are resolved once, and used to filter inbound packets', async () => {
		const lookup = jest.spyOn(dns, 'lookup').mockResolvedValue({ address: '10.0.0.5', family: 4 } as any)
		const child = createSocketChild()
		try {
			const socket = getSocket(child)
			socket.expectedAddress = '10.0.0.5'
			const sent: Buffer[] = []
			socket.sendImpl = (msg) => sent.push(msg)

			await child.connect('atem.local', DEFAULT_PORT)
			expect(lookup).toHaveBeenCalledTimes(1)
			expect(lookup).toHaveBeenCalledWith('atem.local', { family: 4 })
			expect(sent).toEqual([COMMAND_CONNECT_HELLO])

			// Only the resolved address is listened to
			const hello = genNewSessionMessage(0)
			socket.emit('message', hello, {
				address: '10.0.0.99',
				port: DEFAULT_PORT,
				family: 'IPv4',
				size: hello.length,
			})
			expect(getState(child)).toEqual(ConnectionState.SynSent)
			await socket.emitMessage(clock, hello)
			expect(getState(child)).toEqual(ConnectionState.Established)
		} finally {
			await child.disconnect()
			lookup.mockRestore()
		}
	})

	test('Hostnames are re-resolved before each reconnect attempt', async () => {
		const lookup = jest.spyOn(dns, 'lookup').mockResolvedValue({ address: '10.0.0.5', family: 4 } as any)
		const child = createSocketChild()
		try {
			const socket = getSocket(child)
			socket.expectedAddress = undefined
			const sentTo: string[] = []
			socket.send = (_msg: any, _offset: any, _length: any, _port: any, address: any) => {
				sentTo.push(address)
			}

			await child.connect('atem.local', DEFAULT_PORT)
			expect(sentTo).toEqual(['10.0.0.5'])

			// The device changes ip, and the next attempt goes straight to the new one
			lookup.mockResolvedValue({ address: '10.0.0.6', family: 4 } as any)
			await clock.tickAsync(1000) // Nothing heard, so the reconnect timer retries
			expect(lookup).toHaveBeenCalledTimes(2)
			expect(sentTo).toEqual(['10.0.0.5', '10.0.0.6'])
		} finally {
			await child.disconnect()
			lookup.mockRestore()
		}
	})

	test('A disconnect during a hostname lookup stops the connection attempt', async () => {
		let resolveLookup: (v: any) => void = () => null
		const lookup = jest
			.spyOn(dns, 'lookup')
			.mockImplementation(async () => new Promise((resolve) => (resolveLookup = resolve)) as any)
		const child = createSocketChild()
		try {
			const socket = getSocket(child)
			const sent: Buffer[] = []
			socket.sendImpl = (msg) => sent.push(msg)

			const connecting = child.connect('atem.local', DEFAULT_PORT)
			await child.disconnect()
			resolveLookup({ address: '10.0.0.5', family: 4 })
			await connecting
			await clock.tickAsync(5000)

			expect(sent).toEqual([])
			expect(getState(child)).toEqual(ConnectionState.Disconnected)
		} finally {
			lookup.mockRestore()
		}
	})

	test('A failed hostname lookup falls back to the hostname', async () => {
		const lookup = jest.spyOn(dns, 'lookup').mockRejectedValue(new Error('ENOTFOUND'))
		const child = createSocketChild()
		try {
			const socket = getSocket(child)
			socket.expectedAddress = 'atem.local'
			const sent: Buffer[] = []
			socket.sendImpl = (msg) => sent.push(msg)

			await child.connect('atem.local', DEFAULT_PORT)
			expect(sent).toEqual([COMMAND_CONNECT_HELLO])
			expect(getState(child)).toEqual(ConnectionState.SynSent)
		} finally {
			await child.disconnect()
			lookup.mockRestore()
		}
	})

	test('connection attempts back off exponentially, up to the maximum', async () => {
		const child = new AtemSocketChild(
			{ address: ADDRESS, port: DEFAULT_PORT, debugBuffers: false, maxReconnectDelay: 4000 },
			async () => Promise.resolve(),
			async () => Promise.resolve(),
			async () => Promise.resolve(),
			async () => Promise.resolve()
		)
		try {
			const socket = getSocket(child)
			const start = clock.now
			const attempts: number[] = []
			// Spy on the child rather than the socket, as a reconnect replaces the socket
			jest.spyOn(child as any, '_sendPacket').mockImplementation((msg: any) => {
				if (msg.equals(COMMAND_CONNECT_HELLO)) attempts.push(clock.now - start)
			})

			await child.connect(ADDRESS, DEFAULT_PORT)
			await clock.tickAsync(16000)
			// Waits of 1s, 2s, then the 4s maximum
			expect(attempts).toEqual([0, 1000, 3000, 7000, 11000, 15000])

			// Once connected, losing the connection starts again from the shortest wait
			await socket.emitMessage(clock, genNewSessionMessage(0))
			expect(getState(child)).toEqual(ConnectionState.Established)
			attempts.length = 0
			const lost = clock.now - start
			await clock.tickAsync(9000)
			expect(attempts.map((t) => t - lost)).toEqual([5000, 6000, 8000])
		} finally {
			await child.disconnect()
		}
	})

	describe('lifecycle races', () => {
		test('a disconnect while a restart waits on onDisconnect is not undone', async () => {
			let release: () => void = () => null
			let calls = 0
			const child = createSocketChild(undefined, undefined, async () => {
				// Hold up the first onDisconnect, which is the one from the restart
				if (++calls === 1) await new Promise<void>((resolve) => (release = resolve))
			})
			fakeConnect(child)

			const restarting = (child as any).restartConnection()
			await clock.tickAsync(0)
			await child.disconnect()
			release()
			await restarting

			expect(getState(child)).toEqual(ConnectionState.Disconnected)
			expect(clock.countTimers()).toEqual(0)
		})

		test('connect straight after disconnect, without waiting, connects', async () => {
			const child = createSocketChild()
			try {
				await child.connect(ADDRESS, DEFAULT_PORT)
				const oldSocket = getSocket(child)

				const disconnecting = child.disconnect()
				const connecting = child.connect(ADDRESS, DEFAULT_PORT)
				await disconnecting
				await connecting

				expect(getState(child)).toEqual(ConnectionState.SynSent)
				const newSocket = (child as any)._socket
				expect(newSocket).not.toBe(oldSocket)
				expect(newSocket.isOpen).toBeTrue()
			} finally {
				await child.disconnect()
			}
		})

		test('the rest of a packet which triggered a restart is ignored', async () => {
			const child = createSocketChild()
			try {
				fakeConnect(child)
				const socket = getSocket(child)
				socket.sendImpl = () => null
				child.sendPackets([
					{ payloadLength: 1, payloadHex: '00', trackingId: 1 },
					{ payloadLength: 1, payloadHex: '00', trackingId: 2 },
				])

				// Asks for a packet which isn't in flight (which forces a restart), and acks packet 1
				const packet = Buffer.alloc(12)
				packet.writeUInt16BE(((PacketFlag.RetransmitRequest | PacketFlag.AckReply) << 11) | 12, 0)
				packet.writeUInt16BE(1, 4) // Ack id
				packet.writeUInt16BE(99, 6) // Retransmit from
				await socket.emitMessage(clock, packet)

				expect(getInflightIds(child)).toEqual([])
				expect((child as any)._retransmitTimer).toBeUndefined()
			} finally {
				await child.disconnect()
			}
		})

		test('a late handshake reply during a restart is ignored', async () => {
			let resolveLookup: (v: any) => void = () => null
			const lookup = jest
				.spyOn(dns, 'lookup')
				.mockImplementation(async () => new Promise((resolve) => (resolveLookup = resolve)) as any)
			const child = createSocketChild()
			try {
				const socket = getSocket(child)
				socket.expectedAddress = undefined
				socket.sendImpl = () => null

				const connecting = child.connect('atem.local', DEFAULT_PORT)
				// A reply to an older hello arrives while waiting for the lookup
				socket.emit('message', genNewSessionMessage(0), {
					address: 'atem.local',
					port: DEFAULT_PORT,
					family: 'IPv4',
					size: 12,
				})
				expect(getState(child)).toEqual(ConnectionState.Closed)

				resolveLookup({ address: '10.0.0.5', family: 4 })
				await connecting
				expect(getState(child)).toEqual(ConnectionState.SynSent)
			} finally {
				await child.disconnect()
				lookup.mockRestore()
			}
		})
	})

	test('Inbound commands - out of order buffer is cleared by a new session', async () => {
		const { child, socket, delivered, acked } = createOutOfOrderHarness()
		try {
			await socket.emitMessage(clock, genPayloadMessage(3))
			await socket.emitMessage(clock, genPayloadMessage(4))
			expect(delivered).toEqual([])
			expect((child as any)._outOfOrderPackets.size).toEqual(2)

			// The device starts a new session, the buffered packets belong to the old one
			await socket.emitMessage(clock, genNewSessionMessage(0))
			expect((child as any)._outOfOrderPackets.size).toEqual(0)
			expect(acked).toEqual([0])

			await socket.emitMessage(clock, genPayloadMessage(1))
			await socket.emitMessage(clock, genPayloadMessage(2))
			expect(delivered).toEqual([1, 2])

			// Buffer again, then a reconnect must also clear it
			await socket.emitMessage(clock, genPayloadMessage(5))
			expect((child as any)._outOfOrderPackets.size).toEqual(1)
			await child.connect(ADDRESS, DEFAULT_PORT)
			expect((child as any)._outOfOrderPackets.size).toEqual(0)
		} finally {
			await child.disconnect()
		}
	})

	test('Inbound commands - a gap that never fills triggers a reconnect, even with other traffic', async () => {
		let connected = true
		const child = createSocketChild(undefined, undefined, async () => {
			connected = false
		})
		try {
			fakeConnect(child)
			const socket = getSocket(child)
			socket.sendImpl = (): void => {
				// Ignore acks and the reconnect hello
			}

			// Packet 1 is lost
			await socket.emitMessage(clock, genPayloadMessage(2))
			expect((child as any)._outOfOrderPackets.size).toEqual(1)

			// Keep hearing ack replies from the atem, which would otherwise keep the connection alive
			for (let i = 0; i < 9; i++) {
				await clock.tickAsync(500)
				await socket.emitMessage(clock, genAckCommandMessage(0))
				// More packets pile up behind the gap
				await socket.emitMessage(clock, genPayloadMessage(3 + i))
			}
			expect(connected).toBeTrue()

			// The stall exceeds the connection timeout
			await clock.tickAsync(1000)
			await socket.emitMessage(clock, genAckCommandMessage(0))
			expect(connected).toBeFalse()
			expect((child as any)._outOfOrderPackets.size).toEqual(0)
			expect((child as any)._outOfOrderStalledSince).toBeUndefined()
		} finally {
			await child.disconnect()
		}
	})

	test('Inbound commands - progress through the buffer restarts the stall clock', async () => {
		let connected = true
		const delivered: number[] = []
		const child = createSocketChild(
			async (_buf, packetId) => {
				delivered.push(packetId)
			},
			undefined,
			async () => {
				connected = false
			}
		)
		try {
			fakeConnect(child)
			const socket = getSocket(child)
			socket.sendImpl = (): void => {
				// Ignore acks
			}

			// 1 and 3 lost
			await socket.emitMessage(clock, genPayloadMessage(2))
			await socket.emitMessage(clock, genPayloadMessage(4))

			// 1 is recovered after 4s, which drains 2 but leaves 4 waiting behind 3
			await clock.tickAsync(4000)
			await socket.emitMessage(clock, genPayloadMessage(1))
			expect(delivered).toEqual([1, 2])
			expect((child as any)._outOfOrderPackets.size).toEqual(1)

			// 4s more is beyond 5s since the first gap, but not since the progress
			await clock.tickAsync(4000)
			expect(connected).toBeTrue()

			// 3 is recovered, everything drains and the stall is over
			await socket.emitMessage(clock, genPayloadMessage(3))
			expect(delivered).toEqual([1, 2, 3, 4])
			expect((child as any)._outOfOrderStalledSince).toBeUndefined()

			// Normal traffic keeps it alive well past the old stall deadline
			for (let i = 5; i < 10; i++) {
				await clock.tickAsync(1000)
				await socket.emitMessage(clock, genPayloadMessage(i))
			}
			expect(connected).toBeTrue()
		} finally {
			await child.disconnect()
		}
	})

	test('Inbound commands - backlog drains under per-frame retransmit bursts', async () => {
		// Models a capture against a real ATEM: after one lost packet the ATEM retransmits its unacked window
		// once per frame in bursts where the packets are interleaved with a stride of 3, while also sending a
		// new unsolicited packet (Time) every frame. Without a reorder buffer only one packet per frame is
		// accepted, which equals the arrival rate, so the backlog never drains.
		const { child, socket, delivered, acked } = createOutOfOrderHarness()
		try {
			const lastAcked = (): number => (acked.length ? acked[acked.length - 1] : 0)

			let atemNextId = 1
			// Initial stream at one packet per frame, with packet 1 lost on the way
			for (let frame = 0; frame < 22; frame++) {
				const id = atemNextId++
				if (id !== 1) await socket.emitMessage(clock, genPayloadMessage(id))
				await clock.tickAsync(20)
			}

			const backlogs: number[] = []
			for (let frame = 0; frame < 30; frame++) {
				const oldestUnacked = lastAcked() + 1
				const newestSent = atemNextId - 1
				// Retransmit burst: the oldest unacked packet, then part of the window at stride 3 with a rotating
				// phase that never includes oldest + 1. So exactly one packet per burst is next in sequence.
				const burst: number[] = []
				if (oldestUnacked <= newestSent) burst.push(oldestUnacked)
				for (let id = oldestUnacked + 2 + (frame % 3); id <= newestSent; id += 3) burst.push(id)
				for (const id of burst) await socket.emitMessage(clock, genPayloadMessage(id))

				// Plus one new packet per frame
				await socket.emitMessage(clock, genPayloadMessage(atemNextId++))
				await clock.tickAsync(20)

				backlogs.push(atemNextId - 1 - lastAcked())
			}

			// The backlog must have drained, rather than staying constant
			expect(backlogs[backlogs.length - 1]).toEqual(0)
			expect(backlogs.slice(-10)).toEqual(Array(10).fill(0))

			// Every packet delivered exactly once, in order
			const expected: number[] = []
			for (let id = 1; id < atemNextId; id++) expected.push(id)
			expect(delivered).toEqual(expected)
		} finally {
			await child.disconnect()
		}
	})
})
