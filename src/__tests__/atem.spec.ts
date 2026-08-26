/* eslint-disable @typescript-eslint/unbound-method */
import { Atem, DEFAULT_MAX_PACKET_SIZE, DEFAULT_PORT } from '../atem'
import { CutCommand } from '../commands'
import { promisify } from 'util'
import { EventEmitter } from 'events'

import { AtemSocket } from '../lib/atemSocket'
jest.mock('../lib/atemSocket.ts')

const setImmediatePromise = promisify(setImmediate)

class MockSocket extends EventEmitter {
	destroy(): void {
		// Nothing
	}
}

describe('Atem', () => {
	beforeEach(() => {
		;(AtemSocket as any).mockClear()
	})

	test('constructor test 1', async () => {
		const conn = new Atem({ disableMultithreaded: true })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			expect(socket).toBeTruthy()

			expect(AtemSocket).toHaveBeenCalledTimes(1)
			expect(AtemSocket).toHaveBeenCalledWith({
				address: '',
				childProcessTimeout: 600,
				debugBuffers: false,
				disableMultithreaded: true,
				log: (conn as any)._log,
				port: DEFAULT_PORT,
				maxPacketSize: DEFAULT_MAX_PACKET_SIZE,
			})
		} finally {
			await conn.destroy()
		}
	})
	test('constructor test 2', async () => {
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23, maxPacketSize: 500 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			expect(socket).toBeTruthy()

			expect(AtemSocket).toHaveBeenCalledTimes(1)
			expect(AtemSocket).toHaveBeenCalledWith({
				address: 'test1',
				childProcessTimeout: 600,
				debugBuffers: true,
				disableMultithreaded: false,
				log: (conn as any)._log,
				port: 23,
				maxPacketSize: 500,
			})
		} finally {
			await conn.destroy()
		}
	})

	test('connect', async () => {
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			expect(socket).toBeTruthy()

			socket.connect = jest.fn(() => Promise.resolve(5) as any)

			const res = conn.connect('127.9.8.7', 98)
			expect(await res).toEqual(5)

			expect(socket.connect).toHaveBeenCalledTimes(1)
			expect(socket.connect).toHaveBeenCalledWith('127.9.8.7', 98)
		} finally {
			await conn.destroy()
		}
	})

	test('disconnect', async () => {
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			expect(socket).toBeTruthy()

			socket.disconnect = jest.fn(() => Promise.resolve(35) as any)

			const res = await conn.disconnect()
			expect(res).toEqual(35)

			expect(socket.disconnect).toHaveBeenCalledTimes(1)
			expect(socket.disconnect).toHaveBeenCalledWith()
		} finally {
			await conn.destroy()
		}
	})

	test('sendCommand - good', async () => {
		;(AtemSocket as any).mockImplementation(() => new MockSocket())
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			expect(socket).toBeTruthy()

			let nextId = 123
			Object.defineProperty(socket, 'nextPacketTrackingId', {
				get: jest.fn(() => nextId++),
				set: jest.fn(),
			})
			expect(socket.nextPacketTrackingId).toEqual(123)

			socket.sendCommands = jest.fn(() => Promise.resolve([124]) as any)

			const sentQueue = (conn as any).client._sentQueue as Record<string, unknown>
			expect(Object.keys(sentQueue)).toHaveLength(0)

			const cmd = new CutCommand(0)
			const res = conn.sendCommand(cmd)
			res.catch(() => null) // Dismiss UnhandledPromiseRejection
			await setImmediatePromise()
			expect(Object.keys(sentQueue)).toHaveLength(1)

			expect(socket.sendCommands).toHaveBeenCalledTimes(1)
			expect(socket.sendCommands).toHaveBeenCalledWith([cmd])

			// Trigger the ack, and it should switfy resolve
			socket.emit('ackPackets', [124])
			expect(Object.keys(sentQueue)).toHaveLength(0)

			// Finally, it should now resolve without a timeout
			expect(await res).toBeUndefined()
		} finally {
			await conn.destroy()
		}
	}, 500)

	test('sendCommand - send error', async () => {
		;(AtemSocket as any).mockImplementation(() => new MockSocket())
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).client.socket as AtemSocket
			expect(socket).toBeTruthy()

			let nextId = 123
			Object.defineProperty(socket, 'nextPacketTrackingId', {
				get: jest.fn(() => nextId++),
				set: jest.fn(),
			})
			expect(socket.nextPacketTrackingId).toEqual(123)

			socket.sendCommands = jest.fn(() => Promise.reject(35) as any)

			const sentQueue = (conn as any).client._sentQueue as Record<string, unknown>
			expect(Object.keys(sentQueue)).toHaveLength(0)

			const cmd = new CutCommand(0)
			const res = conn.sendCommand(cmd)
			res.catch(() => null) // Dismiss UnhandledPromiseRejection

			// Send command should be called
			expect(socket.sendCommands).toHaveBeenCalledTimes(1)
			expect(socket.sendCommands).toHaveBeenCalledWith([cmd])

			expect(Object.keys(sentQueue)).toHaveLength(0)

			// Finally, it should now resolve without a timeout
			// Should be the error thrown by sendCommand
			await expect(res).rejects.toBe(35)

			// expect(await res).toEqual(cmd)
		} finally {
			await conn.destroy()
		}
	}, 500)

	test('sendCommands - default group sent together in a single call', async () => {
		;(AtemSocket as any).mockImplementation(() => new MockSocket())
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).socket as AtemSocket
			socket.sendCommands = jest.fn(() => Promise.resolve([]) as any)

			// All commands use the default runOrderGroup (0), so they are sent as one batch
			const cmds = [new CutCommand(0), new CutCommand(1), new CutCommand(2)]
			await conn.sendCommands(cmds)

			expect(socket.sendCommands).toHaveBeenCalledTimes(1)
			expect(socket.sendCommands).toHaveBeenCalledWith(cmds)
		} finally {
			await conn.destroy()
		}
	})

	test('sendCommands - splits by runOrderGroup and sends groups in ascending numeric order', async () => {
		;(AtemSocket as any).mockImplementation(() => new MockSocket())
		const conn = new Atem({ debugBuffers: true, address: 'test1', port: 23 })

		try {
			const socket = (conn as any).socket as AtemSocket
			socket.sendCommands = jest.fn(() => Promise.resolve([]) as any)

			const mk = (group: number): CutCommand => {
				const cmd = new CutCommand(0)
				cmd.runOrderGroup = group
				return cmd
			}

			// Deliberately out of order, mixing a negative and a multi-digit group.
			// A lexicographic sort would place group 10 before group 2 - this catches that.
			const gNeg = mk(-5)
			const g0a = mk(0)
			const g0b = mk(0)
			const g2 = mk(2)
			const g10 = mk(10)

			await conn.sendCommands([g10, g2, g0a, gNeg, g0b])

			// One socket.sendCommands call per group, ordered by ascending runOrderGroup,
			// with same-group commands preserving their original input order
			const callArgs = (socket.sendCommands as jest.Mock).mock.calls.map((call) => call[0])
			expect(callArgs).toEqual([[gNeg], [g0a, g0b], [g2], [g10]])
		} finally {
			await conn.destroy()
		}
	})
})
